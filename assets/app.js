// Sleeping Outside the Box - Archive SPA
const state = {
  posts: [],
  pages: [],
  view: 'list', // 'list', 'post', 'page'
  currentSlug: null,
  searchQuery: '',
  activeCategory: null,
  sortAsc: false, // false = newest first
};

// Parse date strings into sortable format
const parseDate = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

// Strip HTML for excerpts
const stripHtml = (html) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

// Get excerpt from content
const getExcerpt = (content, maxLen = 200) => {
  const text = stripHtml(content);
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
};

// Get all unique categories
const getAllCategories = () => {
  const cats = new Set();
  state.posts.forEach(p => p.categories?.forEach(c => cats.add(c)));
  return [...cats].sort();
};

// Filter posts based on search and category
const getFilteredPosts = () => {
  let posts = [...state.posts];

  if (state.activeCategory) {
    posts = posts.filter(p => p.categories?.includes(state.activeCategory));
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    posts = posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      stripHtml(p.content).toLowerCase().includes(q) ||
      p.categories?.some(c => c.toLowerCase().includes(q)) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by date
  posts.sort((a, b) => {
    const da = parseDate(a.dateISO || a.date);
    const db = parseDate(b.dateISO || b.date);
    return state.sortAsc ? da - db : db - da;
  });

  return posts;
};

// Find post by slug
const findPost = (slug) => state.posts.find(p => p.slug === slug);
const findPage = (slug) => state.pages.find(p => p.slug === slug);

// Get adjacent posts for navigation
const getAdjacentPosts = (slug) => {
  const filtered = getFilteredPosts();
  const idx = filtered.findIndex(p => p.slug === slug);
  return {
    prev: idx > 0 ? filtered[idx - 1] : null,
    next: idx < filtered.length - 1 ? filtered[idx + 1] : null,
  };
};

// Format date for display
const formatDate = (dateStr, dateISO) => {
  const d = new Date(dateISO || dateStr);
  if (isNaN(d.getTime())) return dateStr || 'Unknown date';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// Router - handle hash-based navigation
const navigate = (path) => {
  window.location.hash = path;
};

const handleRoute = () => {
  const hash = window.location.hash.slice(1) || '/';

  if (hash === '/' || hash === '') {
    state.view = 'list';
    state.currentSlug = null;
  } else if (hash.startsWith('/page/')) {
    state.view = 'page';
    state.currentSlug = hash.replace('/page/', '');
  } else if (hash.startsWith('/post/')) {
    state.view = 'post';
    state.currentSlug = hash.replace('/post/', '');
  } else {
    state.view = 'list';
  }

  render();
};

// Render functions
const renderPostList = () => {
  const filtered = getFilteredPosts();
  const categories = getAllCategories();

  const categoryHtml = categories.length > 0
    ? `<div class="category-filter">
        <button onclick="setCategory(null)" class="${!state.activeCategory ? 'active' : ''}">All</button>
        ${categories.map(c =>
          `<button onclick="setCategory('${c.replace(/'/g, "\\'")}')" class="${state.activeCategory === c ? 'active' : ''}">${c}</button>`
        ).join('')}
      </div>`
    : '';

  const postsHtml = filtered.map(p => `
    <li class="post-list-item" onclick="navigate('/post/${p.slug}')">
      <h2>${p.title || p.slug}</h2>
      <div class="post-meta">
        <span>${formatDate(p.date, p.dateISO)}</span>
      </div>
      ${p.categories?.length ? `<div class="post-categories">${p.categories.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
      <p class="post-excerpt">${getExcerpt(p.content)}</p>
    </li>
  `).join('');

  return `
    <div class="search-bar">
      <input type="text" placeholder="Search ${state.posts.length} posts..." value="${state.searchQuery}" oninput="setSearch(this.value)" />
    </div>
    ${categoryHtml}
    <main>
      <div class="stats">${filtered.length} post${filtered.length !== 1 ? 's' : ''}${state.activeCategory ? ` in "${state.activeCategory}"` : ''}${state.searchQuery ? ` matching "${state.searchQuery}"` : ''}</div>
      <ul class="post-list fade-in">${postsHtml}</ul>
    </main>
  `;
};

