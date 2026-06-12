import json
import re

from .llm import generate_response


ROLES = {
    "Software Engineer",
    "AI Engineer",
    "ML Engineer",
    "Data Analyst",
    "Data Scientist",
    "Full Stack Developer",
}
EXPERIENCE_LEVELS = {"Fresher", "1-3 Years", "3-5 Years"}
QUESTION_COUNTS = {5, 10, 20}
CATEGORIES = ["HR", "Technical", "Coding", "Project-Based"]


def _extract_json_object(text: str) -> dict:
    if not text:
        return {}
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, re.DOTALL)
    if fenced:
        cleaned = fenced.group(1)
    else:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end + 1]
    try:
        parsed = json.loads(cleaned)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _as_list(value) -> list:
    return value if isinstance(value, list) else []


def _normalize_questions(items) -> list[dict]:
    questions = []
    for index, item in enumerate(_as_list(items), start=1):
        if not isinstance(item, dict):
            continue
        question = str(item.get("question") or "").strip()
        if not question:
            continue
        questions.append({
            "id": index,
            "category": str(item.get("category") or "Technical").strip(),
            "question": question,
            "key_concepts": [str(v).strip() for v in _as_list(item.get("key_concepts")) if str(v).strip()],
            "model_answer": str(item.get("model_answer") or "").strip(),
            "evaluation_points": [str(v).strip() for v in _as_list(item.get("evaluation_points")) if str(v).strip()],
        })
    return questions


def _questions_to_markdown(questions: list[dict]) -> str:
    blocks = []
    for index, item in enumerate(questions, start=1):
        concepts = ", ".join(item.get("key_concepts") or [])
        blocks.append(
            f"### Q{index}. {item['question']}\n"
            f"**Category:** {item.get('category', 'Technical')}\n"
            f"**Key Concepts:** {concepts}\n"
            f"**Model Answer:** {item.get('model_answer', '')}\n\n---"
        )
    return "\n\n".join(blocks)


def generate_interview_questions(
    role: str,
    difficulty: str = "Medium",
    num_questions: int = 5,
    experience_level: str = "Fresher",
) -> dict:
    """Generate role-specific interview questions with model answers."""
    role = (role or "Software Engineer").strip()
    experience_level = experience_level if experience_level in EXPERIENCE_LEVELS else "Fresher"
    count = num_questions if num_questions in QUESTION_COUNTS else 5

    prompt = f"""
You are a senior AI interview coach.

Generate exactly {count} interview questions for:
- Role: {role}
- Experience level: {experience_level}
- Difficulty: {difficulty}

Include a balanced mix of these categories:
- HR
- Technical
- Coding
- Project-Based

Return ONLY valid JSON. Do not wrap it in markdown.
Never reveal reasoning, chain of thought, or internal analysis.
Output only questions, model answers, key concepts, and evaluation points.

Use this schema:
{{
  "questions": [
    {{
      "category": "HR",
      "question": "Question text",
      "key_concepts": ["concept 1", "concept 2"],
      "model_answer": "Concise strong answer.",
      "evaluation_points": ["What to listen for", "Common mistake"]
    }}
  ],
  "strengths_focus": ["strength area to build"],
  "weaknesses_focus": ["weakness area to watch"],
  "readiness_guidance": "Brief readiness guidance."
}}
"""

    raw = generate_response(prompt)
    parsed = _extract_json_object(raw)
    questions = _normalize_questions(parsed.get("questions"))
    markdown = _questions_to_markdown(questions) if questions else raw

    return {
        "questions": markdown,
        "items": questions,
        "role": role,
        "difficulty": difficulty,
        "experience_level": experience_level,
        "count": count,
        "categories": CATEGORIES,
        "strengths_focus": _as_list(parsed.get("strengths_focus")),
        "weaknesses_focus": _as_list(parsed.get("weaknesses_focus")),
        "readiness_guidance": str(parsed.get("readiness_guidance") or "").strip(),
        "error": None if questions else "The LLM did not return parseable interview JSON. Showing raw response.",
    }


def evaluate_interview_answer(
    role: str,
    experience_level: str,
    question: str,
    model_answer: str,
    user_answer: str,
) -> dict:
    if not user_answer.strip():
        return {"error": "Submit an answer before evaluation.", "score": 0}

    prompt = f"""
You are an AI interview coach evaluating a candidate answer.

Role: {role}
Experience level: {experience_level}
Question: {question}
Reference answer: {model_answer}
Candidate answer: {user_answer}

Return ONLY valid JSON. Do not wrap it in markdown.
Never reveal reasoning, chain of thought, or internal analysis.

Schema:
{{
  "score": 8,
  "feedback": "Concise evaluation of the answer.",
  "strengths": ["specific strength"],
  "weaknesses": ["specific weakness"],
  "improvement_suggestions": ["actionable suggestion"],
  "readiness_score": 78
}}
"""
    raw = generate_response(prompt)
    parsed = _extract_json_object(raw)

    try:
        score = max(0, min(10, int(parsed.get("score", 0))))
    except (TypeError, ValueError):
        score = 0

    try:
        readiness_score = max(0, min(100, int(parsed.get("readiness_score", score * 10))))
    except (TypeError, ValueError):
        readiness_score = score * 10

    return {
        "score": score,
        "feedback": str(parsed.get("feedback") or raw or "").strip(),
        "strengths": _as_list(parsed.get("strengths")),
        "weaknesses": _as_list(parsed.get("weaknesses")),
        "improvement_suggestions": _as_list(parsed.get("improvement_suggestions")),
        "readiness_score": readiness_score,
        "error": None if parsed else "The LLM did not return parseable evaluation JSON.",
    }
