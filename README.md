# brod3000.com

Source code for my personal website and digital resume.

I built this site from scratch using plain HTML, CSS, and JavaScript. No frameworks, page builders, or build tools. Just a fast, lightweight website that showcases my work, experience, and approach to digital marketing.

## Live Site

https://brod3000.com

## Tech Stack

- HTML5
- CSS3
- JavaScript

## Project Structure

```
brod3000.com/
├── index.html
├── 404.html
├── README.md
├── CNAME
├── favicon.svg
├── styles-digital.css
├── digital-runtime.js
├── gtag-init.js
├── robots.txt
├── sitemap.xml
├── .gitignore
└── images/
    ├── background.webp
    ├── background.png
    ├── ben-portrait.svg
    ├── profile.jpg
    └── ben_rodriguez_resume_2026.pdf
```

## Running Locally

Since this is a static website, there's nothing to install.

Open `index.html` in your browser, or start a simple local server:

```bash
python3 -m http.server 8080
```

Then visit:

```
http://localhost:8080
```

## Deployment

The site is hosted with GitHub Pages and automatically deploys from the `main` branch whenever I push changes.

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

## Search Engines

The site includes:

- `robots.txt`
- `sitemap.xml`
- Open Graph metadata
- Twitter/X cards
- Canonical URLs

## Images

Most images live in the `/images` folder.

Whenever possible I try to keep assets lightweight so the site loads quickly.

## Goals

A few things I keep in mind while working on this site:

- Keep it fast.
- Keep it simple.
- Write clean, maintainable code.
- Avoid unnecessary dependencies.
- Make the experience work well on both desktop and mobile.

## Future Improvements

Some things I'd still like to add:

- Additional case studies
- More project write-ups
- Continued accessibility improvements

---

Built and maintained by Ben Rodriguez.
