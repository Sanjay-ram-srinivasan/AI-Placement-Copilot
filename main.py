from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
from pathlib import Path
import shutil
import os

from app.rag import ask_question
from app.notes import SUPPORTED_EXTENSIONS, delete_note_file, ingest_note_files, list_note_files
from app.resume import analyze_resume
from app.job_match import match_job
from app.interview import evaluate_interview_answer, generate_interview_questions
from app.study_plan import generate_study_plan
from app.ollama_client import ollama_status
from app.quiz import generate_quiz

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Placement & Learning Copilot",
    description="Enterprise Agentic RAG Platform for education, placements, and interview preparation.",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Track latest uploaded resume ─────────────────────────────────────────────
_latest_resume_filename: str | None = None

# ── Request models ────────────────────────────────────────────────────────────
class QuestionRequest(BaseModel):
    question: str

class JobMatchRequest(BaseModel):
    job_description: str

class InterviewRequest(BaseModel):
    role: str = Field(default="Software Engineer", examples=["ML Engineer", "Backend Developer"])
    difficulty: str = Field(default="Medium", examples=["Easy", "Medium", "Hard"])
    num_questions: int = Field(default=5, ge=3, le=20)
    experience_level: str = Field(default="Fresher", examples=["Fresher", "1-3 Years", "3-5 Years"])

class InterviewEvaluationRequest(BaseModel):
    role: str
    experience_level: str = "Fresher"
    question: str
    model_answer: str = ""
    user_answer: str

class StudyPlanRequest(BaseModel):
    target_role: str = Field(default="Software Engineer", examples=["ML Engineer", "Data Scientist"])
    duration_weeks: int = Field(default=8, ge=4, le=16)

class QuizRequest(BaseModel):
    selected_files: list[str]
    question_type: str = Field(default="mcq", examples=["mcq", "short", "long", "mixed"])
    question_count: int = Field(default=10, examples=[5, 10, 20, 50])
    difficulty: str = Field(default="medium", examples=["easy", "medium", "hard"])
    topic_scope: str = Field(default="entire", examples=["entire", "specific"])
    topic: str = ""


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def home():
    return {"message": "AI Placement & Learning Copilot v2.0 — Running ✅"}

@app.get("/health", tags=["Health"])
def health():
    """Check server and Ollama status."""
    ollama = ollama_status()
    return {
        "status": "ok",
        "ollama": ollama,
        "latest_resume": _latest_resume_filename,
    }


# ── Resume ───────────────────────────────────────────────────────────────────
@app.post("/upload-resume", tags=["Resume"])
async def upload_resume(file: UploadFile = File(...)):
    """Upload a PDF resume. Stores it and tracks it as the active resume."""
    global _latest_resume_filename

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    os.makedirs("data/resumes", exist_ok=True)
    safe_filename = os.path.basename(file.filename)
    save_path = f"data/resumes/{safe_filename}"

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    _latest_resume_filename = safe_filename

    return {
        "message": "Resume uploaded successfully ✅",
        "filename": safe_filename,
    }


@app.post("/resume-analysis", tags=["Resume"])
def resume_analysis():
    """Perform ATS-style analysis on the uploaded resume using Ollama."""
    result = analyze_resume(filename=_latest_resume_filename)
    return result


# ── Job Match ────────────────────────────────────────────────────────────────
@app.post("/job-match", tags=["Job Match"])
async def job_match(request: Request):
    """Compare a resume PDF against a job description.

    Accepts JSON for existing clients:
      {"job_description": "..."}

    Also accepts multipart/form-data for the Job Match page:
      file=<resume.pdf>, job_description="..."
    """
    global _latest_resume_filename

    content_type = request.headers.get("content-type", "")
    job_description = ""

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        job_description = str(form.get("job_description") or "")
        upload = form.get("file")

        if upload is not None:
            if not getattr(upload, "filename", "").endswith(".pdf"):
                raise HTTPException(status_code=400, detail="Only PDF files are supported.")

            os.makedirs("data/resumes", exist_ok=True)
            safe_filename = os.path.basename(upload.filename)
            save_path = f"data/resumes/{safe_filename}"
            with open(save_path, "wb") as buffer:
                shutil.copyfileobj(upload.file, buffer)
            _latest_resume_filename = safe_filename
    else:
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        job_description = str(payload.get("job_description") or "")

    result = match_job(
        job_description=job_description,
        filename=_latest_resume_filename,
    )
    return result


# ── RAG Q&A ──────────────────────────────────────────────────────────────────
@app.post("/ask", tags=["RAG"])
def ask(data: QuestionRequest):
    """Answer a question using RAG over ingested academic notes."""
    return ask_question(data.question)


@app.post("/quiz-generator", tags=["Quiz"])
def quiz_generator(data: QuizRequest):
    """Generate quiz questions from selected uploaded notes using ChromaDB context."""
    return generate_quiz(
        selected_files=data.selected_files,
        question_type=data.question_type,
        question_count=data.question_count,
        difficulty=data.difficulty,
        topic_scope=data.topic_scope,
        topic=data.topic,
    )


@app.get("/notes/files", tags=["RAG"])
def notes_files():
    """List uploaded notes available to the RAG pipeline."""
    return {"files": list_note_files()}


@app.delete("/notes/files/{filename}", tags=["RAG"])
def delete_notes_file(filename: str):
    """Delete an uploaded note and clear its ChromaDB chunks."""
    result = delete_note_file(filename)
    if not result["deleted"] and result["message"] == "Invalid filename.":
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/upload-notes", tags=["RAG"])
async def upload_notes(files: List[UploadFile] = File(...)):
    """Upload and ingest multiple notes files into ChromaDB."""
    saved_paths = []
    os.makedirs("data/notes", exist_ok=True)

    for file in files:
        safe_filename = os.path.basename(file.filename or "")
        extension = os.path.splitext(safe_filename)[1].lower()

        if extension not in SUPPORTED_EXTENSIONS:
            supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type for {safe_filename}. Supported: {supported}",
            )

        save_path = os.path.join("data", "notes", safe_filename)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_paths.append(save_path)

    return ingest_note_files([Path(path) for path in saved_paths])


# ── Interview Generator ───────────────────────────────────────────────────────
@app.post("/interview-generator", tags=["Interview"])
def interview_generator(data: InterviewRequest):
    """Generate role-specific interview questions with model answers."""
    return generate_interview_questions(
        role=data.role,
        difficulty=data.difficulty,
        num_questions=data.num_questions,
        experience_level=data.experience_level,
    )


@app.post("/interview-evaluate", tags=["Interview"])
def interview_evaluate(data: InterviewEvaluationRequest):
    """Evaluate a mock interview answer."""
    return evaluate_interview_answer(
        role=data.role,
        experience_level=data.experience_level,
        question=data.question,
        model_answer=data.model_answer,
        user_answer=data.user_answer,
    )


# ── Study Plan ────────────────────────────────────────────────────────────────
@app.post("/study-plan", tags=["Study Plan"])
def study_plan(data: StudyPlanRequest):
    """Generate a personalized week-by-week study roadmap."""
    return generate_study_plan(
        target_role=data.target_role,
        duration_weeks=data.duration_weeks,
    )
