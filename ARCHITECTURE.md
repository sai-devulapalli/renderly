# Renderly — Architecture

## Hexagonal Overview

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                            RENDERLY LIBRARY BOUNDARY                            ║
║                                                                                  ║
║   DRIVING SIDE                                      DRIVEN SIDE                  ║
║   (input adapters)                                  (output adapters)            ║
║                                                                                  ║
║  ┌─────────────────┐   ┌────────────────────────────────────┐                   ║
║  │   JSON Input    │   │         ┌──────────────┐           │  ┌──────────────┐ ║
║  │  (raw string /  │   │         │   HEXAGON    │           │  │ HTML Adapter │ ║
║  │   parsed obj)   │   │         │   (core)     │           │  │              │ ║
║  └────────┬────────┘   │         │              │           │  │ IRNode tree  │ ║
║           │            │  ┌──────┤  Registry    ├──────┐   │  │     ↓        │ ║
║           ▼            │  │      │  Walker      │      │   │  │  HTML string │ ║
║  ┌─────────────────┐   │  │      │  IR builder  │      │   │  └──────────────┘ ║
║  │  Input Adapter  │   │  │      │              │      │   │                   ║
║  │                 │   │  │      └──────────────┘      │   │  ┌──────────────┐ ║
║  │  • parse JSON   │   │  │                             │   │  │ React Adapter│ ║
║  │  • validate     ├───┼──┘                             └───┼──┤              │ ║
║  │  • → Document   │   │                                    │  │ IRNode tree  │ ║
║  └─────────────────┘   │   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │  │     ↓        │ ║
║                        │      INPUT PORT                    │  │ React nodes  │ ║
║                        │   │  type: (raw) → Document   │   │  └──────────────┘ ║
║                        │    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │                   ║
║                        │                                    │                   ║
║                        │   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │                   ║
║                        │      OUTPUT PORT                   │                   ║
║                        │   │  type: IRNode tree        │   │                   ║
║                        │    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │                   ║
║                        └────────────────────────────────────┘                   ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Pipeline (data flow)

```
  Raw JSON string / object
         │
         ▼
 ┌───────────────────┐
 │   Input Adapter   │  @renderly/input
 │                   │  • parses JSON
 │                   │  • validates against JSON Schema   ── fails: InputError
 │                   │  • returns typed Document
 └────────┬──────────┘
          │ Document (validated, trusted)
          ▼
 ┌───────────────────┐
 │   Domain Core     │  @renderly/core
 │                   │  • looks up each element.type in Registry
 │   Registry        │  • calls the registered walker fn
 │   Walker          │  • builds the IRNode tree (Responsive<T> passed through as-is)
 │   IR builder      │  • core never touches raw JSON again
 └────────┬──────────┘
          │ IRNode[]  (output port contract)
          ▼
  ┌──────────┴───────────┐
  │                      │
  ▼                      ▼
┌────────────┐     ┌────────────┐
│    HTML    │     │   React    │   @renderly/html  @renderly/react
│  Adapter   │     │  Adapter   │
│            │     │            │   • escape all user text (HTML: escapeHtml; React: JSX)
│ HTML string│     │React nodes │   • emit data-* attrs for responsive props
└────────────┘     └────────────┘   • import renderly.css for responsive layout rules
```

---

## Submit Round-Trip

```
  Host App
     │
     │  1. fetch form definition
     │ ◄────────────────────────── source-of-truth service (outside Renderly)
     │
     │  2. render
     │         parseDocument()  →  walk()  →  renderDocument()
     │ ◄──────────────────────────  rendered form
     │
     │  3. user fills + submits
     │         extractFields()  →  buildPayload()
     │
     │  4a. client validation fails
     │         buildPayload() returns PayloadError
     │         applyErrors(doc, errors)  →  re-walk  →  re-render
     │
     │  4b. POST payload to submit.route
     │ ──────────────────────────► source-of-truth service
     │
     │  5. error response  { form?: string[], fields?: Record<string, string[]> }
     │ ◄────────────────────────── source-of-truth service
     │
     │  6. render with server errors
     │         applyErrors(doc, serverErrors)  →  re-walk  →  re-render
```

---

## Responsive Layout

Container nodes carry `Responsive<T>` props for `direction`, `gap`, and `cols`. The IR stores the full responsive object unchanged — no resolution at the core level.

```
JSON Document                 IRContainerNode                HTML / React output
─────────────                 ───────────────                ───────────────────
direction:                    direction:                     data-direction="column"
  { default:'column',    →      { default:'column',    →    data-md-direction="row"
    md:'row' }                    md:'row' }

cols:                         cols:                          data-cols="1"
  { default:1, md:2 }    →      { default:1, md:2 }    →   data-md-cols="2"
```

Output adapters read the breakpoint keys and emit one `data-*` attribute per key. `renderly.css` (in `@renderly/html`) applies them via `@media` rules — no JS viewport detection required. Works for SSR.

---

## Package Layout

