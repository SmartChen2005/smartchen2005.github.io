import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Pass the path to the Vibe Coding for Games checkout.');

const output = fileURLToPath(new URL('../dist/projects/ai-game-design/', import.meta.url));
const scratch = mkdtempSync(path.join(tmpdir(), 'ai-game-design-'));
const archive = path.join(scratch, 'game.tar');

function run(command, ...args) {
  const result = spawnSync(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with code ${result.status}`);
}

function unpack(revision, files) {
  run('git', `--git-dir=${path.resolve(source, '.git')}`, 'archive', '--format=tar', '-o', archive, revision, '--', ...files);
  run('tar', '-xf', archive, '-C', output);
}

try {
  mkdirSync(output, { recursive: true });
  unpack('cac95cbe30ed4e2659d60a7bb60b3bd45ccb52a8', [
    'pages/game1.html', 'pages/game2.html', 'pages/game2-editor.html', 'pages/game2-gallery.html',
    'pages/game2-playtest.html', 'pages/game2-timeline.html',
    'scripts/game1.js', 'scripts/game2*.js', 'styles/game1.css', 'styles/game2*.css',
    'assets/game1', 'assets/game2', 'data/game2', 'snapshots/game2',
    'docs/game2/development-timeline.md', 'docs/game2/explorations/19-playable-timeline-snapshots.md',
  ]);
  unpack('56e65d8a9b1ebf2adf91416465a344087c821da0', [
    'pages/game3.html', 'scripts/game3-prototype.js', 'styles/game3-prototype.css',
  ]);
} finally {
  rmSync(archive, { force: true });
  rmdirSync(scratch);
}
