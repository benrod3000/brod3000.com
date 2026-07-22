# Security headers

The site is served by GitHub Pages, which cannot set custom response headers.
Cloudflare proxies the domain, so the headers are added there with a
**Transform Rule → Modify Response Header**.

Cloudflare dashboard → **brod3000.com** → Rules → Transform Rules →
Modify Response Header → Create rule. Apply to *All incoming requests*, then
add each header below as a **Set static** entry.

| Header | Value |
| --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |
| `Content-Security-Policy` | see below |

## Content-Security-Policy

Every origin the site actually loads from is enumerated below. `'unsafe-inline'`
is required for scripts because `index.html` carries inline blocks (FOUC
prevention, the site-content JSON island, the rotator bootstrap) and because
Cloudflare Rocket Loader and the email-obfuscation worker inject their own
inline scripts.

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdnjs.cloudflare.com https://static.cloudflareinsights.com https://ajax.cloudflare.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com;
connect-src 'self' https://formspree.io https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com;
form-action https://formspree.io;
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests
```

Paste it as a single line (no newlines) into the Transform Rule value.

## Roll it out in report-only first

CSP is the one header here that can break a working page. Ship it as
`Content-Security-Policy-Report-Only` first, load every section
(`#about`, `#resume`, `#concepts`, `#contact`), submit the contact form, and
confirm the browser console logs no violations. Then rename the header to
`Content-Security-Policy`.

`frame-ancestors`, `Strict-Transport-Security`, and `X-Content-Type-Options` are
ignored when delivered via `<meta>`, which is why they must live here rather
than in `index.html`.

## Verify

```bash
curl -sI https://brod3000.com/ | grep -iE 'strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy'
```
