import { NavLink } from 'react-router-dom';

const MODEL_PROVIDER = import.meta.env.VITE_LLM_PROVIDER || 'groq';

const navItems = [
  { icon: 'D', label: 'Dashboard', to: '/', end: true },
  { icon: 'N', label: 'Chat with Notes', to: '/chat' },
  { icon: 'R', label: 'Resume Analyzer', to: '/resume' },
  { icon: 'J', label: 'Job Match', to: '/job-match' },
  { icon: 'Q', label: 'Quiz Generator', to: '/quiz-generator' },
  { icon: 'I', label: 'Interview Prep', to: '/interview' },
  { icon: 'S', label: 'Study Planner', to: '/study-plan' },
];

function Sidebar() {
  const isGroq = MODEL_PROVIDER.toLowerCase() === 'groq';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">AI</div>
        <div>
          <div className="logo-title">AI Copilot</div>
          <div className="logo-sub">Learning & Placement</div>
        </div>
      </div>

      <div className="sidebar-model-card">
        <span className={`model-status-dot${isGroq ? ' online' : ' local'}`} />
        <div>
          <div className="model-card-label">{isGroq ? 'Connected Model' : 'Local AI'}</div>
          <div className="model-card-name">{isGroq ? 'Groq Llama 3.3 70B' : 'qwen3:8b via Ollama'}</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer" />
    </aside>
  );
}

export default Sidebar;
