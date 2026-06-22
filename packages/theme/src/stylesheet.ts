import { COLOR, FONT, HEADING_SIZE, SPACE, RADIUS, BREAKPOINT } from './tokens.js';

// Generates responsive data-attribute selectors for one breakpoint prefix.
function responsiveBreakpoint(bp: string, minWidth: string): string {
  return `
@media (min-width: ${minWidth}) {
  [data-${bp}-direction="row"]    { flex-direction: row; }
  [data-${bp}-direction="column"] { flex-direction: column; }
  [data-${bp}-gap="none"] { gap: ${SPACE.none}; }
  [data-${bp}-gap="sm"]   { gap: ${SPACE.sm}; }
  [data-${bp}-gap="md"]   { gap: ${SPACE.md}; }
  [data-${bp}-gap="lg"]   { gap: ${SPACE.lg}; }
  [data-${bp}-cols="1"] { --renderly-cols: 1; }
  [data-${bp}-cols="2"] { --renderly-cols: 2; }
  [data-${bp}-cols="3"] { --renderly-cols: 3; }
  [data-${bp}-cols="4"] { --renderly-cols: 4; }
}`;
}

export const css: string = `
/* ── Renderly Theme v0.1.0 ───────────────────────────────────────────────── */

/* ── Design tokens ───────────────────────────────────────────────────────── */

:root {
  --renderly-color-text:         ${COLOR.text};
  --renderly-color-text-subtle:  ${COLOR.textSubtle};
  --renderly-color-text-muted:   ${COLOR.textMuted};
  --renderly-color-accent:       ${COLOR.accent};
  --renderly-color-success:      ${COLOR.success};
  --renderly-color-danger:       ${COLOR.danger};
  --renderly-color-border:       ${COLOR.border};
  --renderly-color-border-focus: ${COLOR.borderFocus};
  --renderly-color-bg:           ${COLOR.bg};
  --renderly-color-bg-input:     ${COLOR.bgInput};
  --renderly-color-bg-error:     ${COLOR.bgError};

  --renderly-font-family:   ${FONT.family};
  --renderly-font-size:     ${FONT.sizeBase};
  --renderly-font-size-sm:  ${FONT.sizeSm};
  --renderly-font-size-lg:  ${FONT.sizeLg};
  --renderly-font-size-xl:  ${FONT.sizeXl};
  --renderly-line-height:   ${FONT.lineHeight};

  --renderly-h1-size: ${HEADING_SIZE[1]};
  --renderly-h2-size: ${HEADING_SIZE[2]};
  --renderly-h3-size: ${HEADING_SIZE[3]};
  --renderly-h4-size: ${HEADING_SIZE[4]};
  --renderly-h5-size: ${HEADING_SIZE[5]};
  --renderly-h6-size: ${HEADING_SIZE[6]};

  --renderly-space-none: ${SPACE.none};
  --renderly-space-sm:   ${SPACE.sm};
  --renderly-space-md:   ${SPACE.md};
  --renderly-space-lg:   ${SPACE.lg};

  --renderly-radius:       ${RADIUS.base};
  --renderly-radius-lg:    ${RADIUS.lg};
  --renderly-border-width: 1px;

  --renderly-field-gap:     0.375rem;
  --renderly-input-padding: 0.5rem 0.75rem;
}

/* ── Container layout ────────────────────────────────────────────────────── */

[data-direction],
[data-gap],
[data-cols] {
  display: flex;
  flex-wrap: wrap;
}

[data-direction="row"]    { flex-direction: row; }
[data-direction="column"] { flex-direction: column; }

[data-gap="none"] { gap: var(--renderly-space-none); }
[data-gap="sm"]   { gap: var(--renderly-space-sm); }
[data-gap="md"]   { gap: var(--renderly-space-md); }
[data-gap="lg"]   { gap: var(--renderly-space-lg); }

[data-cols="1"] { --renderly-cols: 1; }
[data-cols="2"] { --renderly-cols: 2; }
[data-cols="3"] { --renderly-cols: 3; }
[data-cols="4"] { --renderly-cols: 4; }

[data-cols] > * {
  flex: 0 0 calc(100% / var(--renderly-cols, 1) - var(--renderly-space-md, 1rem));
}
${responsiveBreakpoint('sm', BREAKPOINT.sm)}
${responsiveBreakpoint('md', BREAKPOINT.md)}
${responsiveBreakpoint('lg', BREAKPOINT.lg)}
${responsiveBreakpoint('xl', BREAKPOINT.xl)}

/* ── Typography ──────────────────────────────────────────────────────────── */

h1, h2, h3, h4, h5, h6 {
  font-family: var(--renderly-font-family);
  font-weight: 700;
  line-height: 1.25;
  margin: 0 0 var(--renderly-space-sm) 0;
  color: var(--renderly-color-text);
}

h1 { font-size: var(--renderly-h1-size); }
h2 { font-size: var(--renderly-h2-size); }
h3 { font-size: var(--renderly-h3-size); }
h4 { font-size: var(--renderly-h4-size); }
h5 { font-size: var(--renderly-h5-size); }
h6 { font-size: var(--renderly-h6-size); }

[data-size="sm"] { font-size: var(--renderly-font-size-sm); }
[data-size="md"] { font-size: var(--renderly-font-size); }
[data-size="lg"] { font-size: var(--renderly-font-size-lg); }
[data-size="xl"] { font-size: var(--renderly-font-size-xl); }

p[data-weight],
p[data-intent] {
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size);
  line-height: var(--renderly-line-height);
  margin: 0 0 var(--renderly-space-sm) 0;
}

[data-weight="normal"] { font-weight: 400; }
[data-weight="medium"] { font-weight: 500; }
[data-weight="bold"]   { font-weight: 700; }

[data-intent="default"] { color: var(--renderly-color-text); }
[data-intent="accent"]  { color: var(--renderly-color-accent); }
[data-intent="good"]    { color: var(--renderly-color-success); }
[data-intent="danger"]  { color: var(--renderly-color-danger); }
[data-intent="muted"]   { color: var(--renderly-color-text-muted); }

/* ── Fields ──────────────────────────────────────────────────────────────── */

.field {
  display: flex;
  flex-direction: column;
  gap: var(--renderly-field-gap);
  margin-bottom: var(--renderly-space-md);
  font-family: var(--renderly-font-family);
}

.field label {
  font-size: var(--renderly-font-size-sm);
  font-weight: 600;
  color: var(--renderly-color-text-subtle);
}

.field input,
.field select,
.field textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: var(--renderly-input-padding);
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size);
  color: var(--renderly-color-text);
  background-color: var(--renderly-color-bg-input);
  border: var(--renderly-border-width) solid var(--renderly-color-border);
  border-radius: var(--renderly-radius);
  outline: none;
  transition: border-color 0.15s ease;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--renderly-color-border-focus);
}

/* ── Choice group ────────────────────────────────────────────────────────── */

.choice-group {
  border: none;
  padding: 0;
  margin: 0 0 var(--renderly-space-md) 0;
}

.choice-group legend {
  font-size: var(--renderly-font-size-sm);
  font-weight: 600;
  color: var(--renderly-color-text-subtle);
  margin-bottom: var(--renderly-field-gap);
}

.choice-option {
  display: flex;
  align-items: center;
  gap: var(--renderly-space-sm);
  padding: var(--renderly-space-sm) 0;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size);
  cursor: pointer;
}

.choice-option input[type="radio"],
.choice-option input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: var(--renderly-color-accent);
}

/* ── Submit button ───────────────────────────────────────────────────────── */

button[type="submit"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size);
  font-weight: 600;
  color: var(--renderly-color-bg);
  background-color: var(--renderly-color-accent);
  border: none;
  border-radius: var(--renderly-radius);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

button[type="submit"]:hover  { opacity: 0.9; }
button[type="submit"]:active { opacity: 0.8; }

button[type="submit"]:focus-visible {
  outline: 2px solid var(--renderly-color-border-focus);
  outline-offset: 2px;
}

/* ── Errors ──────────────────────────────────────────────────────────────── */

.error--form {
  padding: 0.75rem 1rem;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size);
  color: var(--renderly-color-danger);
  background-color: var(--renderly-color-bg-error);
  border: var(--renderly-border-width) solid var(--renderly-color-danger);
  border-radius: var(--renderly-radius);
  margin-bottom: var(--renderly-space-md);
}

.error--field {
  padding: 0.375rem 0.75rem;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  color: var(--renderly-color-danger);
  background-color: var(--renderly-color-bg-error);
  border-left: 3px solid var(--renderly-color-danger);
  margin-bottom: var(--renderly-space-sm);
}

.field-errors {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-error {
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  color: var(--renderly-color-danger);
}

/* ── Repeat group ────────────────────────────────────────────────────────── */

.renderly-repeat {
  border: var(--renderly-border-width) solid var(--renderly-color-border);
  border-radius: var(--renderly-radius-lg);
  padding: var(--renderly-space-md);
  margin-bottom: var(--renderly-space-md);
}

.renderly-repeat legend {
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  font-weight: 600;
  color: var(--renderly-color-text-subtle);
  padding: 0 var(--renderly-space-sm);
}

.renderly-repeat__item {
  padding: var(--renderly-space-md);
  border: var(--renderly-border-width) solid var(--renderly-color-border);
  border-radius: var(--renderly-radius);
  margin-bottom: var(--renderly-space-sm);
}

.renderly-repeat__remove {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  color: var(--renderly-color-danger);
  background: transparent;
  border: var(--renderly-border-width) solid var(--renderly-color-danger);
  border-radius: var(--renderly-radius);
  cursor: pointer;
  margin-top: var(--renderly-space-sm);
}

.renderly-repeat__remove:hover { background-color: var(--renderly-color-bg-error); }

.renderly-repeat__add {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 1rem;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  color: var(--renderly-color-accent);
  background: transparent;
  border: var(--renderly-border-width) solid var(--renderly-color-accent);
  border-radius: var(--renderly-radius);
  cursor: pointer;
  margin-top: var(--renderly-space-sm);
}

/* ── Signature field ─────────────────────────────────────────────────────── */

.renderly-signature {
  margin-bottom: var(--renderly-space-md);
}

.renderly-signature__pad {
  width: 100%;
  min-height: 6rem;
  border: var(--renderly-border-width) dashed var(--renderly-color-border);
  border-radius: var(--renderly-radius);
  background-color: var(--renderly-color-bg-input);
  cursor: crosshair;
}

/* ── Custom element ──────────────────────────────────────────────────────── */

.renderly-custom {
  margin-bottom: var(--renderly-space-md);
}

.renderly-custom__label {
  display: block;
  font-family: var(--renderly-font-family);
  font-size: var(--renderly-font-size-sm);
  font-weight: 600;
  color: var(--renderly-color-text-subtle);
  margin-bottom: var(--renderly-field-gap);
}
`.trimStart();
