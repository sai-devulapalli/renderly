---
"@renderly/html": minor
"@renderly/react": minor
"@renderly/markdown": minor
"@renderly/email": minor
"@renderly/pdf": minor
---

Export `renderRepeat`, `renderInputFile`, `renderSignature`, and `renderCustom` from each adapter's public entry point. Every adapter's `src/index.ts` re-exported only 10 of its 14 renderer functions, silently omitting these four — there was no public way to fall back to the built-in `custom`-node placeholder (`renderCustom`) when overriding that registry entry to handle your own `kind` values, which is the documented no-fork extension path for adding a field type.
