import re


SKILL_ALIASES = {
    "ai": "Artificial Intelligence",
    "api": "API",
    "apis": "API",
    "aws": "AWS",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "cv": "Computer Vision",
    "dl": "Deep Learning",
    "gcp": "GCP",
    "js": "JavaScript",
    "k8s": "Kubernetes",
    "llm": "Large Language Models",
    "llms": "Large Language Models",
    "ml": "Machine Learning",
    "mlops": "MLOps",
    "nlp": "Natural Language Processing",
    "oop": "Object-Oriented Programming",
    "sql": "SQL",
    "ui": "UI",
    "ux": "UX",
}

KNOWN_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI",
    "Flask", "Django", "HTML", "CSS", "SQL", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "Machine Learning", "Deep Learning", "Natural Language Processing",
    "Computer Vision", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
    "OpenCV", "Transformers", "Large Language Models", "RAG", "ChromaDB", "Docker",
    "Kubernetes", "MLOps", "AWS", "Azure", "GCP", "CI/CD", "Git", "GitHub",
    "REST API", "API", "Data Structures", "Algorithms", "System Design",
    "Linux", "Bash", "Power BI", "Tableau", "Excel", "Spark", "Hadoop",
    "Airflow", "Kafka", "ETL", "Statistics", "Data Visualization", "Feature Engineering",
    "Model Deployment", "Microservices", "Testing", "Unit Testing", "Agile", "Scrum",
]


def normalize_skill_name(skill: str) -> str:
    cleaned = re.sub(r"\s+", " ", str(skill or "").strip().strip(".,;:()[]{}"))
    if not cleaned:
        return ""

    key = cleaned.lower().replace(" ", "")
    if cleaned.lower() in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned.lower()]
    if key in SKILL_ALIASES:
        return SKILL_ALIASES[key]

    for known in KNOWN_SKILLS:
        if known.lower() == cleaned.lower():
            return known
    return cleaned[:1].upper() + cleaned[1:]


def _skill_pattern(skill: str) -> re.Pattern:
    escaped = re.escape(skill)
    escaped = escaped.replace(r"\ ", r"[\s\-]+")
    return re.compile(rf"(?<![A-Za-z0-9+#.]){escaped}(?![A-Za-z0-9+#.])", re.IGNORECASE)


def extract_skills(text: str) -> dict:
    found = []
    source = text or ""

    for skill in KNOWN_SKILLS:
        if _skill_pattern(skill).search(source):
            found.append(normalize_skill_name(skill))

    for alias, normalized in SKILL_ALIASES.items():
        if _skill_pattern(alias).search(source):
            found.append(normalized)

    seen = set()
    unique = []
    for skill in found:
        key = skill.lower()
        if key not in seen:
            seen.add(key)
            unique.append(skill)

    return {"skills": unique}


def extract_resume_skills(resume_text: str) -> dict:
    return extract_skills(resume_text)


def extract_required_skills(job_description: str) -> dict:
    return extract_skills(job_description)
