#!/usr/bin/env node
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sourcePath = join(root, 'legacy/mathlesson-v4.9.22/mathlesson.v4.9.22.html');
const outDir = join(root, 'analysis/extracted-v4.9.22');
const html = readFileSync(sourcePath, 'utf8');

function lineAndColumn(offset) {
  const before = html.slice(0, offset);
  const lines = before.split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1, offset };
}

function attrsToObject(rawAttrs) {
  const attrs = {};
  const attrPattern = /([:\w-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?/g;
  for (const match of rawAttrs.matchAll(attrPattern)) {
    const [, name, rawValue] = match;
    attrs[name.toLowerCase()] = rawValue ? rawValue.replace(/^['"]|['"]$/g, '') : true;
  }
  return attrs;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const manifest = {
  source: 'legacy/mathlesson-v4.9.22/mathlesson.v4.9.22.html',
  note: 'Analysis-only extraction. Do not treat extracted files as production modules.',
  entries: [],
};

let order = 0;
const blockPattern = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
for (const match of html.matchAll(blockPattern)) {
  const [full, tag, rawAttrs, content] = match;
  const attrs = attrsToObject(rawAttrs);
  const openEnd = match.index + full.indexOf('>') + 1;
  const closeStart = match.index + full.length - (`</${tag}>`).length;
  const ext = tag.toLowerCase() === 'style' ? 'css' : 'js';
  const scriptKind = tag.toLowerCase() === 'script' ? (attrs.type === 'module' ? 'module' : 'classic') : undefined;
  const filename = `${String(order + 1).padStart(3, '0')}-${tag.toLowerCase()}-${scriptKind || 'inline'}.${ext}`;
  writeFileSync(join(outDir, filename), content, 'utf8');
  manifest.entries.push({
    order: ++order,
    tag: tag.toLowerCase(),
    attrs,
    scriptKind,
    file: filename,
    contentStart: lineAndColumn(openEnd),
    contentEnd: lineAndColumn(closeStart),
    length: content.length,
    lines: content.split('\n').length,
  });
}

writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Extracted ${manifest.entries.length} inline script/style blocks to ${outDir}`);
