import { useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { GlassCard, PageHeader, ProgressBar, Skeleton } from '../components/ui';
import { apiPost, getApiErrorMessage } from '../api';

const ROLES = ['ML Engineer', 'Data Scientist', 'Backend Developer', 'Full Stack Developer', 'Frontend Developer', 'DevOps Engineer'];
const WEEKS_OPTIONS = [4, 6, 8, 12, 16];

function StudyPlan() {
  const [role, setRole] = useState('ML Engineer');
  const [weeks, setWeeks] = useState(8);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setRoadmap('');
    setLoading(true);
    try {
      const res = await apiPost('/study-plan', { target_role: role, duration_weeks: weeks });
      const result = res.data;
      if (result.error) {
        setError(result.error);
      } else {
        setRoadmap(result.roadmap || '');
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Learning roadmap"
        title="Study Planner"
        description="Generate a personalized week-by-week placement roadmap tailored to your target role."
      />

      <div className="split-layout">
        <GlassCard className="sticky-panel">
          <div className="panel-title">
            <div>
              <h2>Planner Controls</h2>
              <p>Choose a target role and realistic preparation window.</p>
            </div>
            <span className="chip chip-purple">{weeks} weeks</span>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <div className="eyebrow">Target Role</div>
              <div className="toggle-group">
                {ROLES.map((r) => (
                  <button key={r} className={`toggle-btn${role === r ? ' active' : ''}`} onClick={() => setRole(r)} id={`sp-role-${r.replace(/\s+/g, '-').toLowerCase()}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow">Duration</div>
              <div className="toggle-group">
                {WEEKS_OPTIONS.map((w) => (
                  <button key={w} className={`toggle-btn${weeks === w ? ' active' : ''}`} onClick={() => setWeeks(w)} id={`sp-weeks-${w}`}>
                    {w} weeks
                  </button>
                ))}
              </div>
            </div>
            <ProgressBar value={(weeks / 16) * 100} />
            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} id="generate-plan-btn">
              {loading ? <><div className="spinner" />Generating Roadmap</> : 'Generate Study Plan'}
            </button>
          </div>
          {error && <div className="banner banner-error" style={{ marginTop: 14 }}><span>{error}</span></div>}
        </GlassCard>

        <div>
          {loading && (
            <GlassCard>
              <div className="panel-title"><h2>Building roadmap</h2><span className="spinner" /></div>
              <Skeleton lines={8} />
            </GlassCard>
          )}
          {roadmap && !loading && (
            <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
              <div className="panel-title">
                <div>
                  <h2>{weeks}-Week Roadmap</h2>
                  <p>{role}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip chip-purple">{role}</span>
                  <span className="chip chip-cyan">{weeks} weeks</span>
                </div>
              </div>
              <GlassCard>
                <MarkdownRenderer content={roadmap} />
              </GlassCard>
              <div className="banner banner-info">
                <span>Use Interview Prep to practice questions for each topic as you complete it.</span>
              </div>
            </div>
          )}
          {!roadmap && !loading && (
            <GlassCard>
              <div className="panel-title"><h2>Roadmap preview</h2><span className="chip chip-cyan">Ready</span></div>
              <p style={{ color: 'var(--muted)' }}>Your personalized weekly plan will appear here.</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyPlan;
