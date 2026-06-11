import { useMemo, useRef, useState } from 'react';
import ScoreRing from '../components/ScoreRing';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { PageHeader, Skeleton } from '../components/ui';
import { apiPost, getApiErrorMessage } from '../api';
import './JobMatch.css';

const EMPTY_RESULT = {
  match_score: 0,
  matching_skills: [],
  missing_skills: [],
  strengths: [],
  weaknesses: [],
  hiring_recommendation: '',
  improvement_suggestions: [],
  recommendations: [],
  full_analysis: '',
  file_analyzed: '',
};

const EXAMPLE_JD = `Software Engineer - Machine Learning
Location: Bangalore, India

Requirements:
- Strong Python programming skills
- Experience with TensorFlow or PyTorch
- Knowledge of NLP, Computer Vision, or recommendation systems
- Familiarity with Docker, APIs, cloud deployment, and MLOps
- Strong data structures and algorithms fundamentals
- Clear communication and team collaboration skills`;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function SkillBadges({ items, variant, emptyText }) {
  if (!items?.length) {
    return <p className="job-match-empty">{emptyText}</p>;
  }

  return (
    <div className="job-match-badges">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className={`chip ${variant}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function DetailList({ items, emptyText }) {
  if (!items?.length) {
    return <p className="job-match-empty">{emptyText}</p>;
  }

  return (
    <ol className="job-match-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ol>
  );
}

function buildPrintableReport(result) {
  const list = (items) => items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <title>Job Match Analysis</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.6; }
          h1 { margin-bottom: 4px; }
          h2 { margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
          .score { font-size: 40px; font-weight: 700; color: #4f46e5; }
          li { margin: 6px 0; }
          .analysis { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>Job Match Analysis</h1>
        <p>Resume analyzed: ${escapeHtml(result.file_analyzed || 'Latest uploaded resume')}</p>
        <div class="score">${escapeHtml(result.match_score)}%</div>
        <h2>Hiring Recommendation</h2>
        <p>${escapeHtml(result.hiring_recommendation || '')}</p>
        <h2>Matching Skills</h2>
        <ul>${list(result.matching_skills || [])}</ul>
        <h2>Missing Skills</h2>
        <ul>${list(result.missing_skills || [])}</ul>
        <h2>Strengths</h2>
        <ul>${list(result.strengths || [])}</ul>
        <h2>Weaknesses</h2>
        <ul>${list(result.weaknesses || [])}</ul>
        <h2>Improvement Suggestions</h2>
        <ol>${list(result.improvement_suggestions || result.recommendations || [])}</ol>
        <h2>Full Analysis</h2>
        <div class="analysis">${escapeHtml(result.full_analysis || '')}</div>
      </body>
    </html>
  `;
}

function JobMatch() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const score = result?.match_score ?? 0;
  const totalSkills = (result?.matching_skills?.length || 0) + (result?.missing_skills?.length || 0);
  const matchedSkillPercent = useMemo(() => {
    if (!totalSkills) return 0;
    return Math.round(((result?.matching_skills?.length || 0) / totalSkills) * 100);
  }, [result, totalSkills]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF resume.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setResult(null);
    setError('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const handleMatch = async () => {
    if (!file) {
      setError('Please upload a PDF resume first.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please paste a job description first.');
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('job_description', jobDescription.trim());

      const response = await apiPost('/job-match', form);

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setResult({ ...EMPTY_RESULT, ...response.data });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!result) return;

    // Browser print keeps the app dependency-free while still allowing Save as PDF.
    const reportWindow = window.open('', '_blank', 'width=900,height=700');
    if (!reportWindow) {
      setError('Could not open the PDF export window. Please allow popups and try again.');
      return;
    }

    reportWindow.document.write(buildPrintableReport(result));
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="page job-match-page">
      <PageHeader
        eyebrow="Role fit analysis"
        title="Job Match"
        description="Upload a resume, paste a job description, and get a structured role-fit analysis."
      />

      <div className="job-match-grid">
        <section className="card card-pad job-match-input">
          <div className="job-match-panel-head">
            <div>
              <h2>Resume Upload</h2>
              <p>PDF resume used only for this match analysis.</p>
            </div>
          </div>

          <div
            className={`drop-zone job-match-drop${dragOver ? ' drag-over' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="drop-zone-icon">{file ? 'OK' : 'PDF'}</div>
            <div className="drop-zone-title">
              {file ? fileName : 'Drop resume PDF here or click to browse'}
            </div>
            <div className="drop-zone-sub">PDF files only</div>
            {file && <span className="chip chip-green">Ready for matching</span>}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(event) => handleFile(event.target.files[0])}
            />
          </div>

          <div className="job-match-panel-head">
            <div>
              <h2>Job Description</h2>
              <p>Use the full role description for the most accurate comparison.</p>
            </div>
            <button className="btn btn-ghost" type="button" onClick={() => setJobDescription(EXAMPLE_JD)}>
              Use example
            </button>
          </div>

          <textarea
            className="textarea job-match-textarea"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here..."
          />

          <button
            className="btn btn-primary job-match-submit"
            type="button"
            onClick={handleMatch}
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Matching Resume...
              </>
            ) : (
              'Match Resume'
            )}
          </button>

          {error && (
            <div className="banner banner-error">
              <span>{error}</span>
            </div>
          )}

          <div className="banner banner-info">
            <span>The analysis compares this resume PDF directly against the pasted job description.</span>
          </div>
        </section>

        <section className="job-match-results">
          {!result && !loading && (
            <div className="card card-pad job-match-placeholder">
              <h2>Match report</h2>
              <p>Your score, skills, strengths, gaps, recommendation, and improvements will appear here.</p>
            </div>
          )}

          {loading && (
            <div className="card card-pad job-match-loading">
              <span className="spinner" />
              <Skeleton lines={5} />
              <p>Comparing resume skills, role keywords, and ATS alignment...</p>
            </div>
          )}

          {result && (
            <div className="fade-in">
              <div className="score-section job-match-score">
                <ScoreRing score={score} label="Match Score" />
                <div className="score-meta">
                  <h3>{score >= 75 ? 'Strong role fit' : score >= 50 ? 'Promising with gaps' : 'Needs targeted improvement'}</h3>
                  <p>
                    {result.file_analyzed
                      ? `Analyzed against ${result.file_analyzed}.`
                      : 'Analyzed against the latest uploaded resume.'}
                  </p>
                  <div className="job-match-meter" aria-label="Skill match visualization">
                    <span style={{ width: `${matchedSkillPercent}%` }} />
                  </div>
                  <p>{matchedSkillPercent}% of detected role skills are currently represented.</p>
                  <div className="job-match-progress-row">
                    <span>Overall match</span>
                    <strong>{score}%</strong>
                  </div>
                  <div className="job-match-meter job-match-score-meter" aria-label="Overall match score">
                    <span style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>

              <div className="card card-pad job-match-recommendation-card">
                <div>
                  <h2>Hiring Recommendation</h2>
                  <p>{result.hiring_recommendation || 'No recommendation returned.'}</p>
                </div>
                <span className={`chip ${score >= 75 ? 'chip-green' : score >= 50 ? 'chip-amber' : 'chip-red'}`}>
                  {score >= 75 ? 'High Fit' : score >= 50 ? 'Conditional Fit' : 'Low Fit'}
                </span>
              </div>

              <div className="job-match-result-grid">
                <div className="card card-pad">
                  <h2>Matching Skills</h2>
                  <SkillBadges
                    items={result.matching_skills}
                    variant="chip-green"
                    emptyText="No overlapping skills were detected."
                  />
                </div>

                <div className="card card-pad">
                  <h2>Missing Skills</h2>
                  <SkillBadges
                    items={result.missing_skills}
                    variant="chip-red"
                    emptyText="No major missing skills were detected."
                  />
                </div>
              </div>

              <div className="job-match-result-grid">
                <div className="card card-pad">
                  <h2>Strengths</h2>
                  <DetailList
                    items={result.strengths}
                    emptyText="Strengths will appear after analysis."
                  />
                </div>

                <div className="card card-pad">
                  <h2>Weaknesses</h2>
                  <DetailList
                    items={result.weaknesses}
                    emptyText="Weaknesses will appear after analysis."
                  />
                </div>
              </div>

              <div className="card card-pad">
                <div className="job-match-panel-head">
                  <div>
                    <h2>Improvement Suggestions</h2>
                    <p>Target these changes before applying.</p>
                  </div>
                  <button className="btn btn-ghost" type="button" onClick={handleExportPdf}>
                    Export PDF
                  </button>
                </div>
                <DetailList
                  items={result.improvement_suggestions?.length ? result.improvement_suggestions : result.recommendations}
                  emptyText="Improvement suggestions will appear after analysis."
                />
              </div>

              {result.full_analysis && (
                <div className="card card-pad">
                  <h2>Full Analysis</h2>
                  <MarkdownRenderer content={result.full_analysis} />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default JobMatch;
