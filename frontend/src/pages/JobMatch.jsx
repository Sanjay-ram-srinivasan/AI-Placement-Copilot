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
  partial_skills: [],
  skill_scores: [],
  strongest_skills: [],
  weakest_skills: [],
  strengths: [],
  weaknesses: [],
  hiring_recommendation: '',
  improvement_suggestions: [],
  learning_roadmap: [],
  resource_recommendations: [],
  role_fit_explanation: '',
  full_analysis: '',
  target_role: 'Target Role',
  file_analyzed: '',
};

const EXAMPLE_JD = `Machine Learning Engineer
Requirements:
- Strong Python programming skills
- Experience with TensorFlow or PyTorch
- Knowledge of NLP, Computer Vision, or recommendation systems
- Familiarity with Docker, APIs, cloud deployment, and MLOps
- Strong data structures and algorithms fundamentals
- Clear communication and team collaboration skills`;

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function SkillBadges({ items, variant, emptyText }) {
  if (!items?.length) return <p className="job-match-empty">{emptyText}</p>;
  return <div className="job-match-badges">{items.map((item, index) => <span key={`${item}-${index}`} className={`chip ${variant}`}>{item}</span>)}</div>;
}

function DetailCards({ items, tone, emptyText }) {
  if (!items?.length) return <p className="job-match-empty">{emptyText}</p>;
  return <div className="jm-card-stack">{items.map((item, index) => <div key={`${item}-${index}`} className={`jm-mini-card ${tone}`}>{item}</div>)}</div>;
}

