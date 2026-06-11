import chromadb
from dotenv import load_dotenv

from .llm import generate_response

load_dotenv()

_client = chromadb.PersistentClient(path="vectordb")


def _get_collection():
    try:
        return _client.get_collection("notes")
    except Exception:
        return None


def ask_question(question: str) -> dict:
    """
    RAG-based Q&A over ingested student notes.
    Returns answer text and source filenames.
    """
    collection = _get_collection()

    if collection is None or collection.count() == 0:
        return {
            "answer": "No notes have been ingested yet. Upload PDF, DOCX, PPTX, TXT, or Markdown files first.",
            "sources": [],
        }

    try:
        results = collection.query(query_texts=[question], n_results=min(5, collection.count()))
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        context = "\n\n".join(documents)
        sources = []
        for meta in metadatas:
            source = meta.get("source")
            if source and source not in sources:
                sources.append(source)
    except Exception as e:
        return {
            "answer": f"Vector database error: {str(e)}",
            "sources": [],
        }

    prompt = f"""
You are an expert AI Learning Assistant helping a final-year B.Tech CSE student understand academic topics.

Answer the question using ONLY the context from their uploaded notes below.
If the answer is not in the context, respond with: "I don't have information about this in your uploaded notes."
Keep your answer clear, structured, and student-friendly. Use bullet points where helpful.

Context from student notes:
{context}

Student's Question: {question}
"""

    answer = generate_response(prompt)
    return {
        "answer": answer,
        "sources": sources,
    }
