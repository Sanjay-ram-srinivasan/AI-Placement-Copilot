import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders an AI markdown response as styled HTML.
 * Handles headers, bold, lists, code, horizontal rules.
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  // Detect quota/error messages (start with ⚠️) and show as banner
  if (content.startsWith('⚠️') || content.startsWith('[Quota') || content.startsWith('[API')) {
    return (
      <div className="banner banner-warn">
        <span>⚠️</span>
        <span>{content.replace(/^⚠️\s*\*?\*?/, '')}</span>
      </div>
    );
  }

  return (
    <div className="md-content fade-in">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
