import type { Document } from '@renderly/schema';
import { parseDocument } from '@renderly/input';
import type { InputError } from '@renderly/input';
import type { Result } from '@renderly/shared';

/**
 * Patient Intake Form — demonstrates all Renderly features in one document:
 *   - Responsive container (direction: { default: column, md: row }) for name row
 *   - Responsive container (cols: { default: 1, md: 2 }) for measurements grid
 *   - All four input kinds: text, date, choice (single), choice (multiple), number
 *   - Required and optional fields
 *   - Submit element with route + opaque context
 *
 * Defined as a typed Document constant so the compiler validates the structure,
 * then serialised to a JSON string so tests exercise the full ingress pipeline.
 */
const FORM: Document = {
  version: '1',
  title: 'Patient Intake Form',
  elements: [
    { type: 'heading', level: 1, text: 'New Patient Registration' },
    {
      type: 'text',
      content: 'Please complete all required fields before your appointment.',
    },
    {
      type: 'container',
      direction: { default: 'column', md: 'row' },
      gap: 'md',
      children: [
        { type: 'input', kind: 'text', id: 'first_name', label: 'First Name', required: true },
        { type: 'input', kind: 'text', id: 'last_name',  label: 'Last Name',  required: true },
      ],
    },
    { type: 'input', kind: 'date', id: 'dob',      label: 'Date of Birth',      required: true },
    { type: 'input', kind: 'text', id: 'email',    label: 'Email Address',       required: true },
    {
      type: 'input', kind: 'choice', id: 'insurance', label: 'Insurance Provider',
      required: true,
      options: [
        { value: 'aetna', label: 'Aetna' },
        { value: 'bcbs',  label: 'Blue Cross Blue Shield' },
        { value: 'cigna', label: 'Cigna' },
        { value: 'other', label: 'Other / Self-Pay' },
      ],
    },
    {
      type: 'input', kind: 'choice', id: 'symptoms', label: 'Reason for Visit',
      multiple: true,
      options: [
        { value: 'checkup',     label: 'Annual Check-up' },
        { value: 'follow_up',   label: 'Follow-up Visit' },
        { value: 'new_concern', label: 'New Health Concern' },
        { value: 'refill',      label: 'Prescription Refill' },
      ],
    },
    {
      type: 'container',
      cols: { default: 1, md: 2 },
      gap: 'sm',
      children: [
        { type: 'input', kind: 'number', id: 'height_cm', label: 'Height (cm)', min: 50,  max: 250 },
        { type: 'input', kind: 'number', id: 'weight_kg', label: 'Weight (kg)', min: 1,   max: 500 },
      ],
    },
    {
      type: 'submit', id: 'intake-submit', label: 'Complete Registration',
      route: '/api/intake',
      context: { form_version: '2026-Q2', clinic: 'main' },
    },
  ],
};

/** Raw JSON string as served by an API — the ingress boundary. */
export const EXAMPLE_FORM_JSON: string = JSON.stringify(FORM);

/** Parses EXAMPLE_FORM_JSON through the full @renderly/input ingress pipeline. */
export function loadExampleForm(): Result<Document, InputError> {
  return parseDocument(EXAMPLE_FORM_JSON);
}
