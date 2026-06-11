import { useNavigate } from 'react-router-dom';
import GlassPanel from '../components/GlassPanel';
import ThemeToggle from '../components/ThemeToggle';
import { MetricCard, MiniBars, PageHeader, ProgressBar, Sparkline } from '../components/ui';

const actions = [
  { icon: 'N', title: 'Upload New Notes', desc: 'Index study material into ChromaDB.', to: '/chat' },
  { icon: 'Q', title: 'Generate Quiz', desc: 'Create questions from uploaded notes.', to: '/quiz-generator' },
  { icon: 'R', title: 'Analyze Resume', desc: 'Find ATS gaps and strengths.', to: '/resume' },
  { icon: 'I', title: 'Mock Interview', desc: 'Practice role-specific questions.', to: '/interview' },
];

function Dashboard() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning, Sanjay 👋' : hour < 17 ? 'Good Afternoon, Sanjay 👋' : 'Good Evening, Sanjay 👋';

  return (
    <div className="page">
      <div className="animated-bg" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>

      <PageHeader
        eyebrow="AI Placement OS"
        title={<>{greeting}</>}
        description="Your AI-powered placement and learning workspace."
        actions={<><button className="btn btn-primary" onClick={() => navigate('/chat')}>New Session</button><ThemeToggle /></>}
      />

      <div className="metric-grid">
        <MetricCard icon="N" label="Indexed Notes" value="12" sub="ChromaDB ready" tone="purple" />
        <MetricCard icon="A" label="ATS Score" value="85" sub="resume baseline" tone="green" />
        <MetricCard icon="J" label="Job Match" value="92%" sub="target alignment" tone="cyan" />
        <MetricCard icon="Q" label="Questions Generated" value="24" sub="generated today" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <GlassPanel>
          <div className="panel-title">
            <div>
              <h2>Quick Actions</h2>
              <p>Jump into the most common placement workflows.</p>
            </div>
            <span className="chip chip-purple">Workspace</span>
          </div>
          <div className="quick-grid">
            {actions.map((action) => (
              <button className="action-card" key={action.to} onClick={() => navigate(action.to)} type="button">
                <span className="action-icon">{action.icon}</span>
                <span className="action-title">{action.title}</span>
                <span className="action-desc">{action.desc}</span>
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="panel-title">
            <div>
              <h2>Recent Insights</h2>
              <p>Signals from your latest preparation activity.</p>
            </div>
            <span className="chip chip-cyan">Live</span>
          </div>
          <Sparkline />
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div className="panel-title" style={{ marginBottom: 8 }}>
                <h2>Focus on Distributed Systems</h2>
                <span className="chip chip-purple">Interview</span>
              </div>
              <ProgressBar value={68} />
            </div>
            <div>
              <div className="panel-title" style={{ marginBottom: 8 }}>
                <h2>Resume keyword coverage</h2>
                <span className="chip chip-green">92%</span>
              </div>
              <ProgressBar value={92} tone="green" />
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="dashboard-grid">
        <GlassPanel>
          <div className="panel-title">
            <div>
              <h2>Placement Status</h2>
              <p>Preparation balance across core modules.</p>
            </div>
          </div>
          <MiniBars values={[54, 78, 66, 88]} labels={['Resume', 'Quiz', 'Match', 'Prep']} />
        </GlassPanel>

        <GlassPanel>
          <div className="panel-title">
            <div>
              <h2>Active Trend</h2>
              <p>Your local AI copilot is tuned for focused final answers.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <span className="chip chip-purple">Groq Llama 3.3 70B</span>
            <span className="chip chip-cyan">Top-5 RAG retrieval</span>
            <span className="chip chip-green">ChromaDB unchanged</span>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export default Dashboard;
