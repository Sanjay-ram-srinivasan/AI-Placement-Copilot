import json
import re

from app.llm import LLM_TIMEOUT_MSG, generate_response


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


def _fallback_roadmap(missing_skills: list[str]) -> list[dict]:
    roadmap = []
    week = 1
    for skill in missing_skills[:6]:
        roadmap.extend([
            {"week": week, "topic": f"{skill} fundamentals"},
            {"week": week + 1, "topic": f"Hands-on {skill} practice"},
        ])
        week += 2
    return roadmap or [{"week": 1, "topic": "Review role requirements and polish portfolio evidence"}]


def generate_learning_roadmap(missing_skills: list[str], role: str = "Target Role") -> dict:
    skills = [str(skill).strip() for skill in missing_skills if str(skill).strip()]
    if not skills:
        return {"roadmap": [], "error": None}

    prompt = f"""
You are an expert technical mentor.

Create a concise week-by-week learning roadmap for a candidate targeting {role}.
Missing skills: {", ".join(skills)}

Return ONLY valid JSON:
{{
  "roadmap": [
    {{"week": 1, "topic": "Docker Fundamentals"}},
    {{"week": 2, "topic": "Docker Compose"}}
  ]
}}

Rules:
- Use 1 to 2 weeks per missing skill.
- Keep each topic short and practical.
- Build from fundamentals to portfolio-ready practice.
"""
    raw = generate_response(prompt)
    if raw == LLM_TIMEOUT_MSG or raw.startswith("LLM Error"):
        return {"roadmap": _fallback_roadmap(skills), "error": raw}

    parsed = _extract_json_object(raw)
    roadmap = parsed.get("roadmap") if isinstance(parsed.get("roadmap"), list) else []
    normalized = []
    for index, item in enumerate(roadmap, start=1):
        if not isinstance(item, dict):
            continue
        topic = str(item.get("topic") or "").strip()
        if topic:
            normalized.append({"week": int(item.get("week") or index), "topic": topic})

    return {"roadmap": normalized or _fallback_roadmap(skills), "error": None if normalized else "Used fallback roadmap."}