function buildPrintableReport(result, generated) {
  const list = (items) => (items || []).map((item) => `<li>${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('');
  const resources = (result.resource_recommendations || []).map((item) => `<h3>${escapeHtml(item.skill)}</h3><ul>${list(item.resources?.map((r) => `${r.type}: ${r.title}`))}</ul>`).join('');
  const questions = (generated.interview?.items || []).map((item, i) => `<li><strong>Q${i + 1}.</strong> ${escapeHtml(item.question)}</li>`).join('');

  return `<!doctype html><html><head><title>Job Match Report</title><style>body{font-family:Arial,sans-serif;color:#111827;padding:32px;line-height:1.6}h2{margin-top:26px;border-bottom:1px solid #ddd;padding-bottom:6px}.score{font-size:42px;font-weight:800;color:#6d28d9}li{margin:6px 0}</style></head><body>
    <h1>Job Match Report</h1><p>Resume: ${escapeHtml(result.file_analyzed || 'Latest resume')}</p><div class="score">${escapeHtml(result.match_score)}%</div>
    <h2>Hiring Recommendation</h2><p>${escapeHtml(result.hiring_recommendation)}</p>
    <h2>Skill Gap Analysis</h2><p>${escapeHtml(result.role_fit_explanation)}</p><ul>${list((result.skill_scores || []).map((s) => `${s.skill}: ${s.score}%`))}</ul>
    <h2>Missing Skills</h2><ul>${list(result.missing_skills)}</ul>
    <h2>Learning Roadmap</h2><ul>${list((result.learning_roadmap || []).map((w) => `Week ${w.week}: ${w.topic}`))}</ul>
    <h2>Resources</h2>${resources || '<p>No resources generated.</p>'}
    <h2>Interview Questions</h2><ol>${questions || '<li>Generate questions from the Job Match page to include them here.</li>'}</ol>
    <h2>Full Analysis</h2><p>${escapeHtml(result.full_analysis)}</p></body></html>`;
}

function JobMatch() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [generated, setGenerated] = useState({});
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();

  const score = result?.match_score ?? 0;
  const partialLabels = useMemo(() => (result?.partial_skills || []).map((item) => `${item.skill} via ${item.evidence?.join(', ')}`), [result]);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF resume.');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setResult(null);
    setGenerated({});
    setError('');
  };

  const handleMatch = async () => {
    if (!file) return setError('Please upload a PDF resume first.');
    if (!jobDescription.trim()) return setError('Please paste a job description first.');
    setError('');
    setResult(null);
    setGenerated({});
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('job_description', jobDescription.trim());
      const response = await apiPost('/job-match', form);
      if (response.data.error) setError(response.data.error);
      else setResult({ ...EMPTY_RESULT, ...response.data });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const runSkillAction = async (skill, type) => {
    setActionLoading(`${type}-${skill}`);
    setError('');
    try {
      const endpoint = type === 'quiz' ? '/generate-role-quiz' : type === 'interview' ? '/generate-interview-prep' : '/learning-roadmap';
      const payload = type === 'plan'
        ? { missing_skills: [skill], role: result?.target_role || 'Target Role' }
        : { skill, role: result?.target_role || 'Target Role', num_questions: 5, question_count: 5 };
      const res = await apiPost(endpoint, payload);
      setGenerated((current) => ({ ...current, [type]: res.data, activeSkill: skill, activeType: type }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActionLoading('');
    }
  };

  const handleInterviewAll = () => runSkillAction((result?.missing_skills || []).join(', ') || result?.target_role, 'interview');

  const handleExportPdf = () => {
    if (!result) return;
    const reportWindow = window.open('', '_blank', 'width=900,height=700');
    if (!reportWindow) return setError('Could not open the PDF export window. Please allow popups and try again.');
    reportWindow.document.write(buildPrintableReport(result, generated));
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="page job-match-page">
      <PageHeader eyebrow="Role fit analysis" title="Job Match" description="Upload a resume, paste a job description, and get skill gaps, roadmap, resources, quizzes, and interview prep." />

      <div className="job-match-grid">
        <section className="card card-pad job-match-input">
          <div className="job-match-panel-head"><div><h2>Resume Upload</h2><p>PDF resume used only for this match analysis.</p></div></div>
          <div className={`drop-zone job-match-drop${dragOver ? ' drag-over' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(event) => { event.preventDefault(); setDragOver(false); handleFile(event.dataTransfer.files[0]); }}>
            <div className="drop-zone-icon">{file ? 'OK' : 'PDF'}</div>
            <div className="drop-zone-title">{file ? fileName : 'Drop resume PDF here or click to browse'}</div>
            <div className="drop-zone-sub">PDF files only</div>
            {file && <span className="chip chip-green">Ready for matching</span>}
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={(event) => handleFile(event.target.files[0])} />
          </div>

          <div className="job-match-panel-head">
            <div><h2>Job Description</h2><p>Use the full role description for the most accurate comparison.</p></div>
            <button className="btn btn-ghost" type="button" onClick={() => setJobDescription(EXAMPLE_JD)}>Use example</button>
          </div>
          <textarea className="textarea job-match-textarea" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description here..." />
          <button className="btn btn-primary job-match-submit" type="button" onClick={handleMatch} disabled={loading || !file}>{loading ? <><span className="spinner" />Matching Resume...</> : 'Match Resume'}</button>
          {error && <div className="banner banner-error"><span>{error}</span></div>}
          <div className="banner banner-info"><span>Skill extraction is deterministic; roadmap, resources, quizzes, and interview prep are generated with the configured LLM provider.</span></div>
        </section>

        <section className="job-match-results">
          {!result && !loading && <div className="card card-pad job-match-placeholder"><h2>Match report</h2><p>Your score, skills, gaps, roadmap, resources, and prep actions will appear here.</p></div>}
          {loading && <div className="card card-pad job-match-loading"><span className="spinner" /><Skeleton lines={5} /><p>Extracting skills, scoring gaps, and building recommendations...</p></div>}

          {result && (
            <div className="fade-in">
              <div className="score-section job-match-score jm-gradient-panel">
                <ScoreRing score={score} label="Match Score" />
                <div className="score-meta">
                  <h3>{score >= 75 ? 'Strong role fit' : score >= 50 ? 'Promising with gaps' : 'Needs targeted improvement'}</h3>
                  <p>{result.hiring_recommendation || result.role_fit_explanation}</p>
                  <div className="job-match-meter"><span style={{ width: `${score}%` }} /></div>
                  <div className="job-match-progress-row"><span>{result.file_analyzed || 'Latest resume'}</span><strong>{score}%</strong></div>
                </div>
                <button className="btn btn-ghost" type="button" onClick={handleExportPdf}>Export PDF</button>
              </div>

              <div className="job-match-result-grid">
                <div className="card card-pad"><h2>Matched Skills</h2><SkillBadges items={result.skill_gap?.matched_skills || result.matching_skills} variant="chip-green" emptyText="No overlapping skills were detected." /></div>
                <div className="card card-pad"><h2>Missing Skills</h2><SkillBadges items={result.skill_gap?.missing_skills || result.missing_skills} variant="chip-red" emptyText="No major missing skills were detected." /></div>
                <div className="card card-pad"><h2>Partial Skills</h2><SkillBadges items={partialLabels} variant="chip-amber" emptyText="No partial matches were detected." /></div>
                <div className="card card-pad"><h2>Role Fit Explanation</h2><p className="jm-muted">{result.role_fit_explanation || result.full_analysis}</p></div>
              </div>

              <div className="job-match-result-grid">
                <div className="card card-pad"><h2>Strengths</h2><DetailCards items={result.strongest_skills?.length ? result.strongest_skills : result.strengths} tone="good" emptyText="Strengths will appear after analysis." /></div>
                <div className="card card-pad"><h2>Weaknesses</h2><DetailCards items={result.weakest_skills?.length ? result.weakest_skills : result.weaknesses} tone="risk" emptyText="Weaknesses will appear after analysis." /></div>
              </div>

              <div className="card card-pad">
                <h2>Skill Gap Analysis</h2>
                <div className="jm-bars">{(result.skill_scores || []).map((item) => <div key={item.skill} className="jm-bar-row"><span>{item.skill}</span><div className="job-match-meter"><span style={{ width: `${item.score}%` }} /></div><strong>{item.score}%</strong></div>)}</div>
              </div>

              <div className="card card-pad">
                <div className="job-match-panel-head"><div><h2>Personalized Learning Roadmap</h2><p>Generated from missing skills.</p></div></div>
                <div className="jm-timeline">{(result.learning_roadmap || []).map((item) => <div key={`${item.week}-${item.topic}`} className="jm-timeline-item"><span>Week {item.week}</span><strong>{item.topic}</strong></div>)}</div>
              </div>

              <div className="card card-pad">
                <h2>Learning Resources</h2>
                <div className="jm-resource-grid">{(result.resource_recommendations || []).map((item) => <article key={item.skill} className="jm-resource-card"><h3>{item.skill}</h3>{item.resources?.map((resource) => <div key={`${item.skill}-${resource.type}`}><span className="chip chip-cyan">{resource.type}</span><p>{resource.title}</p></div>)}</article>)}</div>
              </div>

              <div className="card card-pad">
                <div className="job-match-panel-head"><div><h2>Missing Skill Actions</h2><p>Generate focused practice without duplicating quiz, interview, or planner workflows.</p></div><button className="btn btn-ghost" type="button" onClick={handleInterviewAll}>Generate Questions</button></div>
                <div className="jm-action-grid">{(result.missing_skills || []).map((skill) => <article key={skill} className="jm-action-card"><strong>{skill}</strong><div><button className="btn btn-ghost" onClick={() => runSkillAction(skill, 'quiz')} disabled={!!actionLoading}>{actionLoading === `quiz-${skill}` ? <span className="spinner spinner-small" /> : null}Generate Quiz</button><button className="btn btn-ghost" onClick={() => runSkillAction(skill, 'interview')} disabled={!!actionLoading}>Generate Interview Questions</button><button className="btn btn-ghost" onClick={() => runSkillAction(skill, 'plan')} disabled={!!actionLoading}>Generate Study Plan</button></div></article>)}</div>
              </div>

              {generated.activeType && (
                <div className="card card-pad">
                  <h2>{generated.activeType === 'quiz' ? 'Generated Quiz' : generated.activeType === 'interview' ? 'Interview Preparation' : 'Focused Study Plan'}: {generated.activeSkill}</h2>
                  {generated.quiz?.questions?.map((q, index) => <div key={`${q.question}-${index}`} className="jm-generated-item"><strong>Q{index + 1}. {q.question}</strong><p>{q.answer}</p><small>{q.explanation}</small></div>)}
                  {generated.interview?.items?.map((q, index) => <div key={`${q.question}-${index}`} className="jm-generated-item"><strong>Q{index + 1}. {q.question}</strong><p>{q.model_answer}</p></div>)}
                  {generated.plan?.roadmap?.map((item) => <div key={`${item.week}-${item.topic}`} className="jm-generated-item"><strong>Week {item.week}</strong><p>{item.topic}</p></div>)}
                </div>
              )}

              {result.full_analysis && <div className="card card-pad"><h2>Full Analysis</h2><MarkdownRenderer content={result.full_analysis} /></div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default JobMatch;
