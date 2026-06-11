function GlassPanel({ as: Component = 'section', children, className = '', ...props }) {
  return (
    <Component className={`glass-panel${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Component>
  );
}

export default GlassPanel;
