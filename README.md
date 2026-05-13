# Service Site

Standalone resume and case study site for Ben Rodriguez, focused on growth systems, audience ownership, and digital marketing execution.

## Live Site

- GitHub Pages: https://benrod3000.github.io/service/
- Classic archive: https://benrod3000.github.io/service/index-classic.html

## Project Structure

- `index.html` - Primary digital resume site (root entrypoint)
- `styles-digital.css` - Digital UI styling, responsive behavior, and animation system
- `index-classic.html` - Archived classic homepage layout
- `digital.html` - Compatibility redirect to root URL
- `styles.css` - Legacy classic page styling
- `script.js` - Legacy classic page interactions and version toggle behavior
- `images/` - Profile and visual assets

## Local Development

This is a static site. No build step is required.

### Option 1: Open directly

Open `index.html` in a browser.

### Option 2: Run a local server (recommended)

From the project folder:

```bash
python3 -m http.server 8080
```

Then visit:

- http://localhost:8080

## Deployment

This site deploys through GitHub Pages from the `main` branch.

### GitHub Pages settings

1. Open repository settings for Pages.
2. Set Source to **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`.
4. Save.

After pushing updates, GitHub Pages usually publishes in 1 to 3 minutes.

## Update Workflow

```bash
git add .
git commit -m "Your change summary"
git push origin main
```

## Notes

- Keep copy and metadata in `index.html` aligned.
- Keep `index-classic.html` as archive only content; avoid adding new features there.
- Keep animations performant by preferring `transform` and `opacity` transitions.

## Temporary Cache Busting

Temporary query string cache busting is currently enabled for local assets using:

- `styles-digital.css?v=20260512-2`

This was added to reduce stale GitHub Pages browser cache issues after rapid updates.

When to remove it:

1. After the UI is stable and no longer changing frequently.
2. After confirming users consistently see fresh updates without hard refresh.

How to remove it:

1. Remove query string versions from local asset URLs in `index.html` once cache behavior is stable.
2. Commit and push one cleanup commit.
