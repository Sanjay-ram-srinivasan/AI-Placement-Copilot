import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.notes import NOTES_DIR, SUPPORTED_EXTENSIONS, ingest_note_files


def main():
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    paths = [
        path for path in NOTES_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not paths:
        print("No supported notes found in data/notes.")
        print("Supported files: PDF, DOCX, PPTX, TXT, MD, Markdown")
        return

    result = ingest_note_files(paths)
    for item in result["files"]:
        print(f"{item['filename']}: {item['status']} ({item['chunks']} chunks)")
    print(f"\nStored {result['total_chunks']} chunks")


if __name__ == "__main__":
    main()
