from .skill_extractor import normalize_skill_name


RELATED_SKILLS = {
    "TensorFlow": {"PyTorch", "Scikit-learn", "Deep Learning"},
    "PyTorch": {"TensorFlow", "Deep Learning"},
    "Docker": {"Kubernetes", "MLOps", "Model Deployment"},
    "Kubernetes": {"Docker", "MLOps"},
    "AWS": {"Azure", "GCP", "Cloud Deployment"},
    "Azure": {"AWS", "GCP", "Cloud Deployment"},
    "GCP": {"AWS", "Azure", "Cloud Deployment"},
    "Machine Learning": {"Deep Learning", "Scikit-learn", "TensorFlow", "PyTorch"},
    "Natural Language Processing": {"Large Language Models", "Transformers"},
    "Computer Vision": {"OpenCV", "Deep Learning"},
    "MLOps": {"Docker", "Kubernetes", "CI/CD", "Model Deployment"},
    "CI/CD": {"GitHub", "Testing", "MLOps"},
}


def _dedupe(skills: list[str]) -> list[str]:
    seen = set()
    output = []
    for skill in skills:
        normalized = normalize_skill_name(skill)
        key = normalized.lower()
        if normalized and key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


def analyze_skill_gap(resume_skills: list[str], required_skills: list[str]) -> dict:
    resume = _dedupe(resume_skills)
    required = _dedupe(required_skills)
    resume_keys = {skill.lower(): skill for skill in resume}

    matched = []
    missing = []
    partial = []

    for skill in required:
        if skill.lower() in resume_keys:
            matched.append(skill)
            continue

        related = RELATED_SKILLS.get(skill, set())
        resume_related = [item for item in resume if item in related]
        if resume_related:
            partial.append({"skill": skill, "evidence": resume_related, "score": 60})
        else:
            missing.append(skill)

    weighted = (len(matched) + 0.6 * len(partial)) / len(required) if required else 0
    match_percentage = round(weighted * 100)

    return {
        "matched_skills": matched,
        "missing_skills": missing,
        "partial_skills": partial,
        "match_percentage": match_percentage,
        "gap_score": 100 - match_percentage,
    }


def skill_scores(required_skills: list[str], gap: dict) -> list[dict]:
    partial_scores = {item["skill"]: item.get("score", 60) for item in gap.get("partial_skills", [])}
    matched = set(gap.get("matched_skills", []))
    return [
        {
            "skill": skill,
            "score": 100 if skill in matched else partial_scores.get(skill, 0),
        }
        for skill in _dedupe(required_skills)
    ]
