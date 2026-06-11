import logging
import os
import time

from dotenv import load_dotenv

from .ollama_client import OLLAMA_TIMEOUT_MSG, call_ollama

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("llm")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")
LLM_TIMEOUT_MSG = OLLAMA_TIMEOUT_MSG


def generate_response(prompt: str) -> str:
    """Route text generation through the configured LLM provider."""
    provider = os.getenv("LLM_PROVIDER", LLM_PROVIDER).strip().lower()
    model = GROQ_MODEL if provider == "groq" else OLLAMA_MODEL
    started = time.perf_counter()

    logger.info("LLM request started | provider=%s | model=%s", provider, model)

    try:
        if provider == "groq":
            from .groq_client import generate_response as generate_groq_response

            return generate_groq_response(prompt)

        if provider == "ollama":
            return call_ollama(prompt)

        logger.warning("Unsupported LLM provider requested | provider=%s", provider)
        return f"Unsupported LLM provider: {provider}. Set LLM_PROVIDER to groq or ollama."
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.exception(
            "LLM request failed | provider=%s | model=%s | response_time_ms=%.2f",
            provider,
            model,
            elapsed_ms,
        )
        return f"LLM Error ({provider}): {exc}"
    finally:
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.info(
            "LLM request finished | provider=%s | model=%s | response_time_ms=%.2f",
            provider,
            model,
            elapsed_ms,
        )
