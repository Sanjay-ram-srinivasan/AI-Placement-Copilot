from .llm import generate_response


def generate_study_plan(target_role: str, duration_weeks: int = 8) -> dict:
    """Generate a personalized week-by-week study roadmap."""

    prompt = f"""
You are an expert career mentor and technical educator.

Create a **{duration_weeks}-week personalized study roadmap** for a final-year B.Tech CSE (AI & ML) student targeting a **{target_role}** role.

For each week use this format:

### Week N — [Topic Title]
**Goal:** [One sentence goal for this week]
**Topics to Cover:**
- [topic 1]
- [topic 2]
- [topic 3]

**Resources:**
- [Resource name] — [why it's recommended]

**Practice Task:** [One concrete hands-on task]

---

Make the plan realistic and progressive. Start with fundamentals, build toward advanced topics, and end with mock interviews and project polish in the final weeks.
"""

    result = generate_response(prompt)
    return {
        "roadmap": result,
        "role": target_role,
        "duration_weeks": duration_weeks,
        "error": None,
    }
