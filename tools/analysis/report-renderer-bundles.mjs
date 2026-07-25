#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const manifestPath = join(root, 'dist/.vite/manifest.json');
const failures = [];

const budgets = {
  initialEntry: {
    label: 'initial entry JS chunk',
    maxBytes: 560 * 1024,
    maxGzipBytes: 175 * 1024,
  },
  mermaidLazy: {
    label: 'approved lazy Mermaid renderer chunk',
    maxBytes: 760 * 1024,
    maxGzipBytes: 180 * 1024,
  },
  plotlyLazy: {
    label: 'approved lazy Plotly renderer chunk',
    maxBytes: 3_900 * 1024,
    maxGzipBytes: 1_250 * 1024,
  },
};

function rel(path) {
  return relative(root, path).replaceAll('\\', '/');
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function readManifest() {
  if (!existsSync(manifestPath)) {
    failures.push(`Missing ${rel(manifestPath)}. Run npm run build before npm run bundle:report.`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    failures.push(`Cannot parse ${rel(manifestPath)}: ${error.message}`);
    return null;
  }
}

function getAssetStats(entryKey, entry) {
  if (!entry.file || !entry.file.endsWith('.js')) return null;

  const path = join(root, 'dist', entry.file);
  if (!existsSync(path)) {
    failures.push(`Manifest asset is missing: ${entry.file}`);
    return null;
  }

  const source = readFileSync(path);
  return {
    key: entryKey,
    file: entry.file,
    name: entry.name ?? '',
    src: entry.src ?? '',
    isEntry: Boolean(entry.isEntry),
    isDynamicEntry: Boolean(entry.isDynamicEntry),
    bytes: statSync(path).size,
    gzipBytes: gzipSync(source).byteLength,
  };
}

function identifyRenderer(asset) {
  const id = `${asset.key} ${asset.file} ${asset.name} ${asset.src}`;
  if (/plotly/i.test(id)) return 'plotlyLazy';
  if (/(mermaid|diagram|cynefin|cytoscape|dagre|sankey|swimlanes|architecture|requirement|quadrant|timeline|mindmap|kanban|journey|sequence|flow|gantt|block|class|state|gitgraph|erdiagram|wardley|xychart|venn)/i.test(id)) {
    return 'mermaidLazy';
  }
  if (asset.isEntry) return 'initialEntry';
  return 'unclassified';
}

function assertBudget(asset, budgetKey) {
  const budget = budgets[budgetKey];
  if (!budget) return;

  if (asset.bytes > budget.maxBytes) {
    failures.push(
      `${asset.file} exceeds ${budget.label} minified budget: ${formatBytes(asset.bytes)} > ${formatBytes(budget.maxBytes)}`,
    );
  }

  if (asset.gzipBytes > budget.maxGzipBytes) {
    failures.push(
      `${asset.file} exceeds ${budget.label} gzip budget: ${formatBytes(asset.gzipBytes)} > ${formatBytes(budget.maxGzipBytes)}`,
    );
  }
}

const manifest = readManifest();
if (manifest) {
  const assets = Object.entries(manifest)
    .map(([key, entry]) => getAssetStats(key, entry))
    .filter(Boolean)
    .sort((a, b) => b.bytes - a.bytes);

  const overViteWarningSize = assets.filter((asset) => asset.bytes > 500 * 1024);
  for (const asset of assets) {
    const budgetKey = identifyRenderer(asset);
    assertBudget(asset, budgetKey);

    if (asset.bytes > 500 * 1024 && budgetKey === 'unclassified') {
      failures.push(`${asset.file} is over 500 KiB and is not classified by the renderer bundle budget policy.`);
    }
  }

  const largest = assets.slice(0, 8).map((asset) => `${asset.file} ${formatBytes(asset.bytes)} (${formatBytes(asset.gzipBytes)} gzip)`);
  console.log('Renderer bundle report passed.');
  console.log(`Largest JS chunks: ${largest.join('; ')}`);
  if (overViteWarningSize.length) {
    console.log(`Chunks over Vite 500 KiB warning size: ${overViteWarningSize.length}`);
  }
}

if (failures.length) {
  console.error('Renderer bundle report failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
