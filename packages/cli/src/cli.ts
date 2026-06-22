#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { parseDocument } from '@renderly/input';
import { walk, createDefaultRegistry } from '@renderly/core';
import { auditNodes } from '@renderly/a11y';
import { lintDocument } from './lint.js';
import { extractFields } from './fields.js';

const program = new Command();

program
  .name('renderly')
  .description('Renderly schema tooling CLI')
  .version('0.1.0');

function readSchema(file: string): string {
  try {
    return readFileSync(file, 'utf-8');
  } catch {
    console.error(`Error: Cannot read file "${file}"`);
    process.exit(1);
  }
}

program
  .command('validate <file>')
  .description('Validate a Renderly document JSON file against the schema')
  .action((file: string) => {
    const json = readSchema(file);
    const result = parseDocument(json);
    if (result.ok) {
      const elementCount = result.value.elements.length;
      console.log(`✓ Valid — ${elementCount} top-level element${elementCount !== 1 ? 's' : ''}`);
    } else {
      const e = result.error;
      if (e.code === 'VALIDATION_ERROR') {
        console.error('✗ Validation errors:');
        for (const f of e.failures) {
          console.error(`  • ${f.path}: ${f.message}`);
        }
      } else {
        console.error(`✗ Parse error: ${e.message}`);
      }
      process.exit(1);
    }
  });

program
  .command('lint <file>')
  .description('Lint for dead rules, duplicate IDs, and orphan references')
  .action((file: string) => {
    const json = readSchema(file);
    const result = parseDocument(json);
    if (!result.ok) {
      console.error('✗ Cannot lint: document is invalid. Run `renderly validate` first.');
      process.exit(1);
    }
    const issues = lintDocument(result.value);
    if (issues.length === 0) {
      console.log('✓ No lint issues found');
    } else {
      let errors = 0;
      for (const issue of issues) {
        const prefix = issue.severity === 'error' ? '✗' : '⚠';
        const id = issue.elementId ? ` [${issue.elementId}]` : '';
        console.log(`${prefix}${id} ${issue.code}: ${issue.message}`);
        if (issue.severity === 'error') errors++;
      }
      if (errors > 0) process.exit(1);
    }
  });

program
  .command('audit <file>')
  .description('Run accessibility audit on the document')
  .action((file: string) => {
    const json = readSchema(file);
    const parseResult = parseDocument(json);
    if (!parseResult.ok) {
      console.error('✗ Cannot audit: document is invalid. Run `renderly validate` first.');
      process.exit(1);
    }
    const walkResult = walk(parseResult.value, createDefaultRegistry());
    if (!walkResult.ok) {
      console.error(`✗ Walk failed: ${walkResult.error.code} (${walkResult.error.elementType})`);
      process.exit(1);
    }
    const violations = auditNodes(walkResult.value);
    if (violations.length === 0) {
      console.log('✓ No accessibility violations found');
    } else {
      let errors = 0;
      for (const v of violations) {
        const prefix = v.severity === 'error' ? '✗' : '⚠';
        const id = v.id ? ` [${v.id}]` : '';
        console.log(`${prefix}${id} ${v.code}: ${v.message}`);
        if (v.severity === 'error') errors++;
      }
      if (errors > 0) process.exit(1);
    }
  });

program
  .command('fields <file>')
  .description('List all input fields in the document')
  .action((file: string) => {
    const json = readSchema(file);
    const result = parseDocument(json);
    if (!result.ok) {
      console.error('✗ Invalid document. Run `renderly validate` first.');
      process.exit(1);
    }
    const fields = extractFields(result.value);
    if (fields.length === 0) {
      console.log('No input fields found');
    } else {
      console.log(`${fields.length} field${fields.length !== 1 ? 's' : ''}:`);
      for (const f of fields) {
        const req = f.required ? ' (required)' : '';
        console.log(`  ${f.id}  [${f.kind}]  "${f.label}"${req}`);
      }
    }
  });

program.parse();
