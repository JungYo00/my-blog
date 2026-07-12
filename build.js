const fs = require('fs');
const path = require('path');

const { parseFrontMatter } = require('./lib/frontmatter');
const { renderMarkdown } = require('./lib/markdown');
const { render } = require('./lib/template');
const { escapeHtml, slugify, formatDate } = require('./lib/utils');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'posts');
const DIST_DIR = path.join(ROOT, 'dist');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const CSS_SRC = path.join(ROOT, 'css');
const JS_SRC = path.join(ROOT, 'js');
const GAMES_SRC = path.join(ROOT, 'games', '2048');
const PIXEL_ART_SRC = path.join(ROOT, 'pixel-art');

function renderTagsHtml(tags) {
  if (!tags || !tags.length) return '';
  return `<ul class="tag-list">${tags.map((t) => `<li class="tag">${escapeHtml(t)}</li>`).join('')}</ul>`;
}

function buildPage({ contentTemplate, layoutTemplate, vars, base, title }) {
  const content = render(contentTemplate, { ...vars, BASE: base });
  return render(layoutTemplate, {
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(vars.DESCRIPTION || ''),
    BASE: base,
    CONTENT: content,
  });
}

function main() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, 'posts'), { recursive: true });

  const layoutTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'layout.html'), 'utf8');
  const postTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf8');
  const indexTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'index.html'), 'utf8');

  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const posts = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const { data, content } = parseFrontMatter(raw);

      const title = data.title || slugify(file);
      const dateObj = data.date ? new Date(data.date) : new Date(0);
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const slug = data.slug || slugify(file);
      const bodyHtml = renderMarkdown(content);

      const html = buildPage({
        contentTemplate: postTemplate,
        layoutTemplate,
        base: '../',
        title,
        vars: {
          TITLE: escapeHtml(title),
          DATE_ISO: formatDate(dateObj),
          DATE_DISPLAY: formatDate(dateObj) || '날짜 없음',
          TAGS_HTML: renderTagsHtml(tags),
          BODY: bodyHtml,
          DESCRIPTION: data.description || '',
        },
      });

      fs.writeFileSync(path.join(DIST_DIR, 'posts', `${slug}.html`), html);

      posts.push({ slug, title, dateObj, dateDisplay: formatDate(dateObj), tags });
    } catch (err) {
      throw new Error(`포스트 처리 실패: ${file}\n${err.message}`);
    }
  }

  posts.sort((a, b) => b.dateObj - a.dateObj);

  const postListHtml = posts
    .map(
      (p) => `<article class="post-list-item" data-tags="${escapeHtml(p.tags.join(','))}" data-date="${p.dateDisplay}">
  <a href="posts/${p.slug}.html" class="post-list-title">${escapeHtml(p.title)}</a>
  <div class="post-list-meta">
    <time datetime="${p.dateDisplay}">${p.dateDisplay || '날짜 없음'}</time>
    ${renderTagsHtml(p.tags)}
  </div>
</article>`
    )
    .join('\n');

  const indexHtml = buildPage({
    contentTemplate: indexTemplate,
    layoutTemplate,
    base: '',
    title: 'My Blog',
    vars: { POST_LIST: postListHtml, DESCRIPTION: '마크다운으로 쓴 블로그' },
  });

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

  fs.cpSync(CSS_SRC, path.join(DIST_DIR, 'css'), { recursive: true });
  fs.cpSync(JS_SRC, path.join(DIST_DIR, 'js'), { recursive: true });

  if (fs.existsSync(GAMES_SRC)) {
    fs.cpSync(GAMES_SRC, path.join(DIST_DIR, '2048'), { recursive: true });
  }

  if (fs.existsSync(PIXEL_ART_SRC)) {
    fs.cpSync(PIXEL_ART_SRC, path.join(DIST_DIR, 'pixel-art'), { recursive: true });
  }

  console.log(`${posts.length}개 포스트 빌드 완료, 출력: dist/`);
}

try {
  main();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
