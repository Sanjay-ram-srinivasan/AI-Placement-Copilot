function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function GlassCard({ children, className = '', padding = true, ...props }) {
  return (
    <section className={`glass-card${padding ? ' card-pad' : ''}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </section>
  );
}

function MetricCard({ label, value, sub, tone = 'purple', icon }) {
  return (
    <GlassCard className="metric-card">
      <div className={`metric-icon tone-${tone}`}>{icon}</div>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {sub && <div className="metric-sub">{sub}</div>}
      </div>
    </GlassCard>
  );
}

function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: lines }).map((_, index) => (
        <span key={index} className="skeleton-line" style={{ width: `${92 - index * 14}%` }} />
      ))}
    </div>
  );
}

function ProgressBar({ value = 0, tone = 'purple' }) {
  const width = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress-track">
      <span className={`progress-fill tone-${tone}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function MiniBars({ values = [38, 72, 51, 86], labels = [] }) {
  return (
    <div className="mini-bars">
      {values.map((value, index) => (
        <div className="mini-bar-col" key={`${value}-${index}`}>
          <span style={{ height: `${value}%` }} />
          {labels[index] && <small>{labels[index]}</small>}
        </div>
      ))}
    </div>
  );
}

function Sparkline() {
  return (
    <svg className="sparkline" viewBox="0 0 220 90" role="img" aria-label="activity trend">
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(110, 231, 255, 0.35)" />
          <stop offset="48%" stopColor="rgba(192, 132, 252, 0.24)" />
          <stop offset="100%" stopColor="rgba(125, 92, 255, 0)" />
        </linearGradient>
        <linearGradient id="sparkStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <path className="sparkline-fill" d="M4 72 C 24 64, 34 42, 54 48 C 77 55, 77 74, 100 56 C 122 39, 126 16, 151 24 C 174 31, 178 62, 214 20 L 214 90 L 4 90 Z" fill="url(#sparkFill)" />
      <path className="sparkline-line" d="M4 72 C 24 64, 34 42, 54 48 C 77 55, 77 74, 100 56 C 122 39, 126 16, 151 24 C 174 31, 178 62, 214 20" fill="none" stroke="url(#sparkStroke)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export { GlassCard, MetricCard, MiniBars, PageHeader, ProgressBar, Skeleton, Sparkline };
