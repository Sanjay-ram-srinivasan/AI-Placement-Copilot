import logging
import os
import time

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("groq_client")

MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SYSTEM_PROMPT = """You are a concise AI assistant.

Never reveal chain of thought.
Never reveal reasoning.
Never reveal internal analysis.

Return only the final answer."""


def _get_client() -> Groq:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Add it to your .env file.")
    return Groq(api_key=GROQ_API_KEY)


def generate_response(prompt: str) -> str:
    """Generate text with Groq and return only the assistant response content."""
    started = time.perf_counter()
    try:
        response = _get_client().chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        elapsed_ms = (time.perf_counter() - started) * 1000
        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        completion_tokens = getattr(usage, "completion_tokens", None) if usage else None
        total_tokens = getattr(usage, "total_tokens", None) if usage else None

        logger.info(
            "LLM generation complete | provider=groq | model=%s | response_time_ms=%.2f | prompt_tokens=%s | response_tokens=%s | total_tokens=%s",
            MODEL,
            elapsed_ms,
            prompt_tokens,
            completion_tokens,
            total_tokens,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.exception(
            "LLM request failed | provider=groq | model=%s | response_time_ms=%.2f",
            MODEL,
            elapsed_ms,
        )
        return f"Groq API Error: {exc}"
