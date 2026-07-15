---
"@renderly/shared": minor
"@renderly/email": patch
"@renderly/markdown": patch
---

Add `sanitizeUrl` to `@renderly/shared`, enforcing an `http:`/`https:`/`mailto:`/`tel:` scheme allowlist. HTML/Markdown escaping protects against breaking out of an attribute or link-destination context, but it does nothing to stop a `javascript:` or `data:` scheme from being interpreted as executable once it lands in a live sink.

Wires this into the two adapters that render `submit.route` into a live link:
- `@renderly/email` — the submit button's `<a href>`.
- `@renderly/markdown` — the submit link's destination, which can carry the same payload once converted to HTML downstream.

A `submit` element with `route: "javascript:alert(document.cookie)"` now renders a safe `#` fallback in both adapters instead of a clickable `javascript:` link. `@renderly/html` and `@renderly/react` were already unaffected — they render `route` into an inert `data-route` attribute, not a URL sink.
