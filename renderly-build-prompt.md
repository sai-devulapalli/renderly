# Renderly — Build Prompt

## What We're Building

**Renderly** is a JSON-driven UI rendering engine published as a standalone npm library. It takes a JSON document describing UI and renders it into actual UI. The document is produced independently — by a backend, config file, or authoring tool. Renderly is consumed by host applications; it does not run as a service.

---

## Renderly IS the SDK

Renderly ships as a publishable npm package (or a set of scoped packages: `@renderly/core`, `@renderly/react`, `@renderly/html`). Host applications `import` it — there is no platform it depends on. It is dependency-light by design. Any utilities shared across internal packages (logger, result types, i18n bootstrap) live in `@renderly/shared` — an internal package, not an external platform.

---

## How to Build: Iterative Modules with Quality Gates

Build one module at a time. A module is complete only when all gates pass — do not start the next module until then.

**Quality gate checklist per module:**

1. Compiles with zero TypeScript errors (`strict: true`).
2. Coverage: **branch ≥ 100%**, **line ≥ 85%**.
3. Test triad met: **85% unit · 10% functional · 5% e2e**.
4. No method throws — all failures return a typed `Result<T, E>`.
5. Committed as a self-contained unit: source, tests, schemas, i18n keys.
6. Any logic used across more than one module lives in `@renderly/shared` before being consumed — never inlined per-module.
7. **Reusability is the primary design metric.** If something appears twice, it belongs in the shared layer.

---

## Module Sequence

| # | Module | Gate before proceeding |
|---|--------|------------------------|
| 1 | **Shared infrastructure** — structured logger, environment config, result/error types, i18n scaffold | All cross-cutting concerns settled before any feature code |
| 2 | **Schema & Types** — discriminated union vocabulary, JSON Schema, `Document` type | Schema is frozen; element vocabulary will grow but the mechanism won't change |
| 3 | **Domain Core** — component registry, recursive walker, IR | Pure; no I/O; all paths covered |
| 4 | **Input Adapter** — ingress validator: raw JSON → validated `Document` | Fails loud and early with path-located errors |
| 5 | **Output Adapter: HTML** — IR → escaped HTML string (server-side) | All text-like values escaped without exception |
| 6 | **Output Adapter: DOM/React** — IR → React component tree (client-side) | Same escaping guarantee as HTML adapter |
| 7 | **Submit Contract** — form definition, submit payload, error response keyed by field `id` | Round-trip contract is complete and tested |
| 8 | **End-to-end example** — one real form through both adapters, submit payload, sample error response | Golden path e2e test passes with no mocks |
| 9 | **Docs** — architecture, registering element types, adding adapters, scope boundary note | Docs live next to the code they describe |

---

## Architecture: Hexagonal (Ports & Adapters)

Apply the principle, not the ceremony. No DI containers, no abstract base-class hierarchies — this is a library.

```
JSON ──► Input Adapter ──► [Input Port: Document] ──► Core (Registry + Walker + IR) ──► [Output Port: IRNode] ──► Output Adapter ──► HTML / DOM
```

- **Core** depends on nothing. It knows only validated `Document`s and `IRNode`s.
- **Input port**: TypeScript interface — produce a validated `Document`.
- **Output port**: TypeScript interface — consume an `IRNode` tree.
- **Adapters** are functions or small modules, never framework-coupled.
- Adding a new format or render target never touches the core.

---

## Tech Stack

- **Language**: TypeScript, `strict: true`
- **Runtime**: Node (server) + browser (client)
- **UI adapter**: React (DOM output only)
- **Testing**: Vitest (unit/functional) + Playwright (e2e)
- **Coverage**: c8 / v8
- **i18n**: `i18next` — English default; all user-facing strings keyed from day one
- **Build/publish**: `tsup` (dual CJS + ESM output)

---

## Three Separated Concerns — Never Merge

| Concern | Owns |
|---------|------|
| **Layout** | element tree structure |
| **Data** | field types and validation rules |
| **Theme** | styling, supplied by the host — never in the document |

