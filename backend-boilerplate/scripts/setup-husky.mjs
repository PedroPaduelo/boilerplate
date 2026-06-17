#!/usr/bin/env node
/**
 * Setup Husky hooks for backend-boilerplate.
 *
 * Why this exists:
 *
 *   The default `prepare: husky` flow hits two bugs in this monorepo:
 *
 *   1. `core.hooksPath` is set to the RELATIVE path `.husky/_`, but git
 *      resolves it against the toplevel of the repository (the monorepo
 *      root), not the package directory. So even if `_/` is populated,
 *      the hooks would not fire because git looks at `<root>/.husky/_`,
 *      which does not exist.
 *
 *   2. `husky` (v9) calls `fs.existsSync('.git')` from the cwd; in a
 *      package within a monorepo that is not the git root, the check
 *      fails silently and `_/` ends up empty.
 *
 *   3. In shared / rootless container environments, `.husky/_/` may have
 *      been created by a different uid and is not writable by the
 *      current user, blocking `chmod +x` of the shims — which git
 *      requires for hooks to run.
 *
 * What this does:
 *   - Uses a dedicated `backend-boilerplate/.husky-run/` directory
 *     (writable by the current user) as the shim location, with the
 *     husky shims in `.husky-run/_/`. The actual hook definitions
 *     (`.husky-run/pre-commit`, `.husky-run/commit-msg`) sit alongside
 *     the shims and `cd` into the package root so the tools (`lint-staged`,
 *     `commitlint`) can find their config files.
 *   - Sets `core.hooksPath` to the absolute path of `.husky-run/_/`
 *     (`git config --local`), so git can find the shims regardless of
 *     cwd.
 *   - Populates `.husky-run/_/` with the husky shim binaries copied
 *     from `node_modules/husky`. Works without a local `.git`.
 *   - Marks the shims executable (`chmod 0o755`) so git fires them.
 *
 * Idempotent: safe to run on every `npm install`.
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  chmodSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(__filename), '..');

// `core.hooksPath` points at the shim directory `.husky-run/_/` (the
// husky v9 convention). The actual hook scripts (`.husky-run/pre-commit`,
// `.husky-run/commit-msg`) live in the parent of the shim directory, so
// the husky shim's `$(dirname $(dirname $0))/$n` lookup lands on them.
const shimDir = join(packageRoot, '.husky-run', '_');
const runDir = join(packageRoot, '.husky-run');
const gitignore = join(packageRoot, '.gitignore');

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
}

function tryRun(cmd, args) {
  try {
    return { ok: true, stdout: run(cmd, args).toString() };
  } catch (err) {
    return { ok: false, err };
  }
}

// 1. Set `core.hooksPath` to the absolute path of `.husky-run/_`.
//    Using `git rev-parse --show-toplevel` would point at the monorepo
//    root, so we resolve relative to this package instead.
const absHooksPath = shimDir;
const cfgRes = tryRun('git', ['config', '--local', 'core.hooksPath', absHooksPath]);
if (!cfgRes.ok) {
  console.warn(
    '[setup-husky] could not set core.hooksPath (no git?):',
    cfgRes.err.message,
  );
} else {
  console.log(`[setup-husky] core.hooksPath -> ${absHooksPath}`);
}

// 2. Ensure `.husky-run/_/` exists and is populated with shim binaries.
const huskyPkg = join(packageRoot, 'node_modules', 'husky');
const hasHuskyPkg = existsSync(huskyPkg);
if (!hasHuskyPkg) {
  console.log(
    `[setup-husky] husky not installed at ${huskyPkg}; will skip shim regen ` +
      `and rely on existing files in ${shimDir}.`,
  );
}

const shimContent = '#!/usr/bin/env sh\n. "$(dirname -- "$0")/h"\n';
const hooks = [
  'applypatch-msg',
  'commit-msg',
  'post-applypatch',
  'post-checkout',
  'post-commit',
  'post-merge',
  'post-rewrite',
  'pre-applypatch',
  'pre-auto-gc',
  'pre-commit',
  'pre-merge-commit',
  'pre-push',
  'pre-rebase',
  'prepare-commit-msg',
];

let needsRegen = false;
if (!existsSync(shimDir)) {
  needsRegen = true;
} else {
  try {
    const existing = readdirSync(shimDir);
    // Consider the directory populated only if it has the shim binary
    // `h` and at least one of the per-hook shims.
    if (!existing.includes('h') || !existing.includes('pre-commit')) {
      needsRegen = true;
    }
  } catch {
    needsRegen = true;
  }
}

if (needsRegen && hasHuskyPkg) {
  mkdirSync(shimDir, { recursive: true });
  // Copy the shim binary (`h`).
  const huskySh = join(huskyPkg, 'husky');
  if (existsSync(huskySh)) {
    copyFileSync(huskySh, join(shimDir, 'h'));
  } else {
    const huskyShAlt = join(huskyPkg, 'husky.sh');
    if (existsSync(huskyShAlt)) {
      copyFileSync(huskyShAlt, join(shimDir, 'h'));
    } else {
      console.warn('[setup-husky] husky shim binary not found in node_modules/husky.');
    }
  }

  for (const hook of hooks) {
    const target = join(shimDir, hook);
    writeFileSync(target, shimContent);
    chmodSync(target, 0o755);
  }
  console.log(`[setup-husky] populated ${hooks.length} shims in ${shimDir}`);
} else if (needsRegen) {
  console.warn(
    `[setup-husky] ${shimDir} is empty and husky package is missing; ` +
      `shims will not be regenerated. Run "npm install" first.`,
  );
} else {
  console.log(`[setup-husky] shims already present in ${shimDir}, skipping.`);
}

// 3. Ensure the actual hook scripts (`.husky-run/pre-commit` and
//    `.husky-run/commit-msg`) exist with the right content. They are
//    the user-facing hook definitions and must NOT be overwritten by
//    this script on every run — they are created only if missing.
const hookDefs = {
  'pre-commit': [
    '#!/usr/bin/env sh',
    '# Pre-commit hook (backend-boilerplate).',
    '# Invoked by the husky shim via `core.hooksPath=.husky-run/_/`.',
    'cd "$(dirname "$0")/.." || exit 1',
    'npx --no -- lint-staged',
    '',
  ].join('\n'),
  'commit-msg': [
    '#!/usr/bin/env sh',
    '# Commit-msg hook (backend-boilerplate).',
    '# Invoked by the husky shim via `core.hooksPath=.husky-run/_/`.',
    'cd "$(dirname "$0")/.." || exit 1',
    'npx --no -- commitlint --edit "$1"',
    '',
  ].join('\n'),
};

for (const [name, content] of Object.entries(hookDefs)) {
  const target = join(runDir, name);
  if (!existsSync(target)) {
    try {
      mkdirSync(runDir, { recursive: true });
      writeFileSync(target, content);
      chmodSync(target, 0o755);
      console.log(`[setup-husky] wrote ${target}`);
    } catch (err) {
      console.warn(`[setup-husky] could not write ${target}: ${err.message}`);
    }
  }
}

// 4. Ensure `.husky-run/` is in the package `.gitignore` so the shims
//    and the local `core.hooksPath` (which encodes the absolute path
//    of the package) are not accidentally committed.
try {
  let gitignoreContent = existsSync(gitignore) ? readFileSync(gitignore, 'utf8') : '';
  if (!gitignoreContent.split('\n').some((line) => line.trim() === '.husky-run/')) {
    gitignoreContent = `${gitignoreContent.replace(/\n*$/, '')}\n# Local husky shim directory (managed by scripts/setup-husky.mjs)\n.husky-run/\n`;
    writeFileSync(gitignore, gitignoreContent);
    console.log('[setup-husky] added .husky-run/ to .gitignore');
  }
} catch (err) {
  console.warn('[setup-husky] could not update .gitignore:', err.message);
}