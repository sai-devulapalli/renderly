---
"@renderly/snapshot": minor
---

`freezeSnapshot` now correctly handles `input-file`, `signature`, and `repeat` nodes: file inputs and signatures freeze to a text summary the same way other input types already did, and `repeat` nodes freeze each item with its values correctly scoped (mirroring the walker's own `extractItemValues` prefix-stripping), producing a per-item label and frozen children instead of leaving these three node types unhandled.
