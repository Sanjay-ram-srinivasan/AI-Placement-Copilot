import { useMemo, useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { GlassCard, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import { apiPost, getApiErrorMessage } from '../api';

const ROLES = ['Software Engineer', 'AI Engineer', 'ML Engineer', 'Data Analyst', 'Data Scientist', 'Full Stack Developer'];
const EXPERIENCE_LEVELS = ['Fresher', '1-3 Years', '3-5 Years'];
const COUNTS = [5, 10, 20];

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="accordion-item interview-card">
      <div className="accordion-header" onClick={() => setOpen(!open)}>
        <div className="interview-question-head">
          <span className="action-icon">{index + 1}</span>
          <div>
            <div className="accordion-q">{q.question}</div>
            <div className="interview-card-tags">
              <span className="chip chip-cyan">{q.category}</span>
              {(q.key_concepts || []).slice(0, 3).map((item) => <span key={item} className="chip chip-purple">{item}</span>)}
            </div>
          </div>
        </div>
        <span className={`accordion-chevron${open ? ' open' : ''}`}>v</span>
      </div>
      {open && (
        <div className="accordion-body fade-in">
          <h3>Model Answer</h3>
          <MarkdownRenderer content={q.model_answer} />
          {q.evaluation_points?.length > 0 && (
            <>
              <h3>Evaluation Points</h3>
              <ul className="job-match-list">{q.evaluation_points.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function InterviewGenerator() {
  const [role, setRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [rawText, setRawText] = useState('');
  const [focus, setFocus] = useState({ strengths: [], weaknesses: [], guidance: '' });
  const [error, setError] = useState('');
  const [mockMode, setMockMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState([]);

  const readiness = useMemo(() => {
    if (!evaluations.length) return 0;
    return Math.round(evaluations.reduce((sum, item) => sum + (item.readiness_score || item.score * 10 || 0), 0) / evaluations.length);
  }, [evaluations]);

  const currentQuestion = questions[currentIndex];

  const handleGenerate = async () => {
    setError('');
    setQuestions([]);
    setRawText('');
    setFocus({ strengths: [], weaknesses: [], guidance: '' });
    setEvaluations([]);
    setCurrentIndex(0);
    setMockMode(false);
    setLoading(true);
    try {
      const res = await apiPost('/interview-generator', {
        role,
        experience_level: experienceLevel,
        difficulty: experienceLevel,
        num_questions: count,
      });
      setQuestions(res.data.items || []);
      setRawText(res.data.questions || '');
      setFocus({
        strengths: res.data.strengths_focus || [],
        weaknesses: res.data.weaknesses_focus || [],
        guidance: res.data.readiness_guidance || '',
      });
      if (res.data.error && !(res.data.items || []).length) setError(res.data.error);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!currentQuestion || !answer.trim()) return;
    setEvaluating(true);
    setError('');
    try {
      const res = await apiPost('/interview-evaluate', {
        role,
        experience_level: experienceLevel,
        question: currentQuestion.question,
        model_answer: currentQuestion.model_answer,
        user_answer: answer,
      });
      setEvaluations((items) => [...items, { question: currentQuestion.question, ...res.data }]);
      setAnswer('');
      if (currentIndex < questions.length - 1) setCurrentIndex((value) => value + 1);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Interview coach" title="AI Interview Coach" description="Generate role-specific practice, run mock interviews, and get scored feedback from Groq." />

      <div className="split-layout">
        <GlassCard className="sticky-panel">
          <div className="panel-title">
            <div><h2>Session Controls</h2><p>Choose the target role, experience level, and question volume.</p></div>
          </div>
          <div className="interview-control-stack">
            <div>
              <div className="eyebrow">Role</div>
              <div className="toggle-group">{ROLES.map((item) => <button key={item} className={`toggle-btn${role === item ? ' active' : ''}`} onClick={() => setRole(item)}>{item}</button>)}</div>
            </div>
            <div>
              <div className="eyebrow">Experience</div>
              <div className="toggle-group">{EXPERIENCE_LEVELS.map((item) => <button key={item} className={`toggle-btn${experienceLevel === item ? ' active' : ''}`} onClick={() => setExperienceLevel(item)}>{item}</button>)}</div>
            </div>
            <div>
              <div className="eyebrow">Generate</div>
              <div className="toggle-group">{COUNTS.map((item) => <button key={item} className={`toggle-btn${count === item ? ' active' : ''}`} onClick={() => setCount(item)}>{item}</button>)}</div>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? <><div className="spinner" />Generating</> : 'Generate Coach Session'}
            </button>
            {questions.length > 0 && (
              <button className="btn btn-ghost" type="button" onClick={() => { setMockMode(!mockMode); setCurrentIndex(0); }}>
                {mockMode ? 'View Question Bank' : 'Start Mock Interview'}
              </button>
            )}
          </div>
          {error && <div className="banner banner-error" style={{ marginTop: 14 }}><span>{error}</span></div>}
        </GlassCard>

        <div className="interview-results">
          {loading && <GlassCard><div className="panel-title"><h2>Building interview set</h2><span className="spinner" /></div><Skeleton lines={7} /></GlassCard>}

          {!loading && questions.length > 0 && (
            <>
              <GlassCard className="interview-score-panel">
                <div className="panel-title">
                  <div><h2>{mockMode ? 'Mock Interview' : `${questions.length} Coach Questions`}</h2><p>{role} · {experienceLevel}</p></div>
                  <span className="chip chip-green">Groq</span>
                </div>
                <div className="score-meta">
                  <div className="metric-value">{readiness || '--'}{readiness ? '%' : ''}</div>
                  <div className="metric-label">Final interview readiness score</div>
                  <ProgressBar value={readiness} tone="green" />
                </div>
                {focus.guidance && <p className="interview-guidance">{focus.guidance}</p>}
              </GlassCard>

              {mockMode ? (
                <GlassCard className="mock-panel">
                  <div className="panel-title">
                    <div><h2>Question {currentIndex + 1} of {questions.length}</h2><p>{currentQuestion?.category}</p></div>
                    <span className="chip chip-purple">Score answers out of 10</span>
                  </div>
                  <h2 className="mock-question">{currentQuestion?.question}</h2>
                  <textarea className="textarea" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..." />
                  <button className="btn btn-primary" type="button" onClick={evaluateAnswer} disabled={evaluating || !answer.trim()}>
                    {evaluating ? <><span className="spinner" />Evaluating</> : 'Submit Answer'}
                  </button>
                </GlassCard>
              ) : (
                <div className="accordion">{questions.map((q, i) => <QuestionCard key={`${q.question}-${i}`} q={q} index={i} />)}</div>
              )}

              {evaluations.length > 0 && (
                <GlassCard>
                  <div className="panel-title"><h2>Strengths & Weaknesses</h2><span className="chip chip-cyan">{evaluations.length} evaluated</span></div>
                  <div className="result-grid">
                    <div><h3>Strengths</h3><ul className="job-match-list">{evaluations.flatMap((e) => e.strengths || []).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul></div>
                    <div><h3>Weaknesses</h3><ul className="job-match-list">{evaluations.flatMap((e) => e.weaknesses || []).map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul></div>
                  </div>
                  <div className="interview-eval-stack">
                    {evaluations.map((item, index) => (
                      <div key={`${item.question}-${index}`} className="interview-eval-card">
                        <span className="chip chip-green">{item.score}/10</span>
                        <strong>{item.question}</strong>
                        <p>{item.feedback}</p>
                        <ul>{(item.improvement_suggestions || []).map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </>
          )}

          {!loading && rawText && !questions.length && <GlassCard className="fade-in"><MarkdownRenderer content={rawText} /></GlassCard>}
          {!loading && !rawText && <GlassCard><div className="panel-title"><h2>Practice queue</h2><span className="chip chip-cyan">Ready</span></div><p style={{ color: 'var(--muted)' }}>Generated coaching questions and mock interview feedback will appear here.</p></GlassCard>}
        </div>
      </div>
    </div>
  );
}

export default InterviewGenerator;
