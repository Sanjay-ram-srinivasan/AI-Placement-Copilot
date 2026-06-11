import os
import re
import uuid
import zipfile
from html import unescape
from pathlib import Path
from xml.etree import ElementTree

import chromadb
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter


NOTES_DIR = Path("data/notes")
VECTORDB_DIR = "vectordb"
COLLECTION_NAME = "notes"
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt", ".md", ".markdown"}

splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)


def _client():
    return chromadb.PersistentClient(path=VECTORDB_DIR)


def _collection():
    return _client().get_or_create_collection(name=COLLECTION_NAME)


def _clean_text(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            pages.append(extracted)
    return "\n".join(pages)


def _extract_docx(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")

    root = ElementTree.fromstring(xml)
    paragraphs = []
    for paragraph in root.iter():
        if paragraph.tag.endswith("}p"):
            texts = [node.text for node in paragraph.iter() if node.tag.endswith("}t") and node.text]
            if texts:
                paragraphs.append(" ".join(texts))
    return "\n".join(paragraphs)


def _extract_pptx(path: Path) -> str:
    slide_text = []
    with zipfile.ZipFile(path) as archive:
        slide_names = sorted(
            name for name in archive.namelist()
            if name.startswith("ppt/slides/slide") and name.endswith(".xml")
        )
        for slide_name in slide_names:
            root = ElementTree.fromstring(archive.read(slide_name))
            texts = [node.text for node in root.iter() if node.tag.endswith("}t") and node.text]
            if texts:
                slide_text.append(" ".join(texts))
    return "\n".join(slide_text)


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_pdf(path)
    if suffix == ".docx":
        return _extract_docx(path)
    if suffix == ".pptx":
        return _extract_pptx(path)
    if suffix in {".txt", ".md", ".markdown"}:
        return path.read_text(encoding="utf-8", errors="ignore")
    raise ValueError(f"Unsupported file type: {suffix}")


def list_note_files() -> list[dict]:
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    files = []
    for path in sorted(NOTES_DIR.iterdir(), key=lambda item: item.stat().st_mtime, reverse=True):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append({
                "name": path.name,
                "size": path.stat().st_size,
                "type": path.suffix.lower().lstrip("."),
            })
    return files


def delete_note_file(filename: str) -> dict:
    """Delete an uploaded note and all ChromaDB chunks indexed for it."""
    safe_filename = os.path.basename(filename or "")
    if not safe_filename or safe_filename != filename:
        return {
            "deleted": False,
            "message": "Invalid filename.",
            "uploaded_files": list_note_files(),
        }

    path = NOTES_DIR / safe_filename
    notes_root = NOTES_DIR.resolve()

    try:
        resolved_path = path.resolve()
    except FileNotFoundError:
        resolved_path = path.absolute()

    if notes_root not in resolved_path.parents:
        return {
            "deleted": False,
            "message": "Invalid filename.",
            "uploaded_files": list_note_files(),
        }

    try:
        collection = _collection()
        collection.delete(where={"source": safe_filename})
    except Exception:
        pass

    if path.exists():
        path.unlink()
        deleted = True
        message = "File deleted successfully."
    else:
        deleted = False
        message = "File not found. Related index entries were cleared if present."

    return {
        "deleted": deleted,
        "filename": safe_filename,
        "message": message,
        "uploaded_files": list_note_files(),
    }


def ingest_note_file(path: Path) -> dict:
    text = _clean_text(extract_text(path))
    if not text:
        return {
            "filename": path.name,
            "chunks": 0,
            "status": "skipped",
            "message": "No readable text found.",
        }

    chunks = splitter.split_text(text)
    collection = _collection()

    try:
        collection.delete(where={"source": path.name})
    except Exception:
        pass

    ids = [f"{path.stem}-{uuid.uuid4().hex}-{index}" for index, _ in enumerate(chunks)]
    metadatas = [{"source": path.name, "type": path.suffix.lower().lstrip(".")} for _ in chunks]

    # Chroma generates and stores embeddings for these documents through its configured embedding function.
    collection.add(ids=ids, documents=chunks, metadatas=metadatas)

    return {
        "filename": path.name,
        "chunks": len(chunks),
        "status": "stored",
        "message": "Indexed successfully.",
    }


def ingest_note_files(paths: list[Path]) -> dict:
    results = [ingest_note_file(path) for path in paths]
    return {
        "files": results,
        "uploaded_files": list_note_files(),
        "total_chunks": sum(item["chunks"] for item in results),
    }
