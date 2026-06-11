import os
import glob
from pypdf import PdfReader
from .llm import generate_response


def _get_latest_resume(resume_dir: str = "data/resumes") -> str | None:
    """Return the path of the most recently uploaded resume PDF."""
    files = glob.glob(os.path.join(resume_dir, "*.pdf"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def _extract_text(pdf_path: str, max_chars: int = 4000) -> str:
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text[:max_chars]


def analyze_resume(filename: str = None) -> dict:
    """
    ATS-style resume analysis using the configured LLM provider.
    Returns a dict with 'analysis' (markdown string) and 'file_analyzed'.
    """
    if filename:
        resume_path = os.path.join("data", "resumes", filename)
    else:
        resume_path = _get_latest_resume()

    if not resume_path or not os.path.exists(resume_path):
        return {
            "error": "No resume found. Please upload a PDF resume first.",
            "analysis": None,
            "file_analyzed": None,
        }

    resume_text = _extract_text(resume_path)

    if not resume_text.strip():
        return {
            "error": "Could not extract text from this PDF. Make sure it is not a scanned image-only file.",
            "analysis": None,
            "file_analyzed": os.path.basename(resume_path),
        }

    prompt = f"""
You are an expert ATS Resume Reviewer with 15 years of recruiting experience.

Analyze the resume below and respond with structured markdown using exactly these sections:

## ATS Score
Give a score from 0–100 and a one-sentence justification.

## Skills Found
Bullet list of technical and soft skills detected.

## Missing Skills
Bullet list of skills commonly expected for this candidate's domain that are absent.

## Strengths
Bullet list of strong points in the resume.

## Weaknesses
Bullet list of areas that weaken the resume.

## Improvement Suggestions
Numbered list of specific, actionable improvements.

## Suitable Roles
Bullet list of job titles this resume is well-suited for.

---
Resume:
{resume_text}
"""

    result = generate_response(prompt)
    return {
        "analysis": result,
        "file_analyzed": os.path.basename(resume_path),
        "error": None,
    }
