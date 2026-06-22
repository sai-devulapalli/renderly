# ADR-0003: @renderly/example is a private integration-test package — it must never be published

**Status:** Accepted  
**Date:** 2026-06-17  
**Packages affected:** `@renderly/example`

---

## Context

The Renderly monorepo has 7 publishable packages and one package, `@renderly/example`, that depends on all 7. The example package serves two purposes:

1. **Developer reference** — provides a realistic, runnable Patient Intake Form that exercises every feature of the Renderly pipeline (responsive containers, all input kinds, submit round-trip, error application, XSS escaping).
2. **End-to-end integration tests** — its test suite (`tests/e2e/example.e2e.test.tsx`) runs the full pipeline without mocks: `parseDocument → walk → renderDocument → extractFields → buildPayload → applyErrors → re-render`. These are the only tests that exercise cross-package interactions.

A decision was needed: should `@renderly/example` be a published npm package (so developers can `npm install @renderly/example` and copy from it) or an internal, private integration layer?

### Forces

- **Circular dependency risk.** `@renderly/example` imports from all other packages. If it were published, a host app that installed `@renderly/example` alongside `@renderly/html` would likely get two copies of `@renderly/schema` and `@renderly/shared` if the versions drifted. This is the classic "diamond dependency" problem.
- **Wrong abstraction.** The example exists to teach correct usage and to assert cross-package correctness. It is not a building block that host apps compose from — they should copy the form definition JSON, not import the package at runtime.
- **Version coupling.** If `@renderly/example` were published, it would need its own version and changelog. Every time any dependency package changed its API, the example package would need a release. This is operational overhead with no consumer benefit.
- **Private packages cannot be accidentally published.** Setting `"private": true` in `package.json` means `pnpm publish` refuses to publish it, regardless of CI configuration mistakes.

---

## Decision

**`@renderly/example` is permanently `"private": true`.** It will never be published to npm.

Its roles are:
1. The monorepo's cross-package integration test suite.
2. A copy-paste reference for developers reading the source code or the documentation.

The form definition JSON (`EXAMPLE_FORM_JSON`) is documented in `packages/example/README.md` and in the root README as a copy-paste starting point. Developers are expected to copy the JSON and adapt it — not to import `@renderly/example` as a runtime dependency.

---

## Consequences

**Positive:**
- No circular dependency risk. The example consumes all packages as a leaf node; nothing depends on it.
- `@renderly/example` can be updated freely to demonstrate new features without triggering semver considerations for any published package.
- The e2e test suite can import from any package with `workspace:*` pinning — no version resolution needed.

**Negative / risks:**
- Developers who want to run the example form can only do so by cloning the monorepo, not by installing a package. This is intentional — the example is a source artifact, not a runtime artifact.
- If the example package is accidentally removed from `"private": true` by a future contributor (e.g., during a "remove private from all packages before publishing" scripted change), CI must catch this before publish. **Add a `check:publishability` script that asserts `@renderly/example` and the monorepo root have `"private": true` and all other packages do not.**

**Invariant to preserve:**  
> `@renderly/example/package.json` MUST keep `"private": true`. No publishable package may depend on `@renderly/example` — it is always a leaf in the dependency graph.

---

## Alternatives considered

**Alternative A — Publish @renderly/example as a peer to the other packages.**  
Rejected: circular dependency risk, version coupling overhead, and wrong consumer mental model (you copy form JSON, you don't import it at runtime).

**Alternative B — Delete the example package and write the e2e tests inside @renderly/core.**  
Rejected: cross-package e2e tests must live in a package that depends on all adapters. Putting them in core would violate the dependency direction rule (core cannot import from adapters).

**Alternative C — Publish the example form as a separate standalone repo.**  
Deferred: viable for a future `renderly-starter` template repo. The monorepo example package still serves as the integration test harness regardless.
