import json
import logging
import re
import time

import chromadb

from .llm import LLM_TIMEOUT_MSG, generate_response


_client = chromadb.PersistentClient(path="vectordb")
logger = logging.getLogger("quiz")

QUESTION_TYPES = {"mcq", "short", "long", "mixed"}
QUESTION_COUNTS = {5, 10, 20, 50}
DIFFICULTIES = {"easy", "medium", "hard"}
TOPIC_SCOPES = {"entire", "specific"}


def _get_collection():
    try:
        return _client.get_collection("notes")
    except Exception:
        return None


def _extract_json_array(text: str) -> list:
    if not text:
        return []

    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\[.*?\])\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)
    else:
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end + 1]

    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def _normalize_questions(raw_text: str, question_type: str) -> list[dict]:
    parsed = _extract_json_array(raw_text)
    questions = []

    for item in parsed:
        if not isinstance(item, dict):
            continue

        normalized = {
            "type": str(item.get("type") or question_type).strip().lower(),
            "difficulty": str(item.get("difficulty") or "").strip(),
            "topic": str(item.get("topic") or "").strip(),
            "question": str(item.get("question") or "").strip(),
            "answer": str(item.get("answer") or "").strip(),
            "explanation": str(item.get("explanation") or "").strip(),
        }

        if question_type == "mcq" or normalized["type"] == "mcq":
            options = item.get("options")
            if isinstance(options, list):
                normalized["options"] = [str(option).strip() for option in options if str(option).strip()]
            else:
                normalized["options"] = []

        if normalized["question"] and normalized["answer"]:
            questions.append(normalized)

    return questions


def _get_source_documents(
    collection,
    selected_files: list[str],
    question_type: str,
    question_count: int,
    topic_scope: str = "entire",
    topic: str = "",
) -> tuple[list[str], list[str]]:
    sources = []
    query_text = (
        f"Generate {question_count} {question_type} quiz questions "
        f"{'about ' + topic if topic_scope == 'specific' and topic else 'from the most important concepts'} "
        f"in these notes: {', '.join(selected_files)}"
    )

    try:
        result = collection.query(
            query_texts=[query_text],
            n_results=min(5, collection.count()),
            where={"source": {"$in": selected_files}},
        )
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
    except Exception:
        documents = []
        metadatas = []
        for filename in selected_files:
            if len(documents) >= 5:
                break
            try:
                result = collection.query(
                    query_texts=[query_text],
                    n_results=min(5 - len(documents), collection.count()),
                    where={"source": filename},
                )
            except Exception:
                continue
            documents.extend(result.get("documents", [[]])[0])
            metadatas.extend(result.get("metadatas", [[]])[0])

    for meta in metadatas:
        source = meta.get("source")
        if source and source in selected_files and source not in sources:
            sources.append(source)

    return documents, sources


