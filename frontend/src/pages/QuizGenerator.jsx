import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { PageHeader, Skeleton } from '../components/ui';
import './QuizGenerator.css';

const API = 'http://127.0.0.1:8000';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'short', label: 'Short Questions' },
  { value: 'long', label: 'Long Questions' },
  { value: 'mixed', label: 'Mixed' },
];
const QUESTION_COUNTS = [5, 10, 20, 50];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TOPIC_SCOPES = [
  { value: 'entire', label: 'Entire Document' },
  { value: 'specific', label: 'Specific Topic' },
];

function quizText(questions) {
  return questions.map((item, index) => {
    const options = item.options?.length ? `\n${item.options.join('\n')}` : '';
    return `Q${index + 1}. ${item.question}${options}\nAnswer: ${item.answer}\nExplanation: ${item.explanation || ''}`;
  }).join('\n\n');
}

function downloadBlob(filename, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function makePdfContent(title, body) {
  const safe = `${title}\n\n${body}`.replace(/[()\\]/g, '\\$&').slice(0, 12000);
  const lines = safe.split('\n').flatMap((line) => line.match(/.{1,86}/g) || ['']);
  const stream = ['BT', '/F1 10 Tf', '40 780 Td', '14 TL', ...lines.map((line) => `(${line}) Tj T*`), 'ET'].join('\n');
  return `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length ${stream.length} >> stream
${stream}
endstream endobj
trailer << /Root 1 0 R >>
%%EOF`;
}

function QuizGenerator() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [questionType, setQuestionType] = useState('mcq');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [topicScope, setTopicScope] = useState('entire');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const selectedCount = selectedFiles.length;
  const canGenerate = selectedCount > 0 && !loading && (topicScope === 'entire' || topic.trim());

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await axios.get(`${API}/notes/files`);
        setFiles(res.data.files || []);
      } catch {
        setFiles([]);
      }
    };
    loadFiles();
  }, []);

  const allSelected = useMemo(() => files.length > 0 && selectedFiles.length === files.length, [files, selectedFiles]);

  const toggleFile = (fileName) => {
    setSelectedFiles((current) => (
      current.includes(fileName) ? current.filter((name) => name !== fileName) : [...current, fileName]
    ));
  };

  const generateQuiz = async () => {
    if (!canGenerate) {
      setError(topicScope === 'specific' && !topic.trim() ? 'Enter a specific topic.' : 'Select at least one uploaded notes file.');
      return;
    }
    setLoading(true);
    setProgress('Retrieving indexed note chunks');
    setError('');
    setQuestions([]);
    setSources([]);

    try {
      window.setTimeout(() => setProgress('Building Groq prompt from your notes'), 350);
      window.setTimeout(() => setProgress('Generating questions and answers'), 900);
      const res = await axios.post(`${API}/quiz-generator`, {
        selected_files: selectedFiles,
        question_type: questionType,
        question_count: questionCount,
        difficulty,
        topic_scope: topicScope,
        topic,
      });
      if (res.data.error) setError(res.data.error);
      setQuestions(res.data.questions || []);
      setSources(res.data.sources || []);
      setProgress('Quiz ready');
    } catch (e) {
      setError(e.response?.data?.detail || 'Quiz generation failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const copyQuiz = async () => {
    await navigator.clipboard.writeText(quizText(questions));
  };

  const downloadPdf = () => {
    downloadBlob('quiz.pdf', 'application/pdf', makePdfContent('Generated Quiz', quizText(questions)));
  };

  const downloadDocx = () => {
    const html = `<html><body><pre>${quizText(questions).replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))}</pre></body></html>`;
    downloadBlob('quiz.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', html);
  };

  return (
    <div className="page quiz-page">
      <PageHeader eyebrow="Exam practice" title="Quiz Generator" description="Generate focused quizzes from uploaded notes using Groq and ChromaDB context." />

      <div className="quiz-layout">
        <section className="card card-pad quiz-controls">
          <div className="quiz-control-head">
            <div>
              <h2>Select Uploaded Notes</h2>
              <p>Questions are generated only from indexed note chunks.</p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={() => setSelectedFiles(allSelected ? [] : files.map((file) => file.name))} disabled={!files.length}>
              {allSelected ? 'Clear' : 'Select all'}
            </button>
          </div>

          <div className="quiz-file-list">
            {files.length ? files.map((file) => (
              <label key={file.name} className="quiz-file-row">
                <input type="checkbox" checked={selectedFiles.includes(file.name)} onChange={() => toggleFile(file.name)} />
                <span><strong>{file.name}</strong><small>{file.type.toUpperCase()}</small></span>
              </label>
            )) : <div className="quiz-empty">Upload notes in Chat with Notes first.</div>}
          </div>

          <div className="quiz-field">
            <h2>Difficulty</h2>
            <div className="toggle-group quiz-toggle-group">
              {DIFFICULTIES.map((item) => (
                <button key={item} className={`toggle-btn${difficulty === item ? ' active' : ''}`} type="button" onClick={() => setDifficulty(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
              ))}
            </div>
          </div>

          <div className="quiz-field">
            <h2>Topic Scope</h2>
            <div className="toggle-group quiz-toggle-group">
              {TOPIC_SCOPES.map((item) => (
                <button key={item.value} className={`toggle-btn${topicScope === item.value ? ' active' : ''}`} type="button" onClick={() => setTopicScope(item.value)}>{item.label}</button>
              ))}
            </div>
            {topicScope === 'specific' && (
              <input className="input quiz-topic-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic, e.g. normalization, transformers, paging" />
            )}
          </div>

          <div className="quiz-field">
            <h2>Quiz Type</h2>
            <div className="toggle-group quiz-toggle-group">
              {QUESTION_TYPES.map((type) => (
                <button key={type.value} className={`toggle-btn${questionType === type.value ? ' active' : ''}`} type="button" onClick={() => setQuestionType(type.value)}>{type.label}</button>
              ))}
            </div>
          </div>

          <div className="quiz-field">
            <h2>Number of Questions</h2>
            <div className="toggle-group quiz-count-group">
              {QUESTION_COUNTS.map((count) => (
                <button key={count} className={`toggle-btn${questionCount === count ? ' active' : ''}`} type="button" onClick={() => setQuestionCount(count)}>{count}</button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary quiz-generate-btn" type="button" onClick={generateQuiz} disabled={!canGenerate}>
            {loading ? <><span className="spinner" />Generating</> : 'Generate Quiz'}
          </button>
          {progress && <div className="quiz-progress"><span className={loading ? 'progress-dot active' : 'progress-dot'} />{progress}</div>}
          {error && <div className="banner banner-error quiz-error"><span>{error}</span></div>}
        </section>

        <section className="quiz-results">
          {!questions.length && !loading && (
            <div className="card card-pad quiz-placeholder"><h2>Generated questions</h2><p>Select notes and generate a quiz to see question cards, answers, and explanations.</p></div>
          )}

          {loading && (
            <div className="card card-pad quiz-placeholder"><span className="spinner" /><Skeleton lines={5} /><p>{progress || 'Generating your quiz...'}</p></div>
          )}

          {questions.length > 0 && (
            <div className="fade-in quiz-question-stack">
              <div className="card card-pad quiz-summary">
                <div><h2>{questions.length} Questions Generated</h2><p>{difficulty} · {questionType} · {selectedCount} selected file(s)</p></div>
                <div className="quiz-export-actions">
                  <button className="btn btn-ghost" type="button" onClick={copyQuiz}>Copy Quiz</button>
                  <button className="btn btn-ghost" type="button" onClick={downloadPdf}>Download PDF</button>
                  <button className="btn btn-ghost" type="button" onClick={downloadDocx}>Download DOCX</button>
                </div>
                <div className="quiz-source-tags">{sources.map((source) => <span key={source} className="chip chip-cyan">{source}</span>)}</div>
              </div>

              {questions.map((item, index) => (
                <article key={`${item.question}-${index}`} className="card card-pad quiz-question-card">
                  <div className="quiz-card-meta">
                    <span className="quiz-question-number">Question {index + 1}</span>
                    <span className="chip chip-purple">{item.type || questionType}</span>
                    {item.topic && <span className="chip chip-cyan">{item.topic}</span>}
                  </div>
                  <h2>{item.question}</h2>
                  {item.options?.length > 0 && <div className="quiz-options">{item.options.map((option) => <span key={option} className="quiz-option">{option}</span>)}</div>}
                  <div className="quiz-answer-grid">
                    <div><h3>Answer</h3><MarkdownRenderer content={item.answer} /></div>
                    <div><h3>Explanation</h3><MarkdownRenderer content={item.explanation} /></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default QuizGenerator;
