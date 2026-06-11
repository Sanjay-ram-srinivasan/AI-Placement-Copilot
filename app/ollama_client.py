"""
Centralized Ollama client for local AI generation.
"""
import json
import logging
import os
import time
from socket import timeout as SocketTimeout
from urllib import error, request

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("ollama_client")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "qwen3:8b")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "300"))
OLLAMA_GENERATION_LIMIT_SECONDS = int(os.getenv("OLLAMA_GENERATION_LIMIT_SECONDS", "120"))
OLLAMA_NUM_PREDICT = int(os.getenv("OLLAMA_NUM_PREDICT", "800"))
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
OLLAMA_STOP_SEQUENCES = ["</s>", "```", "\n\nUser:", "\n\nSystem:"]
OLLAMA_TIMEOUT_MSG = "Ollama request timed out."
SYSTEM_PROMPT = """Never reveal reasoning.
Never reveal chain of thought.
Return only final answers."""


def _estimate_tokens(text: str) -> int:
    """Rough local token estimate for logging when Ollama does not return counts."""
    return max(1, len(text or "") // 4)


def _contains_reasoning_trace(text: str) -> bool:
    lowered = (text or "").lower()
    markers = (
        "<think>",
        "</think>",
        "chain of thought",
        "reasoning:",
        "let me think",
        "we need answer",
    )
    return any(marker in lowered for marker in markers)


def call_ollama(prompt: str, timeout: int = OLLAMA_TIMEOUT_SECONDS) -> str:
    """
    Call Ollama's local generate endpoint.

    Returns:
        str: The model response text, or a user-friendly fallback message.
    """
    started = time.perf_counter()
    full_prompt = f"{SYSTEM_PROMPT}\n\n{prompt}"
    context_length = len(full_prompt)
    prompt_tokens_estimate = _estimate_tokens(full_prompt)
    options = {
        "temperature": OLLAMA_TEMPERATURE,
        "num_predict": OLLAMA_NUM_PREDICT,
        "stop": OLLAMA_STOP_SEQUENCES,
    }
    logger.info(
        "Ollama request options | model=%s | num_predict=%s | temperature=%s | options=%s",
        MODEL_NAME,
        OLLAMA_NUM_PREDICT,
        OLLAMA_TEMPERATURE,
        options,
    )
    logger.debug("Exact Ollama prompt | model=%s | prompt=%s", MODEL_NAME, full_prompt)
    payload = json.dumps(
        {
            "model": MODEL_NAME,
            "prompt": full_prompt,
            "stream": True,
            "options": options,
        }
    ).encode("utf-8")

    req = request.Request(
        f"{OLLAMA_BASE_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        chunks = []
        prompt_tokens = None
        response_tokens = None
        with request.urlopen(req, timeout=timeout) as response:
            for line in response:
                generation_elapsed = time.perf_counter() - started
                if generation_elapsed > OLLAMA_GENERATION_LIMIT_SECONDS:
                    partial_text = "".join(chunks).strip()
                    logger.warning(
                        "Ollama generation cancelled after limit | model=%s | response_time_ms=%.2f | context_length=%s | partial_chars=%s | reasoning_trace_detected=%s | partial_output=%s",
                        MODEL_NAME,
                        generation_elapsed * 1000,
                        context_length,
                        len(partial_text),
                        _contains_reasoning_trace(partial_text),
                        partial_text,
                    )
                    return OLLAMA_TIMEOUT_MSG

                if not line:
                    continue
                data = json.loads(line.decode("utf-8"))
                chunks.append(str(data.get("response") or ""))
                prompt_tokens = data.get("prompt_eval_count") or prompt_tokens
                response_tokens = data.get("eval_count") or response_tokens
                if data.get("done"):
                    break
    except (error.URLError, TimeoutError, SocketTimeout, ConnectionError) as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        partial_text = "".join(locals().get("chunks", [])).strip()
        logger.warning(
            "Ollama request failed | model=%s | response_time_ms=%.2f | context_length=%s | prompt_tokens_est=%s | partial_chars=%s | partial_output=%s | error=%s",
            MODEL_NAME,
            elapsed_ms,
            context_length,
            prompt_tokens_estimate,
            len(partial_text),
            partial_text,
            exc,
        )
        return OLLAMA_TIMEOUT_MSG
    except Exception as exc:
        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.error(
            "Ollama request failed | model=%s | response_time_ms=%.2f | context_length=%s | prompt_tokens_est=%s | error=%s",
            MODEL_NAME,
            elapsed_ms,
            context_length,
            prompt_tokens_estimate,
            exc,
        )
        return f"Ollama API Error: {exc}"

    elapsed_ms = (time.perf_counter() - started) * 1000
    text = "".join(chunks).strip()
    prompt_tokens = prompt_tokens or prompt_tokens_estimate
    response_tokens = response_tokens or _estimate_tokens(text)
    reasoning_trace_detected = _contains_reasoning_trace(text)

    logger.info(
        "Ollama generation complete | model=%s | response_time_ms=%.2f | context_length=%s | prompt_tokens=%s | response_tokens=%s | total_tokens_est=%s | reasoning_trace_detected=%s",
        MODEL_NAME,
        elapsed_ms,
        context_length,
        prompt_tokens,
        response_tokens,
        int(prompt_tokens) + int(response_tokens),
        reasoning_trace_detected,
    )
    return text


def ollama_status() -> dict:
    """Health check information for the configured local Ollama server."""
    return {
        "base_url": OLLAMA_BASE_URL,
        "model": MODEL_NAME,
        "timeout_seconds": OLLAMA_TIMEOUT_SECONDS,
        "generation_limit_seconds": OLLAMA_GENERATION_LIMIT_SECONDS,
        "num_predict": OLLAMA_NUM_PREDICT,
        "temperature": OLLAMA_TEMPERATURE,
        "stop": OLLAMA_STOP_SEQUENCES,
        "client_ready": True,
    }