```
renderly/                          ← pnpm workspace root
│
├── packages/
│   │
│   ├── shared/                    ← @renderly/shared
│   │   └── src/
│   │       ├── result/            Result<T,E> — no throws anywhere
│   │       ├── env/               loadConfig() — APP_ENV → typed Config
│   │       ├── logger/            createLogger() — structured JSON, level-gated
│   │       └── i18n/              initI18n(), t() — i18next, en.json keys
│   │
│   ├── schema/                    ← @renderly/schema
│   │   └── src/
│   │       ├── elements.ts        discriminated union: container|heading|text|input|submit
│   │       ├── ir.ts              IRNode tree types (output port contract)
│   │       ├── tokens.ts          Responsive<T>, Breakpoint, BREAKPOINTS
│   │       ├── document.ts        Document type (root)
│   │       └── json-schema/       document.schema.json — Ajv-compatible, allErrors
│   │
│   ├── core/                      ← @renderly/core
│   │   └── src/
│   │       ├── registry.ts        ComponentRegistry — maps element.type → walker fn
│   │       ├── walker.ts          recursive walk(Document) → IRNode[]
│   │       └── builders.ts        IR construction helpers, default resolution
│   │
│   ├── input/                     ← @renderly/input
│   │   └── src/
│   │       ├── parse.ts           JSON.parse → unknown
│   │       ├── validate.ts        Ajv validation → InputError
│   │       └── index.ts           parseDocument, parseDocumentObject
│   │
│   ├── html/                      ← @renderly/html
│   │   ├── src/
│   │   │   ├── renderers.ts       per-node render fns (escapeHtml, responsiveAttr)
│   │   │   ├── registry.ts        createDefaultHtmlRegistry()
│   │   │   └── index.ts           renderDocument
│   │   └── renderly.css           mobile-first responsive CSS, CSS custom properties
│   │
│   ├── react/                     ← @renderly/react
│   │   └── src/
│   │       ├── renderers.tsx      per-node render fns (JSX, responsiveDataProp)
│   │       ├── registry.ts        createDefaultReactRegistry()
│   │       └── index.ts           renderDocument
│   │
│   ├── submit/                    ← @renderly/submit
│   │   └── src/
│   │       ├── extract.ts         extractFields, extractSubmit (walks nested containers)
│   │       ├── build.ts           buildPayload — required-field validation → SubmitPayload
│   │       ├── apply.ts           applyErrors — pure document merge
│   │       ├── types.ts           FieldDescriptor, SubmitPayload, FieldValue
│   │       ├── errors.ts          PayloadError, FieldPayloadError
│   │       └── index.ts           barrel export
│   │
│   └── example/                   ← @renderly/example
│       └── src/
│           └── form.ts            Patient Intake Form — EXAMPLE_FORM_JSON, loadExampleForm()
│
└── renderly.css  (from @renderly/html — import in your host app)
```

---

## Dependency Graph (arrows = "depends on")

```
  @renderly/example  ─────────┬──────────────────────────────────────────┐
                               │                                          │
  @renderly/submit   ──────────┼──────────────────┐                      │
                               │                  │                      │
  @renderly/html     ──────────┼──────────┐        │                      │
                               │          │        │                      │
  @renderly/react    ──────────┼────┐      │        │                      │
                               │   │      │        │                      │
  @renderly/input    ──────────┼───┼──────┼──────┐  │                      │
                               │   │      │      │  │                      │
  @renderly/core     ──────────┼───┼──────┼──┐   │  │                      │
                               │   │      │  │   │  │                      │
                               ▼   ▼      ▼  ▼   ▼  ▼                     │
                            @renderly/schema                               │
                            @renderly/shared  ◄────────────────────────────┘
                            (no deps)
```

Rules enforced by this graph:
- `@renderly/shared` has **zero** production dependencies — it is the bottom of the stack.
- `@renderly/schema` depends only on `@renderly/shared`.
- `@renderly/core` depends on `@renderly/schema` + `@renderly/shared` — never on adapters.
- Rendering adapters (`html`, `react`, `markdown`, `email`, `pdf`) depend on `@renderly/schema` + `@renderly/shared` — never on each other.
- `@renderly/web-components` is a sanctioned exception: it depends on `@renderly/html` because it composes the HTML adapter's output into a live Custom Element rather than producing an independent target format. See [ADR-0006](./docs/adr/0006-web-components-depends-on-html-adapter.md). No other adapter may add a production dependency on another adapter without a new ADR making the same case.
- `@renderly/submit` depends on `@renderly/schema` + `@renderly/shared` — does not import from adapters.
- `@renderly/example` depends on all packages — it is the integration layer.
- No circular dependencies.

---

## Key Invariants

| Invariant | Where enforced |
|-----------|----------------|
| Core never imports from adapters | `package.json` `dependencies` per package |
| Validation happens once — at the input boundary | `@renderly/input` only |
| After validation, core trusts the Document | no re-validation in walker |
| `Responsive<T>` flows through IR unchanged | core passes through; adapters resolve |
| Every text-like value is escaped on output | HTML: `escapeHtml`; React: JSX escaping |
| Responsive layout via data-* attrs + CSS | no JS viewport detection; SSR-safe |
| No logic in the JSON document | schema rejects conditionals, loops, expressions |
| No method throws | `Result<T,E>` return type on every public function |
| Log level from `APP_ENV` — never hardcoded | `@renderly/shared` `loadConfig()` |
| PHI/field values never logged | convention — never pass user field values to logger |
