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
│   ├── styles.css      # Blog styling
│   └── app.js          # SPA navigation logic
├── images/             # Downloaded post images
├── data/
│   ├── posts.json      # All 230 posts with content
│   └── pages.json      # Static pages (About, etc.)
├── scripts/
│   └── scrape.mjs      # Node.js scraper (Playwright)
├── PLAN.md
└── README.md
```

### Scraping Strategy
1. **Use Playwright** to render each page (handles dynamic content, JS-rendered elements)
2. **Extract** from each post: title, date, author, categories, tags, HTML content, images
3. **Download all images** to `images/` directory, rewrite URLs in content
4. **Save** structured JSON data for the SPA to consume

### SPA Features
- Clean, modern dark theme matching the blog's aesthetic
- Browse all posts chronologically or by category
- Search/filter posts by title or content
- Individual post view with full content and images
- About page preserved
- Responsive design
- No external dependencies (fully self-contained, works offline)

## Steps
1. Create the GitHub repo structure
2. Build Playwright scraper (`scripts/scrape.mjs`)
3. Run scraper to collect all content and images
4. Build the SPA (index.html + CSS + JS)
5. Test locally
6. Commit and push to GitHub
