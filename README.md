# Sleeping Outside the Box — Blog Archive

A self-contained single-page app archive of the WordPress blog at [sleep.shadowpuppet.net](https://sleep.shadowpuppet.net/) by Adam Eivy (antic).

## Contents

- **230 blog posts** (2005–2013) covering polyphasic sleep experiments, dreams, doodles, daily drawings, travel, comics, TED talks, and more
- **4 static pages** (About Adam, Daily Drawings, Research Paper, Polyphasic Thesis)
- **124 locally archived images**
- **22 categories**, **215 tags**

## Viewing

Open `index.html` in a browser, or serve locally:

```bash
npx serve .
```

## Features

- Browse all posts chronologically (newest first)
- Filter by category
- Full-text search across all posts
- Individual post views with prev/next navigation
- Static page views
- Dark theme, responsive design
- Fully self-contained — works offline with no external dependencies

## Re-scraping

To re-scrape the blog from the WordPress REST API:

```bash
npm install
node scripts/scrape.mjs
```

This fetches all posts, pages, categories, tags, and images from the WP REST API and saves them locally.

## Structure

```
├── index.html          # SPA entry point
├── assets/
│   ├── styles.css      # Dark theme styling
│   └── app.js          # SPA routing and rendering
├── data/
│   ├── posts.json      # All 230 posts with HTML content
│   ├── pages.json      # Static pages
│   └── image-map.json  # URL → local filename mapping
├── images/             # 124 downloaded post images
├── scripts/
│   └── scrape.mjs      # WP REST API scraper
└── PLAN.md             # Archive planning document
```
