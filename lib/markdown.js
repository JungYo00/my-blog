const { escapeHtml } = require('./utils');

function renderInline(text) {
  let html = escapeHtml(text);

  const codeStash = [];
  html = html.replace(/`([^`]+)`/g, (m, code) => {
    codeStash.push(code);
    return `\x00CODE${codeStash.length - 1}\x00`;
  });

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (m, a, b) => `<strong>${a || b}</strong>`);
  html = html.replace(/\*([^*]+)\*|_([^_]+)_/g, (m, a, b) => `<em>${a || b}</em>`);

  html = html.replace(/\x00CODE(\d+)\x00/g, (m, i) => `<code>${codeStash[Number(i)]}</code>`);

  return html;
}

function renderBlocks(lines) {
  const out = [];
  let pos = 0;

  while (pos < lines.length) {
    const line = lines[pos];

    if (!line.trim()) {
      pos++;
      continue;
    }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const codeLines = [];
      pos++;
      while (pos < lines.length && !/^```\s*$/.test(lines[pos])) {
        codeLines.push(lines[pos]);
        pos++;
      }
      pos++;
      const cls = lang ? ` class="language-${lang}"` : '';
      out.push(`<pre><code${cls}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      pos++;
      continue;
    }

    if (/^(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>');
      pos++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (pos < lines.length && /^>\s?/.test(lines[pos])) {
        quoteLines.push(lines[pos].replace(/^>\s?/, ''));
        pos++;
      }
      out.push(`<blockquote><p>${renderInline(quoteLines.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (pos < lines.length && /^\s*[-*+]\s+/.test(lines[pos])) {
        items.push(`<li>${renderInline(lines[pos].replace(/^\s*[-*+]\s+/, ''))}</li>`);
        pos++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (pos < lines.length && /^\s*\d+\.\s+/.test(lines[pos])) {
        items.push(`<li>${renderInline(lines[pos].replace(/^\s*\d+\.\s+/, ''))}</li>`);
        pos++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    const paraLines = [];
    while (pos < lines.length && lines[pos].trim() && !isBlockStart(lines[pos])) {
      paraLines.push(lines[pos]);
      pos++;
    }
    out.push(`<p>${renderInline(paraLines.join(' '))}</p>`);
  }

  return out.join('\n');
}

function isBlockStart(line) {
  return (
    /^```/.test(line) ||
    /^#{1,6}\s+/.test(line) ||
    /^(\*\s*\*\s*\*|-{3,}|_{3,})\s*$/.test(line) ||
    /^>\s?/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line)
  );
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  return renderBlocks(lines);
}

module.exports = { renderMarkdown };
