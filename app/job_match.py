import glob
import json
import os
import re

from pypdf import PdfReader

from .llm import LLM_TIMEOUT_MSG, generate_response


DEFAULT_MATCH_RESULT = {
    "match_score": 0,
    "matching_skills": [],
    "missing_skills": [],
    "strengths": [],
    "weaknesses": [],
    "hiring_recommendation": "",
    "improvement_suggestions": [],
    "recommendations": [],
    "full_analysis": "",
}


def _get_latest_resume(resume_dir: str = "data/resumes") -> str | None:
    """Return the path of the most recently uploaded resume PDF."""
    files = glob.glob(os.path.join(resume_dir, "*.pdf"))
    if not files:
        return None
    return max(files, key=os.path.getmtime)


def _extract_text(pdf_path: str, max_chars: int = 6000) -> str:
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text[:max_chars]


def _extract_json_object(text: str) -> dict:
    """Parse model output even if it wraps JSON in markdown fences."""
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
            cleaned = cleaned[start : end + 1]

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {}


def _as_string_list(value) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _normalize_match_result(raw_text: str) -> dict:
    parsed = _extract_json_object(raw_text)
    result = DEFAULT_MATCH_RESULT.copy()

    score = parsed.get("match_score", 0)
    if isinstance(score, str):
        score_match = re.search(r"\d{1,3}", score)
        score = int(score_match.group(0)) if score_match else 0

    try:
        result["match_score"] = max(0, min(100, int(score)))
    except (TypeError, ValueError):
        result["match_score"] = 0

    result["matching_skills"] = _as_string_list(parsed.get("matching_skills"))
    result["missing_skills"] = _as_string_list(parsed.get("missing_skills"))
    result["strengths"] = _as_string_list(parsed.get("strengths"))
    result["weaknesses"] = _as_string_list(parsed.get("weaknesses"))
    result["hiring_recommendation"] = str(parsed.get("hiring_recommendation") or "").strip()
    result["improvement_suggestions"] = _as_string_list(parsed.get("improvement_suggestions"))
    result["recommendations"] = _as_string_list(
        parsed.get("recommendations") or parsed.get("improvement_suggestions")
    )
    result["full_analysis"] = str(parsed.get("full_analysis") or raw_text or "").strip()
    return result


def match_job(job_description: str, filename: str = None) -> dict:
    """
    Compare the latest uploaded resume against a job description using the configured LLM provider.
    Returns the structured JSON contract consumed by the Job Match UI.
    """
    if not job_description or not job_description.strip():
        return {
            **DEFAULT_MATCH_RESULT,
            "error": "Please provide a job description.",
            "file_analyzed": None,
        }

    if filename:
        resume_path = os.path.join("data", "resumes", filename)
    else:
        resume_path = _get_latest_resume()

    if not resume_path or not os.path.exists(resume_path):
        return {
            **DEFAULT_MATCH_RESULT,
            "error": "No resume found. Please upload a PDF resume first.",
            "file_analyzed": None,
        }

    resume_text = _extract_text(resume_path)

    if not resume_text.strip():
        return {
            **DEFAULT_MATCH_RESULT,
            "error": "Could not extract text from this PDF. Make sure it is not a scanned image-only file.",
            "file_analyzed": os.path.basename(resume_path),
        }

    prompt = f"""
You are an expert ATS and Recruitment AI with deep knowledge of technical hiring.

Compare the candidate's resume against the job description.

Return ONLY valid JSON. Do not wrap it in markdown. Use this exact schema:
{{
  "match_score": 85,
  "matching_skills": ["skill 1", "skill 2"],
  "missing_skills": ["missing skill 1", "missing skill 2"],
  "strengths": ["role-relevant strength 1", "role-relevant strength 2"],
  "weaknesses": ["gap or risk 1", "gap or risk 2"],
  "hiring_recommendation": "Strong hire / Hire with reservations / Needs improvement before applying, plus one concise reason.",
  "improvement_suggestions": ["actionable improvement 1", "actionable improvement 2"],
  "recommendations": ["same items as improvement_suggestions for backward compatibility"],
  "full_analysis": "A concise ATS-style report summarizing score rationale, key matches, gaps, and final recommendation."
}}

Rules:
- Base the comparison only on evidence visible in the resume and job description.
- Keep skill names short enough to display as tags.
- Make strengths, weaknesses, and suggestions specific to this job description.
- Put 3 to 8 items in each list when possible.

Scoring guidance:
- 85-100: strong alignment with most required skills and relevant experience.
- 65-84: good alignment with some fixable keyword or experience gaps.
- 40-64: partial alignment with meaningful skill gaps.
- 0-39: weak alignment for this role.

Resume:
{resume_text}

Job Description:
{job_description[:4000]}
"""

    raw_result = generate_response(prompt)
    if raw_result == LLM_TIMEOUT_MSG:
        return {
            **DEFAULT_MATCH_RESULT,
            "full_analysis": LLM_TIMEOUT_MSG,
            "file_analyzed": os.path.basename(resume_path),
            "error": LLM_TIMEOUT_MSG,
        }

    result = _normalize_match_result(raw_result)

    return {
        **result,
        "file_analyzed": os.path.basename(resume_path),
        "error": None,
    }
