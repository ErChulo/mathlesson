#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const htmlPath = join(root, 'legacy/mathlesson-v4.9.22/mathlesson.v4.9.22.html');
const jsPath = join(root, 'legacy/mathlesson-v4.9.22/_inline.v4.9.22.mjs');
const outPath = join(root, 'analysis/baseline-audit-v4.9.22.json');

const html = readFileSync(htmlPath, 'utf8');
const js = readFileSync(jsPath, 'utf8');
const htmlLines = html.split('\n');
const jsLines = js.split('\n');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function lineOfOffset(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function matches(source, regex, limit = 500) {
  const output = [];
  for (const match of source.matchAll(regex)) {
    output.push({
      line: lineOfOffset(source, match.index),
      match: match[0].slice(0, 240).replace(/\s+/g, ' ').trim(),
      groups: match.slice(1),
    });
    if (output.length >= limit) break;
  }
  return output;
}

function lineMatches(lines, regex, limit = 500) {
  const output = [];
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      output.push({ line: index + 1, text: line.trim().slice(0, 300) });
    }
  });
  return output.slice(0, limit);
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

const externalResources = [];
for (const match of html.matchAll(/<(script|link)\b([^>]*)>/gi)) {
  const tag = match[1].toLowerCase();
  const attrs = attrsToObject(match[2]);
  const url = attrs.src || attrs.href || '';
  if (url) {
    externalResources.push({ tag, line: lineOfOffset(html, match.index), url, attrs });
  }
}

const namedFunctions = matches(js, /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g, 1000).map((entry) => ({
  name: entry.groups[0],
  line: entry.line,
}));

const arrowOrConstFunctions = matches(js, /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g, 1000).map((entry) => ({
  name: entry.groups[0],
  line: entry.line,
}));

const eventListeners = matches(js, /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\([^)]*\)|\[[^\]]+\])*)\.addEventListener\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^,)]+)/g, 1000).map((entry) => ({
  target: entry.groups[0],
  event: entry.groups[1],
  handler: entry.groups[2],
  line: entry.line,
  source: entry.match,
}));

const localStorageCalls = matches(js, /localStorage\.(getItem|setItem|removeItem|clear)\s*\(([^)]*)\)/g, 1000).map((entry) => ({
  operation: entry.groups[0],
  argument: entry.groups[1].trim().slice(0, 200),
  line: entry.line,
}));

const stringStorageKeys = [...new Set(localStorageCalls
  .map((call) => (call.argument.match(/^['"]([^'"]+)['"]/) || [])[1])
  .filter(Boolean))].sort();

const topLevelDeclarations = lineMatches(jsLines, /^\s*(?:const|let|var|function|class)\s+[A-Za-z_$][\w$]*/g, 2000);

const dependencyNeedles = {
  KaTeX: /katex|renderMathInElement/gi,
  MathLive: /MathLive|math-field|mathVirtualKeyboard|MathfieldElement/gi,
  'Cortex Compute Engine': /ComputeEngine|Cortex/gi,
  GSAP: /gsap|ScrollTrigger/gi,
  Plotly: /Plotly/gi,
  Arquero: /arquero|\baq\b/gi,
  'CodeMirror 5': /CodeMirror/gi,
  Mermaid: /mermaid/gi,
  JSXGraph: /JSXGraph|JXG/gi,
  'math.js': /mathjs|math\.evaluate|math\.parse|math\.simplify|math\.derivative/gi,
  Nerdamer: /nerdamer/gi,
  'simple-statistics': /simpleStatistics|simple-statistics|\bss\./gi,
  jStat: /jStat/gi,
  'Reveal.js': /Reveal/gi,
};

const dependencies = Object.fromEntries(Object.entries(dependencyNeedles).map(([name, regex]) => [
  name,
  {
    html: lineMatches(htmlLines, regex, 80),
    js: lineMatches(jsLines, new RegExp(regex.source, regex.flags), 120),
  },
]));

const featureNeedles = {
  navigation: /nav|toc|section|goTo|showSection|renderTOC|updateProgress/gi,
  authoring: /author|editor|workspace|builder|prompt|CodeMirror/gi,
  importExport: /import|export|download|FileReader|Blob|student|Reveal|print/gi,
  quiz: /quiz|submitQuiz|checkQuiz|score/gi,
  exercises: /exercise|inline|checkAnswer|Check|hint|feedback/gi,
  persistence: /localStorage|save|restore|reset/gi,
  renderers: /katex|mermaid|JSXGraph|JXG|Plotly|svg|video|calculator|statistics|arquero/gi,
  mobileMathLive: /mathVirtualKeyboard|safe-area|orientation|landscape|touch|pointer|outside/gi,
};

const featureEvidence = Object.fromEntries(Object.entries(featureNeedles).map(([name, regex]) => [
  name,
  lineMatches(jsLines, regex, 200),
]));

const possibleBlockTypes = [...new Set([
  ...matches(js, /\btype\s*:\s*['"]([A-Za-z0-9_-]+)['"]/g, 1000).map((entry) => entry.groups[0]),
  ...matches(js, /['"]type['"]\s*:\s*['"]([A-Za-z0-9_-]+)['"]/g, 1000).map((entry) => entry.groups[0]),
  ...matches(html, /\btype\s*:\s*['"]([A-Za-z0-9_-]+)['"]/g, 1000).map((entry) => entry.groups[0]),
])].sort();

const result = {
  sources: {
    html: { path: 'legacy/mathlesson-v4.9.22/mathlesson.v4.9.22.html', lines: htmlLines.length, bytes: Buffer.byteLength(html), sha256: sha256(html) },
    extractedJs: { path: 'legacy/mathlesson-v4.9.22/_inline.v4.9.22.mjs', lines: jsLines.length, bytes: Buffer.byteLength(js), sha256: sha256(js) },
  },
  counts: {
    externalResources: externalResources.length,
    namedFunctions: namedFunctions.length,
    arrowOrConstFunctions: arrowOrConstFunctions.length,
    eventListeners: eventListeners.length,
    localStorageCalls: localStorageCalls.length,
    localStorageStringKeys: stringStorageKeys.length,
    topLevelDeclarations: topLevelDeclarations.length,
    possibleBlockTypes: possibleBlockTypes.length,
  },
  externalResources,
  namedFunctions,
  arrowOrConstFunctions,
  eventListeners,
  localStorageCalls,
  stringStorageKeys,
  topLevelDeclarations,
  dependencies,
  featureEvidence,
  possibleBlockTypes,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
