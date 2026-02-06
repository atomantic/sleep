# Sleep Blog Archive Plan

## Goal
Archive the WordPress blog at `https://sleep.shadowpuppet.net/` ("Sleeping Outside the Box" by Adam Eivy) as a self-contained single-page application (SPA) hosted from a GitHub repository.

## Blog Stats
- **230 posts** (2005-2013, covering polyphasic sleep, dreams, doodles, travel, comics, TED talks)
- **5 pages** (Home, About, Research Paper, About Adam, Daily Drawings)
- **21 categories** (sleep, writing, drawing, travel, TED, etc.)
- **WordPress 6.0.11** on custom theme

## Architecture

### Single-Page App Structure
```
sleep/
├── index.html          # Main SPA entry point
├── assets/
│   ├── styles.css      # Blog styling (dark theme)
│   └── app.js          # SPA navigation logic (hash routing)
├── images/             # 202 downloaded post/page images
├── data/
│   ├── posts.json      # All 230 posts with content
│   ├── pages.json      # Static pages (About, Thesis, etc.)
│   └── image-map.json  # URL-to-local-filename mapping
├── scripts/
│   └── scrape.mjs      # Node.js scraper (WP REST API)
├── PLAN.md
└── README.md
```

### Scraping Strategy
1. **Used WP REST API** (`/wp-json/wp/v2/`) to fetch all posts, pages, categories, and tags
2. **Extracted** from each post: title, date, categories, tags, HTML content, images
3. **Downloaded 202 images** from wp-content/uploads, Flickr, Amazon, portfolio sites, and relative paths
4. **Rewrote image URLs** in content to point to local `images/` directory
5. **Cleaned dead references** to defunct domains (gallery.shadowpuppet.net, communalgraffiti.com, etc.)

### SPA Features
- Clean, modern dark theme
- Browse all 230 posts chronologically
- Filter by 21 categories
- Search posts by title or content
- Individual post view with full content, images, and prev/next navigation
- 5 static pages preserved (Daily Drawings, About Adam, Polyphasic Paper, Polyphasic Thesis)
- Hash-based routing for bookmarkable URLs
- Responsive design (mobile-friendly)
- No external dependencies (fully self-contained, works offline)

## Steps
1. [x] Create the GitHub repo structure
2. [x] Build WP REST API scraper (`scripts/scrape.mjs`)
3. [x] Run scraper to collect all content and images (124 from wp-content/uploads)
4. [x] Download additional images from external sources (72 from Flickr, Amazon, etc.)
5. [x] Download relative-path images (/media/, /wp-content/)
6. [x] Clean dead image references from defunct domains
7. [x] Build the SPA (index.html + CSS + JS)
8. [x] Test locally - 0 console errors, all navigation working
9. [ ] Commit and push to GitHub
