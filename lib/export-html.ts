
import { Document, OutlineNode, ImageAttachment } from '@/types';

/**
 * Generate a standalone HTML string from the document
 */
export function generateHTML(doc: Document): string {
  const { title, root } = doc;
  
  const styles = `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1.doc-title {
      font-size: 2.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid #eee;
      padding-bottom: 1rem;
    }
    .node {
      margin-top: 0.5rem;
      position: relative;
    }
    .node-content {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .bullet {
      width: 8px;
      height: 8px;
      background-color: #cbd5e1; /* slate-300 */
      border-radius: 50%;
      margin-top: 0.6rem;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    /* Collapsible logic */
    .has-children > .node-content > .bullet {
      cursor: pointer;
      position: relative;
      background-color: #5468ff; /* primary */
    }
    .has-children > .node-content > .bullet:hover {
      transform: scale(1.25);
    }
    .node.collapsed > .children {
      display: none;
    }
    .node.collapsed > .node-content > .bullet {
      background-color: transparent;
      border: 2px solid #5468ff; /* primary */
      box-sizing: border-box;
    }
    
    .content-text {
      flex: 1;
      word-break: break-word;
    }
    .children {
      margin-left: 1.5rem;
      border-left: 1px solid #eee;
      padding-left: 1rem;
    }
    .text-header {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    .text-subheader {
      font-size: 1.25rem;
      font-weight: bold;
      margin-top: 0.8rem;
      margin-bottom: 0.4rem;
    }
    .text-italic {
      font-style: italic;
      color: #666;
    }
    .images-container {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 0.5rem;
      margin-left: 1rem;
    }
    .node-image {
      max-width: 100%;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .tags {
      display: inline-flex;
      gap: 0.25rem;
      margin-left: 0.5rem;
    }
    .tag {
      background-color: #f0f0f0;
      padding: 0 0.4rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #666;
    }
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1a1a1a;
        color: #e0e0e0;
      }
      h1.doc-title {
        border-bottom-color: #333;
      }
      .bullet {
        background-color: #475569; /* slate-600 */
      }
      .has-children > .node-content > .bullet {
        background-color: #5468ff;
      }
      .node.collapsed > .node-content > .bullet {
        background-color: transparent;
        border-color: #5468ff;
      }
      .children {
        border-left-color: #333;
      }
      .text-italic {
        color: #aaa;
      }
      .tag {
        background-color: #333;
        color: #aaa;
      }
    }
  `;

  const renderImages = (images: ImageAttachment[]) => {
    if (!images || images.length === 0) return '';
    return `
      <div class="images-container">
        ${images.map(img => `
          <img src="${img.url}" alt="${img.alt || ''}" class="node-image" style="max-height: 300px;" />
        `).join('')}
      </div>
    `;
  };

  const formatText = (text: string) => {
    // Basic formatting: **bold**, *italic*, __underline__, ==highlight==
    const formatted = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>');
    return formatted;
  };

  const renderNode = (node: OutlineNode): string => {
    const hasChildren = node.children && node.children.length > 0;
    const collapsedClass = node.collapsed ? 'collapsed' : '';
    const hasChildrenClass = hasChildren ? 'has-children' : '';
    const nodeClass = `node ${hasChildrenClass} ${collapsedClass}`.trim();
    
    let contentClass = 'content-text';
    if (node.isHeader) contentClass += ' text-header';
    else if (node.isSubHeader) contentClass += ' text-subheader';
    
    if (node.isItalic) contentClass += ' text-italic';

    const tagsHtml = node.tags?.map(tag => `<span class="tag">#${tag}</span>`).join('') || '';
    const iconHtml = node.icon ? `<span class="icon">${node.icon}</span> ` : '';

    return `
      <div class="${nodeClass}">
        <div class="node-content">
          <div class="bullet" title="点击展开/折叠"></div>
          <div class="${contentClass}">
            ${iconHtml}${formatText(node.content)}
            ${tagsHtml}
          </div>
        </div>
        ${renderImages(node.images)}
        ${hasChildren ? `
          <div class="children">
            ${node.children.map(child => renderNode(child)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  };

  // Apply default collapse state: First node expanded, others collapsed
  // Removed to respect the current editor state and avoid side effects
  // The exported HTML will match the current expanded/collapsed state of the document

  const contentHtml = root.children.map(child => renderNode(child)).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <h1 class="doc-title">${title}</h1>
  <div class="outline-container">
    ${contentHtml}
  </div>
  <script>
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('bullet')) {
        const node = e.target.closest('.node');
        if (node && node.classList.contains('has-children')) {
          node.classList.toggle('collapsed');
        }
      }
    });
  </script>
</body>
</html>
  `.trim();
}
