#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const failures = [];
const notes = [];

function rel(path) {
  return path.replace(`${root}/`, '');
}

function requireFile(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    failures.push(`Missing required file: ${rel(path)}`);
    return false;
  }
  return true;
}

function requireDir(path) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    failures.push(`Missing required directory: ${rel(path)}`);
    return false;
  }
  return true;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function verifySha256Sums() {
  const sumsPath = join(root, 'legacy/mathlesson-v4.9.22/SHA256SUMS');
  if (!requireFile(sumsPath)) return;

  const lines = readFileSync(sumsPath, 'utf8').split('\n').filter((line) => line.trim());
  for (const line of lines) {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
    if (!match) {
      failures.push(`Malformed SHA256SUMS line: ${line}`);
      continue;
    }
    const [, expected, file] = match;
    const trimmedFile = file.trim();
    const rootRelativeTarget = join(root, trimmedFile);
    const target = existsSync(rootRelativeTarget) ? rootRelativeTarget : join(dirname(sumsPath), trimmedFile);
    if (!requireFile(target)) continue;
    const actual = sha256File(target);
    if (actual !== expected.toLowerCase()) {
      failures.push(`Hash mismatch for ${rel(target)}: expected ${expected}, got ${actual}`);
    }
  }
}

function verifyAuditOutput() {
  const auditPath = join(root, 'analysis/baseline-audit-v4.9.22.json');
  if (!requireFile(auditPath)) return;

  let audit;
  try {
    audit = JSON.parse(readFileSync(auditPath, 'utf8'));
  } catch (error) {
    failures.push(`Cannot parse ${rel(auditPath)}: ${error.message}`);
    return;
  }

  const htmlPath = join(root, audit.sources?.html?.path || '');
  const jsPath = join(root, audit.sources?.extractedJs?.path || '');
  if (requireFile(htmlPath) && audit.sources.html.sha256 !== sha256File(htmlPath)) {
    failures.push('Audit JSON html SHA-256 does not match preserved baseline HTML');
  }
  if (requireFile(jsPath) && audit.sources.extractedJs.sha256 !== sha256File(jsPath)) {
    failures.push('Audit JSON extracted JS SHA-256 does not match preserved inline JS');
  }

  const expectedCounts = ['externalResources', 'namedFunctions', 'eventListeners', 'localStorageCalls', 'possibleBlockTypes'];
  for (const key of expectedCounts) {
    if (!Number.isInteger(audit.counts?.[key]) || audit.counts[key] <= 0) {
      failures.push(`Audit JSON count ${key} is missing or zero`);
    }
  }
}

function verifyExtractManifest() {
  const manifestPath = join(root, 'analysis/extracted-v4.9.22/manifest.json');
  if (!requireFile(manifestPath)) return;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    failures.push(`Cannot parse ${rel(manifestPath)}: ${error.message}`);
    return;
  }

  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    failures.push('Extract manifest has no entries');
    return;
  }

  for (const entry of manifest.entries) {
    requireFile(join(dirname(manifestPath), entry.file));
  }
}

function verifyRequiredDocs() {
  const requiredFiles = [
    'docs/audit/dependency-inventory.md',
    'docs/audit/event-handler-inventory.md',
    'docs/audit/export-pipeline-map.md',
    'docs/audit/feature-inventory.md',
    'docs/audit/global-state-inventory.md',
    'docs/audit/missing-evidence.md',
    'docs/audit/persistence-map.md',
    'docs/audit/regression-risk-register.md',
    'docs/audit/rendering-lifecycle-map.md',
    'docs/audit/schema-inventory.md',
    'docs/architecture/documentation-site-plan.md',
    'docs/architecture/phased-migration-plan.md',
    'docs/architecture/proposed-module-architecture.md',
    'docs/architecture/proposed-react-component-tree.md',
    'docs/migration/phase-0-audit-summary.md',
    'docs/testing/manual-checklists/mathlesson-v4.9.22-parity.md',
    'docs/tooling/skills-manifest.md',
  ];

  for (const path of requiredFiles) {
    requireFile(join(root, path));
  }

  const adrDir = join(root, 'docs/architecture/adr');
  if (requireDir(adrDir)) {
    const adrFiles = readdirSync(adrDir).filter((file) => /^adr-\d{4}-.+\.md$/.test(file));
    if (adrFiles.length < 8) {
      failures.push(`Expected at least 8 ADRs, found ${adrFiles.length}`);
    }
  }
}

function verifyPhase0Boundary() {
  const srcPath = join(root, 'src');
  const packagePath = join(root, 'package.json');
  if (existsSync(srcPath)) {
    failures.push('Phase 0 boundary violation: src/ exists before Phase 1 approval');
  }
  if (existsSync(packagePath)) {
    failures.push('Phase 0 boundary violation: package.json exists before Phase 1 scaffolding');
  }
}

function verifySkills() {
  const lockPath = join(root, 'skills-lock.json');
  const skillsDir = join(root, '.agents/skills');
  if (!requireFile(lockPath) || !requireDir(skillsDir)) return;

  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch (error) {
    failures.push(`Cannot parse ${rel(lockPath)}: ${error.message}`);
    return;
  }

  const lockedNames = new Set(Object.keys(lock.skills || {}));
  const localNames = readdirSync(skillsDir).filter((name) => {
    const path = join(skillsDir, name);
    return statSync(path).isDirectory() && existsSync(join(path, 'SKILL.md'));
  });

  for (const name of localNames) {
    if (!lockedNames.has(name)) {
      failures.push(`Skill ${name} is installed locally but missing from skills-lock.json`);
    }

    const skillPath = join(skillsDir, name, 'SKILL.md');
    const source = readFileSync(skillPath, 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      failures.push(`Skill ${name} has no YAML frontmatter`);
      continue;
    }
    const declaredName = frontmatter[1].match(/^name:\s*['"]?([^'"\n]+)['"]?\s*$/m)?.[1];
    if (declaredName !== name) {
      failures.push(`Skill ${name} declares name ${declaredName || '<missing>'}`);
    }
  }

  for (const name of lockedNames) {
    if (!localNames.includes(name)) {
      failures.push(`skills-lock.json contains ${name}, but .agents/skills/${name}/SKILL.md is missing`);
    }
  }
}

function verifyGitignore() {
  const gitignorePath = join(root, '.gitignore');
  if (!requireFile(gitignorePath)) return;
  const entries = readFileSync(gitignorePath, 'utf8').split('\n').map((line) => line.trim());
  if (!entries.includes('.codegraph/')) {
    failures.push('.gitignore must ignore .codegraph/');
  }
}

verifySha256Sums();
verifyAuditOutput();
verifyExtractManifest();
verifyRequiredDocs();
verifyPhase0Boundary();
verifySkills();
verifyGitignore();

if (failures.length) {
  console.error('Phase 0 verification failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Phase 0 verification passed.');
if (notes.length) {
  for (const note of notes) console.log(`- ${note}`);
}