---

## Hard Design Rules

- The schema describes **what**, never **how**. No conditionals, loops, expressions, or flow logic in JSON. Reject any feature that embeds logic in the document.
- Elements declare **semantic intent** (`size`, `weight`, named color intents: `accent / good / danger`). The host theme maps intent to concrete styling. No pixels or raw CSS in documents.
- **Escape every text-like value on output** in every output adapter — input strings entering the DOM are a security boundary.
- Inputs and submit actions carry **stable `id`s**.
- Submit actions name where the result routes and carry opaque pass-through context (version token, workflow instance id) — no logic about what happens next.
- The engine **renders** field-level and form-level errors keyed by field `id`; it does not own validation-as-truth or workflow state.
- **No method throws.** Return `Result<T, E>` — `{ ok: true; value: T } | { ok: false; error: E }`. Callers handle errors explicitly.

---

## Security (Rendering Library Scope Only)

Three rules — no more, no less. RBAC, encryption at rest, and audit logging are the host application's responsibility.

1. **Escape all text-like values** on output in every adapter. No exceptions. This is the XSS boundary.
2. **Validate at ingress.** Reject malformed documents with path-located errors before they reach the core.
3. **Never log user-supplied field values.** The logger must not emit form data, even at debug level.

---

## Environments

Three environments: `local` · `staging` · `production`. Injected via `APP_ENV` at startup.

| | local | staging | production |
|--|-------|---------|------------|
| Log level | `debug` | `warn` | `error` |
| Structured JSON logs | ✅ | ✅ | ✅ |
| Trace/span IDs | ✅ | ✅ | ✅ |
| Debug output | ✅ | ❌ | ❌ |

---

## Logging

Structured JSON. Every entry includes: `timestamp`, `level`, `service`, `traceId`, `spanId`, `env`, `message`, `context`.

```json
{
  "timestamp": "2026-06-17T12:00:00.000Z",
  "level": "error",
  "service": "renderly.input-adapter",
  "traceId": "abc123",
  "spanId": "def456",
  "env": "production",
  "message": "Document validation failed",
  "context": { "path": "elements[2].type", "received": "unknown" }
}
```

- Logger lives in `@renderly/shared`. All packages import it from there.
- Log level set at startup from `APP_ENV` — never hardcoded.
- Production: `error` only. Trace + span IDs present on every line.
- Never emit user-supplied field values at any log level.

---

## Testing Strategy

| Layer | Share | Tool | Mocks allowed |
|-------|-------|------|---------------|
| Unit | 85% | Vitest | Yes |
| Functional | 10% | Vitest | Yes |
| E2e | 5% | Playwright | **Never** |

- **Unit**: pure functions, domain core, individual adapters in isolation.
- **Functional**: input → output pipelines, adapter integration within the process.
- **E2e**: golden paths from raw JSON to rendered output using real dependencies. No mocks.
- Every module ships its tests in the same commit.

---

## Internationalisation

- All user-facing strings (validation messages, error labels, ARIA labels) are keyed through `i18next` from day one.
- Default locale: `en`. Keys live in `packages/shared/src/i18n/locales/en.json`.
- Adding a new locale is a JSON file drop-in — no code changes elsewhere.

---

## What Renderly Does NOT Own

Workflow state, transitions, authorization decisions, encryption at rest, audit trails, and RBAC are the responsibility of the **host application** that consumes Renderly. Renderly renders; it does not govern.

---

## Deliverables (each module, same commit)

- Source (`.ts`)
- Tests (`.test.ts` / `.spec.ts`)
- JSON Schema or type declarations (if applicable)
- i18n keys added to `en.json`

**Across all modules:**
- Schema types + JSON Schema
- Domain core: registry, walker, IR
- Input adapter: ingress validator
- Output adapters: HTML string + DOM/React
- Submit contract: definition → payload → error response
- One fully worked end-to-end example form
- Docs: architecture, element registration, adapter extension, scope boundary
