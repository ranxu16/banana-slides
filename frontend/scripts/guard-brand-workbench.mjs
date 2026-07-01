import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const appPath = path.join(root, 'src', 'App.tsx');
const appSource = fs.readFileSync(appPath, 'utf8');

const requiredAppShellRoutes = [
  '/',
  '/history',
  '/settings',
  '/admin',
  '/project/:projectId/outline',
  '/project/:projectId/detail',
  '/project/:projectId/preview',
];

const failures = [];

if (!appSource.includes("import { AppShell } from './components/layout';")) {
  failures.push('App.tsx must import AppShell from ./components/layout.');
}

for (const route of requiredAppShellRoutes) {
  const routePattern = new RegExp(
    `<Route\\s+path=["']${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][\\s\\S]*?<AppShell`,
  );
  if (!routePattern.test(appSource)) {
    failures.push(`Route ${route} must render inside AppShell.`);
  }
}

const scanRoots = [
  path.join(root, 'src'),
  path.join(root, 'index.html'),
  path.join(root, 'start.sh'),
  path.join(root, 'start.bat'),
];

const forbiddenPatterns = [
  { label: 'old Chinese brand', regex: /\u8549\u5e7b/ },
  { label: 'old English brand', regex: /Banana\s+Slides/i },
  { label: 'old nano banana positioning', regex: /nano\s+banana/i },
  { label: 'old logo asset reference', regex: /logo\.png/i },
];

function collectFiles(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  if (!stat.isDirectory()) return [];

  const files = [];
  for (const entry of fs.readdirSync(target)) {
    const child = path.join(target, entry);
    const childStat = fs.statSync(child);
    if (childStat.isDirectory()) {
      files.push(...collectFiles(child));
    } else if (/\.(ts|tsx|js|jsx|html|css|sh|bat)$/.test(child)) {
      files.push(child);
    }
  }
  return files;
}

for (const file of scanRoots.flatMap(collectFiles)) {
  const relative = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');
  for (const { label, regex } of forbiddenPatterns) {
    if (regex.test(content)) {
      failures.push(`${relative} contains ${label}.`);
    }
  }
}

if (failures.length > 0) {
  console.error('\nBrand/workbench regression guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error('\nExpected product shell: PV SmartDeck / 光伏智呈 with AppShell routes.');
  process.exit(1);
}

console.log('Brand/workbench regression guard passed.');
