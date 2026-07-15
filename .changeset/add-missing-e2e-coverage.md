---
"@renderly/a11y": patch
"@renderly/cli": patch
"@renderly/i18n": patch
"@renderly/pdf": patch
"@renderly/diff": patch
"@renderly/wizard": patch
"@renderly/web-components": patch
---

No runtime behavior change — internal test coverage only. Adds an e2e test suite to `a11y`, `cli`, `i18n`, `pdf`, `diff`, and `wizard`, each driving the real cross-package pipeline (`parseDocument` → `walk` → the package's own function, through to a real output adapter where applicable) instead of only hand-built fixture objects. `web-components`'s existing full-pipeline test suite is moved from `tests/unit/` to `tests/e2e/` to reflect what it already was, rather than duplicated.
