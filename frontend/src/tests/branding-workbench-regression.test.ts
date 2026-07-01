import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(sourceRoot, '..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(frontendRoot, relativePath), 'utf8');
}

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx|html|css)$/.test(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('brand and workbench regression guard', () => {
  it('keeps primary routes inside the shared AppShell', () => {
    const appSource = read('src/App.tsx');

    expect(appSource).toContain("import { AppShell } from './components/layout';");
    for (const route of [
      '/',
      '/history',
      '/settings',
      '/admin',
      '/project/:projectId/outline',
      '/project/:projectId/detail',
      '/project/:projectId/preview',
    ]) {
      const pattern = new RegExp(
        `<Route\\s+path=["']${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][\\s\\S]*?<AppShell`,
      );
      expect(appSource, `route ${route}`).toMatch(pattern);
    }
  });

  it('does not reintroduce old app branding into frontend UI sources', () => {
    const forbidden = [
      /\u8549\u5e7b/,
      /Banana\s+Slides/i,
      /nano\s+banana/i,
      /logo\.png/i,
    ];

    const files = [
      ...collectSourceFiles(path.join(frontendRoot, 'src')),
      path.join(frontendRoot, 'index.html'),
      path.join(frontendRoot, 'start.sh'),
      path.join(frontendRoot, 'start.bat'),
    ];

    const offenders = files.flatMap((file) => {
      const content = fs.readFileSync(file, 'utf8');
      return forbidden.some((pattern) => pattern.test(content))
        ? [path.relative(frontendRoot, file)]
        : [];
    });

    expect(offenders).toEqual([]);
  });
});
