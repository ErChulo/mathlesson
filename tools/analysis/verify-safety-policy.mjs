#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sourceRoot = join(root, 'src');
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const failures = [];

function rel(path) {
  return relative(root, path).replaceAll('\\', '/');
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];

  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') continue;
      files.push(...listFiles(path));
      continue;
    }

    if (entry.isFile()) files.push(path);
  }

  return files;
}

function isProductionSource(path) {
  if (!sourceExtensions.has(extname(path))) return false;
  return !/\.(test|spec)\.[cm]?[jt]sx?$/.test(path);
}

const rules = [
  {
    label: 'Do not serialize renderer source into data-source-* attributes. Use data-source-id only.',
    pattern: /data-source-(?!id\b)[a-z0-9-]+/gi,
  },
  {
    label: 'Do not write source blobs into element.dataset.*Source fields.',
    pattern: /\bdataset\s*(?:\.\s*[A-Za-z_$][\w$]*Source\b|\[\s*['"][^'"]*Source['"]\s*\])/g,
  },
  {
    label: 'Do not expose serialized source keys on DOM nodes.',
    pattern: /\b(?:rendererSourceKey|data-renderer-source-key)\b/g,
  },
  {
    label: 'Do not execute lesson-authored strings with Function constructors or eval.',
    pattern: /\b(?:new\s+Function|Function\s*\(|eval\s*\()/g,
  },
];

for (const file of listFiles(sourceRoot).filter(isProductionSource)) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        failures.push(`${rel(file)}:${index + 1}: ${rule.label}`);
      }
    }
  }
}

if (failures.length) {
  console.error('Safety policy verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Safety policy verification passed.');
