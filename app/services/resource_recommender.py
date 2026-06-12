import json
import re

from app.llm import generate_response


RESOURCE_TYPES = ["Documentation", "Course", "YouTube"]


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


def _fallback_resources(skill: str) -> dict:
    return {
        "skill": skill,
        "resources": [
            {"title": f"{skill} official documentation or getting started guide", "type": "Documentation"},
            {"title": f"{skill} beginner-to-intermediate course", "type": "Course"},
            {"title": f"{skill} hands-on project tutorial", "type": "YouTube"},
        ],
    }


def recommend_resources(missing_skills: list[str]) -> dict:
    skills = [str(skill).strip() for skill in missing_skills if str(skill).strip()]
    if not skills:
        return {"recommendations": [], "error": None}

    prompt = f"""
Recommend learning resources for these missing technical skills: {", ".join(skills)}.

Return ONLY valid JSON:
{{
  "recommendations": [
    {{
      "skill": "Docker",
      "resources": [
        {{"title": "Docker Docs - Get Started", "type": "Documentation"}},
        {{"title": "Docker for Beginners", "type": "Course"}},
        {{"title": "Docker Crash Course", "type": "YouTube"}}
      ]
    }}
  ]
}}

Rules:
- Return exactly one Documentation, one Course, and one YouTube resource per skill.
- Use recognizable, useful resource titles.
- Do not invent URLs.
"""
    raw = generate_response(prompt)
    parsed = _extract_json_object(raw)
    items = parsed.get("recommendations") if isinstance(parsed.get("recommendations"), list) else []

    normalized = []
    for skill in skills:
        match = next((item for item in items if isinstance(item, dict) and str(item.get("skill", "")).lower() == skill.lower()), None)
        if not match:
            normalized.append(_fallback_resources(skill))
            continue
        resources = []
        for resource in match.get("resources", []):
            if not isinstance(resource, dict):
                continue
            title = str(resource.get("title") or "").strip()
            kind = str(resource.get("type") or "").strip()
            if title and kind:
                resources.append({"title": title, "type": kind if kind in RESOURCE_TYPES else kind.title()})
        normalized.append({"skill": skill, "resources": resources[:3] or _fallback_resources(skill)["resources"]})

    return {"recommendations": normalized, "error": None}
