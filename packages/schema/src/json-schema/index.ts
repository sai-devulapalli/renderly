import raw from './document.schema.json' assert { type: 'json' };

export type JsonSchema = Record<string, unknown>;

export const DOCUMENT_SCHEMA: JsonSchema = raw as JsonSchema;
