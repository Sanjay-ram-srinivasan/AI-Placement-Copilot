import { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { PageHeader, Skeleton } from '../components/ui';
import { apiDelete, apiGet, apiPost, getApiErrorMessage } from '../api';

const SUGGESTED = [
  'What is normalization in DBMS?',
  'Explain the difference between process and thread.',
  'What are transformers in NLP?',
  'Summarize the main ideas from my notes.',
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'pptx', 'txt', 'md', 'markdown'];

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-trash">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z" />
      <path d="M6 9h12l-1 11H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
    </svg>
  );
}

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm your AI Learning Assistant. Upload notes, then ask me anything from them.", sources: [] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [deletingFile, setDeletingFile] = useState('');
  const [toast, setToast] = useState('');
  const bottomRef = useRef();
  const fileInputRef = useRef();

  const loadUploadedFiles = async () => {
    try {
      const res = await apiGet('/notes/files');
      setUploadedFiles(res.data.files || []);
    } catch (e) {
      console.error(e);
      setUploadedFiles([]);
    }
  };

  useEffect(() => { loadUploadedFiles(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleFileSelect = (files) => {
    const picked = Array.from(files || []);
    const invalid = picked.find((file) => !ALLOWED_EXTENSIONS.includes(file.name.split('.').pop()?.toLowerCase()));
    if (invalid) {
      setUploadError(`${invalid.name} is not supported. Use PDF, DOCX, PPTX, TXT, or Markdown.`);
      return;
    }
    setSelectedFiles(picked);
    setUploadError('');
  };

  const uploadNotes = async () => {
    if (!selectedFiles.length || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      selectedFiles.forEach((file) => form.append('files', file));
      const res = await apiPost('/upload-notes', form);
      setUploadedFiles(res.data.uploaded_files || []);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessages((m) => [...m, {
        role: 'ai',
        content: `Indexed ${res.data.files?.length || 0} file(s) into ChromaDB. You can ask questions from them now.`,
        sources: (res.data.files || []).map((file) => file.filename),
      }]);
    } catch (e) {
      setUploadError(getApiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const deleteUploadedFile = async (file) => {
    if (!file?.name || deletingFile) return;
    const confirmed = window.confirm(`Delete "${file.name}" and remove it from search results?`);
    if (!confirmed) return;

    setDeletingFile(file.name);
    setUploadError('');
    try {
      const res = await apiDelete(`/notes/files/${encodeURIComponent(file.name)}`);
      setUploadedFiles(res.data.uploaded_files || []);
      setToast('File deleted successfully.');
    } catch (e) {
      setUploadError(getApiErrorMessage(e));
      await loadUploadedFiles();
    } finally {
      setDeletingFile('');
    }
  };

  const sendMessage = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;
    setMessages((m) => [...m, { role: 'user', content: question, sources: [] }]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiPost('/ask', { question });
      setMessages((m) => [...m, { role: 'ai', content: res.data.answer || 'No response.', sources: res.data.sources || [] }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'ai', content: getApiErrorMessage(e), sources: [] }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="workspace-page">
      <div className="chat-container">
        <div className="chat-topbar">
          <PageHeader
            eyebrow="Active session"
            title="Chat with Notes"
            description="RAG-powered Q&A over uploaded academic material with source-aware answers."
          />

          <div className="notes-upload-panel">
            <div className="notes-upload-actions">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.pptx,.txt,.md,.markdown"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="notes-file-input"
              />
              <button className="btn btn-primary" onClick={uploadNotes} disabled={uploading || !selectedFiles.length} type="button">
                {uploading ? <><div className="spinner" />Indexing</> : 'Upload Notes'}
              </button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="notes-selected">
                {selectedFiles.map((file) => <span key={file.name} className="chip chip-purple">{file.name}</span>)}
              </div>
            )}
            {uploadError && <div className="banner banner-error notes-upload-error"><span>{uploadError}</span></div>}
            <div className="notes-files-list">
              <span className="notes-files-label">Uploaded files</span>
              {uploadedFiles.length
                ? uploadedFiles.map((file) => (
                  <span key={file.name} className="note-file-pill">
                    <span className="chip chip-cyan note-file-name">{file.name}</span>
                    <button
                      className="note-delete-btn"
                      type="button"
                      onClick={() => deleteUploadedFile(file)}
                      disabled={deletingFile === file.name}
                      aria-label={`Delete ${file.name}`}
                      title="Delete file"
                    >
                      {deletingFile === file.name ? <div className="spinner spinner-small" /> : <TrashIcon />}
                    </button>
                  </span>
                ))
                : <span className="notes-empty">No notes uploaded yet</span>}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {SUGGESTED.map((s) => (
              <button key={s} className="btn btn-ghost" onClick={() => sendMessage(s)} type="button">{s}</button>
            ))}
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={`${msg.role}-${i}`} className={`chat-bubble-wrap ${msg.role}`}>
              <div className={`chat-bubble ${msg.role}`}>
                {msg.role === 'ai' ? <MarkdownRenderer content={msg.content} /> : msg.content}
              </div>
              {msg.sources?.length > 0 && (
                <div className="chat-sources">
                  <span style={{ fontSize: 11, color: 'var(--faint)' }}>Sources:</span>
                  {msg.sources.map((src) => <span key={src} className="chip chip-cyan chat-source">{src}</span>)}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-wrap ai">
              <div className="chat-bubble ai">
                <Skeleton lines={3} />
                <div className="chat-typing" style={{ marginTop: 10 }}>
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            id="chat-input"
            className="textarea"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything from your notes..."
            style={{ resize: 'none', minHeight: 52, maxHeight: 120 }}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} id="send-message-btn">
            {loading ? <div className="spinner" /> : 'Send'}
          </button>
        </div>
      </div>
      {toast && <div className="toast toast-success" role="status">{toast}</div>}
    </div>
  );
}

export default Chat;
