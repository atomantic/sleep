import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import https from 'https';
import http from 'http';

const BASE_URL = 'https://sleep.shadowpuppet.net';
const API_URL = `${BASE_URL}/wp-json/wp/v2`;
const DATA_DIR = join(import.meta.dirname, '..', 'data');
const IMAGES_DIR = join(import.meta.dirname, '..', 'images');

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 BlogArchiver/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchJSON(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        const total = res.headers['x-wp-total'];
        const totalPages = res.headers['x-wp-totalpages'];
        resolve({ data: JSON.parse(body), total: parseInt(total) || 0, totalPages: parseInt(totalPages) || 0 });
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Download file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 BlogArchiver/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        writeFile(destPath, Buffer.concat(chunks)).then(resolve).catch(reject);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Image mapping
const imageMap = new Map();
let imageCounter = 0;

function getLocalImagePath(url) {
  // Normalize URL (remove query params, ensure consistent form)
  const cleanUrl = url.split('?')[0];
  if (imageMap.has(cleanUrl)) return imageMap.get(cleanUrl);
  const ext = extname(new URL(cleanUrl).pathname) || '.jpg';
  const name = `img-${++imageCounter}${ext}`;
  imageMap.set(cleanUrl, name);
  return name;
}

// Rewrite image URLs in HTML content
function rewriteImageUrls(html) {
  if (!html) return html;
  return html.replace(
    /(src|href)=["'](https?:\/\/sleep\.shadowpuppet\.net\/wp-content\/uploads\/[^"']+)["']/g,
    (match, attr, url) => {
      const localName = getLocalImagePath(url.split('?')[0]);
      return `${attr}="images/${localName}"`;
    }
  );
}

// Fetch all posts using WP REST API with pagination
async function fetchAllPosts() {
  const allPosts = [];
  let page = 1;

  // First request to get total
  const first = await fetchJSON(`${API_URL}/posts?per_page=100&page=1&_embed`);
  allPosts.push(...first.data);
  const totalPages = first.totalPages;
  const total = first.total;

  console.log(`📊 Total posts: ${total}, pages: ${totalPages}`);

  for (page = 2; page <= totalPages; page++) {
    console.log(`📄 Fetching posts page ${page}/${totalPages}...`);
    const res = await fetchJSON(`${API_URL}/posts?per_page=100&page=${page}&_embed`);
    allPosts.push(...res.data);
    await new Promise(r => setTimeout(r, 300));
  }

  return allPosts;
}

// Fetch all pages using WP REST API
async function fetchAllPages() {
  const res = await fetchJSON(`${API_URL}/pages?per_page=100&_embed`);
  return res.data;
}

// Fetch categories map
async function fetchCategories() {
  const catMap = {};
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetchJSON(`${API_URL}/categories?per_page=100&page=${page}`);
    for (const cat of res.data) {
      catMap[cat.id] = cat.name;
    }
    hasMore = page < res.totalPages;
    page++;
  }

  return catMap;
}

// Fetch tags map
async function fetchTags() {
  const tagMap = {};
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetchJSON(`${API_URL}/tags?per_page=100&page=${page}`);
    for (const tag of res.data) {
      tagMap[tag.id] = tag.name;
    }
    hasMore = page < res.totalPages;
    page++;
  }

  return tagMap;
}

// Extract image URLs from HTML content
function extractImageUrls(html) {
  if (!html) return [];
  const urls = [];
  const regex = /https?:\/\/sleep\.shadowpuppet\.net\/wp-content\/uploads\/[^"'\s)]+/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    urls.push(match[0].split('?')[0]);
  }
  return urls;
}

// Download all images
async function downloadImages(allImageUrls) {
  console.log(`🖼️  Found ${allImageUrls.size} unique images to download`);

  let downloaded = 0;
  let failed = 0;
  const total = allImageUrls.size;

  for (const url of allImageUrls) {
    const localName = getLocalImagePath(url);
    const destPath = join(IMAGES_DIR, localName);

    if (existsSync(destPath)) {
      downloaded++;
      continue;
    }

    const secureUrl = url.replace(/^http:/, 'https:');
    const count = downloaded + failed + 1;

    if (count % 10 === 0 || count === 1) {
      console.log(`⬇️  [${count}/${total}] Downloading images...`);
    }

    await downloadFile(secureUrl, destPath).catch(err => {
      console.log(`⚠️  Failed: ${url} - ${err.message}`);
      failed++;
    });
    downloaded++;

    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`✅ Downloaded ${downloaded} images, ${failed} failed`);
}

async function main() {
  console.log('🚀 Starting blog archive scraper (WP REST API)...');

  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(IMAGES_DIR, { recursive: true });

  // Fetch taxonomy maps
  console.log('\n📂 Fetching categories and tags...');
  const [catMap, tagMap] = await Promise.all([fetchCategories(), fetchTags()]);
  console.log(`   ${Object.keys(catMap).length} categories, ${Object.keys(tagMap).length} tags`);

  // Fetch all posts
  console.log('\n📚 Fetching all posts...');
  const rawPosts = await fetchAllPosts();
  console.log(`   Fetched ${rawPosts.length} posts`);

  // Fetch all pages
  console.log('\n📃 Fetching all pages...');
  const rawPages = await fetchAllPages();
  console.log(`   Fetched ${rawPages.length} pages`);

  // Transform posts
  const posts = rawPosts.map(p => ({
    slug: p.slug,
    title: p.title?.rendered || '',
    content: p.content?.rendered || '',
    excerpt: p.excerpt?.rendered || '',
    date: p.date || '',
    dateISO: p.date || '',
    categories: (p.categories || []).map(id => catMap[id]).filter(Boolean),
    tags: (p.tags || []).map(id => tagMap[id]).filter(Boolean),
    url: p.link || `${BASE_URL}/${p.slug}/`,
  }));

  // Transform pages
  const pages = rawPages.map(p => ({
    slug: p.slug,
    title: p.title?.rendered || '',
    content: p.content?.rendered || '',
    url: p.link || `${BASE_URL}/${p.slug}/`,
  }));

  // Collect all image URLs
  console.log('\n🖼️  Collecting image URLs...');
  const allImageUrls = new Set();
  for (const post of posts) {
    extractImageUrls(post.content).forEach(url => allImageUrls.add(url));
  }
  for (const pg of pages) {
    extractImageUrls(pg.content).forEach(url => allImageUrls.add(url));
  }

  // Download images
  console.log('\n⬇️  Downloading images...');
  await downloadImages(allImageUrls);

  // Rewrite image URLs in content
  console.log('\n🔗 Rewriting image URLs...');
  for (const post of posts) {
    post.content = rewriteImageUrls(post.content);
  }
  for (const pg of pages) {
    pg.content = rewriteImageUrls(pg.content);
  }

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));

  // Save data
  console.log('\n💾 Saving data...');
  await writeFile(join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
  await writeFile(join(DATA_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
  await writeFile(join(DATA_DIR, 'image-map.json'), JSON.stringify(Object.fromEntries(imageMap), null, 2));

  console.log(`\n✅ Archive complete!`);
  console.log(`   📄 ${posts.length} posts`);
  console.log(`   📃 ${pages.length} pages`);
  console.log(`   🖼️  ${imageMap.size} images`);
}

main();