def generate_quiz(
    selected_files: list[str],
    question_type: str,
    question_count: int,
    difficulty: str = "medium",
    topic_scope: str = "entire",
    topic: str = "",
) -> dict:
    question_type = (question_type or "mcq").lower()
    difficulty = (difficulty or "medium").lower()
    topic_scope = (topic_scope or "entire").lower()

    if question_type not in QUESTION_TYPES:
        return {"error": "Invalid question type. Choose mcq, short, long, or mixed.", "questions": [], "sources": []}

    if question_count not in QUESTION_COUNTS:
        return {"error": "Invalid question count. Choose 5, 10, 20, or 50.", "questions": [], "sources": []}

    if difficulty not in DIFFICULTIES:
        return {"error": "Invalid difficulty. Choose easy, medium, or hard.", "questions": [], "sources": []}

    if topic_scope not in TOPIC_SCOPES:
        return {"error": "Invalid topic scope. Choose entire or specific.", "questions": [], "sources": []}

    if topic_scope == "specific" and not topic.strip():
        return {"error": "Enter a specific topic.", "questions": [], "sources": []}

    if not selected_files:
        return {"error": "Select at least one uploaded notes file.", "questions": [], "sources": []}

    collection = _get_collection()
    if collection is None or collection.count() == 0:
        return {"error": "No notes have been indexed yet. Upload notes first.", "questions": [], "sources": []}

    retrieval_started = time.perf_counter()
    documents, sources = _get_source_documents(collection, selected_files, question_type, question_count, topic_scope, topic)
    retrieval_ms = (time.perf_counter() - retrieval_started) * 1000
    logger.info(
        "Quiz retrieval complete | retrieval_time_ms=%.2f | chunks=%s | sources=%s",
        retrieval_ms,
        len(documents),
        sources,
    )
    if not documents:
        return {"error": "No indexed chunks found for the selected notes.", "questions": [], "sources": []}

    prompt_started = time.perf_counter()
    context = "\n\n".join(documents[:5])[:6000]

    if question_type == "mcq":
        schema = """
[
  {
    "type": "mcq",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Question text",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "Correct option text",
    "explanation": "Why the answer is correct, grounded in the notes"
  }
]
"""
        type_instruction = "Generate multiple-choice questions. Each question must have exactly 4 options."
    elif question_type == "short":
        schema = """
[
  {
    "type": "short",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Short-answer question text",
    "answer": "Concise answer",
    "explanation": "Brief explanation grounded in the notes"
  }
]
"""
        type_instruction = "Generate short-answer questions that can be answered in 1 to 3 sentences."
    elif question_type == "long":
        schema = """
[
  {
    "type": "long",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Long-answer question text",
    "answer": "Detailed model answer",
    "explanation": "What a strong answer should include, grounded in the notes"
  }
]
"""
        type_instruction = "Generate long-answer questions that require structured explanations."
    else:
        schema = """
[
  {
    "type": "mcq",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Question text",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "Correct option text",
    "explanation": "Brief answer support grounded in the notes"
  },
  {
    "type": "short",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Short-answer question text",
    "answer": "Concise answer",
    "explanation": "Brief answer support grounded in the notes"
  },
  {
    "type": "long",
    "difficulty": "medium",
    "topic": "Topic name",
    "question": "Long-answer question text",
    "answer": "Detailed model answer",
    "explanation": "What a strong answer should include, grounded in the notes"
  }
]
"""
        type_instruction = "Generate a balanced mixed quiz with MCQ, short-answer, and long-answer questions."

    prompt = f"""
You are an expert exam paper setter.

Use ONLY the uploaded notes context below to generate {question_count} {difficulty} questions.
{type_instruction}
Topic scope: {"Specific topic: " + topic.strip() if topic_scope == "specific" else "Entire document"}.

Return ONLY valid JSON. Do not wrap it in markdown.
Use this exact JSON array schema:
{schema}

Rules:
- Generate exactly {question_count} questions if the notes contain enough material.
- Do not invent facts outside the notes.
- Avoid duplicate questions.
- Keep every explanation specific to the notes.
- Never reveal reasoning, chain of thought, or internal analysis.
- Output only questions, answer keys, options where applicable, and concise explanations.
- For mixed quizzes, distribute questions across MCQ, short, and long formats.

Uploaded notes context:
{context}
"""
    prompt_ms = (time.perf_counter() - prompt_started) * 1000
    logger.info(
        "Quiz prompt constructed | prompt_construction_time_ms=%.2f | context_length=%s | prompt_length=%s",
        prompt_ms,
        len(context),
        len(prompt),
    )

    generation_started = time.perf_counter()
    raw_result = generate_response(prompt)
    generation_ms = (time.perf_counter() - generation_started) * 1000
    logger.info("Quiz LLM generation finished | llm_generation_time_ms=%.2f", generation_ms)
    if raw_result == LLM_TIMEOUT_MSG:
        return {
            "question_type": question_type,
            "question_count": question_count,
            "questions": [],
            "sources": sources,
            "raw_response": LLM_TIMEOUT_MSG,
            "error": LLM_TIMEOUT_MSG,
        }

    questions = _normalize_questions(raw_result, question_type)

    return {
        "question_type": question_type,
        "question_count": question_count,
        "difficulty": difficulty,
        "topic_scope": topic_scope,
        "topic": topic,
        "questions": questions,
        "sources": sources,
        "raw_response": raw_result if not questions else "",
        "error": None if questions else "The LLM did not return parseable quiz JSON. Try again.",
    }


def generate_role_quiz(skill: str, role: str = "Target Role", question_count: int = 5, difficulty: str = "medium") -> dict:
    """Generate a focused quiz for a missing skill without requiring uploaded notes."""
    count = question_count if question_count in QUESTION_COUNTS else 5
    difficulty = difficulty if difficulty in DIFFICULTIES else "medium"
    topic = (skill or "").strip()
    if not topic:
        return {"error": "Skill is required.", "questions": []}

    prompt = f"""
You are an expert technical quiz creator.

Generate exactly {count} {difficulty} multiple-choice questions for the skill "{topic}" in the context of a {role} role.

Return ONLY valid JSON. Do not wrap it in markdown.
Use this schema:
[
  {{
    "type": "mcq",
    "difficulty": "{difficulty}",
    "topic": "{topic}",
    "question": "Question text",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "Correct option text",
    "explanation": "Brief explanation"
  }}
]
"""
    raw_result = generate_response(prompt)
    questions = _normalize_questions(raw_result, "mcq")
    return {
        "question_type": "mcq",
        "question_count": count,
        "difficulty": difficulty,
        "topic": topic,
        "role": role,
        "questions": questions,
        "sources": [],
        "raw_response": raw_result if not questions else "",
        "error": None if questions else "The LLM did not return parseable role quiz JSON. Try again.",
    }