const renderPost = () => {
  const post = findPost(state.currentSlug);
  if (!post) return '<main><p class="loading">Post not found.</p></main>';

  const { prev, next } = getAdjacentPosts(state.currentSlug);

  return `
    <main>
      <article class="post-single fade-in">
        <button class="back-btn" onclick="navigate('/')">← Back to all posts</button>
        <h1>${post.title || post.slug}</h1>
        <div class="post-meta">
          <span>${formatDate(post.date, post.dateISO)}</span>
        </div>
        ${post.categories?.length ? `<div class="post-categories" style="margin-bottom:1.5rem">${post.categories.map(c =>
          `<span onclick="setCategory('${c.replace(/'/g, "\\'")}'); navigate('/');" style="cursor:pointer">${c}</span>`
        ).join('')}</div>` : ''}
        <div class="post-content">${post.content}</div>
        <div class="post-nav">
          ${prev ? `<button onclick="navigate('/post/${prev.slug}')">← ${prev.title}</button>` : '<span></span>'}
          ${next ? `<button onclick="navigate('/post/${next.slug}')">${next.title} →</button>` : '<span></span>'}
        </div>
      </article>
    </main>
  `;
};

const renderPage = () => {
  const page = findPage(state.currentSlug);
  if (!page) return '<main><p class="loading">Page not found.</p></main>';

  return `
    <main>
      <div class="page-content fade-in">
        <button class="back-btn" onclick="navigate('/')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.9rem;padding:0.5rem 0;margin-bottom:1rem;display:inline-block;font-family:-apple-system,system-ui,sans-serif;">← Back</button>
        <h1>${page.title || page.slug}</h1>
        <div class="post-content">${page.content}</div>
      </div>
    </main>
  `;
};

const renderNav = () => {
  const pageButtons = state.pages.map(p =>
    `<button onclick="navigate('/page/${p.slug}')" class="${state.view === 'page' && state.currentSlug === p.slug ? 'active' : ''}">${p.title || p.slug}</button>`
  ).join('');

  return `
    <header class="site-header">
      <div class="header-inner">
        <div class="site-title" onclick="navigate('/')">Sleeping Outside the Box</div>
        <nav>
          <button onclick="navigate('/')" class="${state.view === 'list' ? 'active' : ''}">Posts</button>
          ${pageButtons}
        </nav>
      </div>
    </header>
  `;
};

const render = () => {
  const app = document.getElementById('app');
  let content;

  switch (state.view) {
    case 'post':
      content = renderPost();
      break;
    case 'page':
      content = renderPage();
      break;
    default:
      content = renderPostList();
  }

  app.innerHTML = `
    ${renderNav()}
    ${content}
    <footer class="site-footer">
      <p>Sleeping Outside the Box — An archive of the blog by Adam Eivy (antic)</p>
      <p>Originally published at sleep.shadowpuppet.net (2005–2013)</p>
    </footer>
  `;

  // Scroll to top on post/page view
  if (state.view !== 'list') {
    window.scrollTo(0, 0);
  }
};

// Global action handlers
window.navigate = navigate;

window.setSearch = (query) => {
  state.searchQuery = query;
  render();
};

window.setCategory = (cat) => {
  state.activeCategory = cat === state.activeCategory ? null : cat;
  render();
};

// Initialize
const init = async () => {
  const app = document.getElementById('app');
  app.innerHTML = '<p class="loading">Loading archive...</p>';

  const [postsRes, pagesRes] = await Promise.all([
    fetch('data/posts.json'),
    fetch('data/pages.json'),
  ]);

  state.posts = await postsRes.json();
  state.pages = await pagesRes.json();

  // Listen for route changes
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
};

init();
