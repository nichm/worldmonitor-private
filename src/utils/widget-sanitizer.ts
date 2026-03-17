import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'strong', 'em', 'b', 'i', 'br', 'hr', 'small',
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan',
  ],
  ALLOWED_ATTR: [
    'class', 'style', 'title', 'aria-label',
    'viewBox', 'fill', 'stroke', 'stroke-width',
    'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'points',
    'xmlns',
  ],
  FORBID_TAGS: ['button', 'input', 'form', 'select', 'textarea', 'script', 'iframe', 'object', 'embed'],
  FORCE_BODY: true,
};

// NOTE: Inline styles remain enabled so generated widgets can adjust layout.
// Revisit this before widening widget capabilities further; panel-escape risks
// should be reviewed if we keep accepting arbitrary style properties.
const UNSAFE_STYLE_RE = /style\s*=\s*["'][^"']*(?:url\s*\(|expression\s*\(|javascript\s*:)[^"']*["']/gi;

export function sanitizeWidgetHtml(html: string): string {
  const purified = DOMPurify.sanitize(html, PURIFY_CONFIG) as unknown as string;
  return purified.replace(UNSAFE_STYLE_RE, '');
}

export function wrapWidgetHtml(html: string, extraClass = ''): string {
  const shellClass = ['wm-widget-shell', extraClass].filter(Boolean).join(' ');
  return `
    <div class="${shellClass}">
      <div class="wm-widget-body">
        <div class="wm-widget-generated">${sanitizeWidgetHtml(html)}</div>
      </div>
    </div>
  `;
}
