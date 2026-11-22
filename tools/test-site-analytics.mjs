import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { prepareSiteAnalytics } from './prepare-site-analytics.mjs';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'vegshark-analytics-'));
const source = fs.readFileSync('dist/site-analytics.js', 'utf8');
const html = '<!doctype html><html><head><title>Portfolio</title></head><body></body></html>';
const livePages = ['index.html', 'gallery/example/index.html', 'projects/gran-turismo/index.html'];
const excludedPages = ['404.html', 'projects/editions/index.html', 'projects/snapshots/index.html'];

try {
  fs.writeFileSync(path.join(fixture, 'site-analytics.js'), source);
  for (const page of [...livePages, ...excludedPages]) {
    const file = path.join(fixture, page);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }

  assert.equal(prepareSiteAnalytics(fixture), livePages.length);
  assert.equal(prepareSiteAnalytics(fixture), 0);
  for (const page of livePages) {
    const result = fs.readFileSync(path.join(fixture, page), 'utf8');
    assert.match(result, /<script defer src="\/site-analytics\.js"><\/script>\n<\/head>/);
    assert.equal(result.split('/site-analytics.js').length, 2);
  }
  for (const page of excludedPages) {
    assert.equal(fs.readFileSync(path.join(fixture, page), 'utf8'), html);
  }
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}

function loadAnalytics({ host = 'www.vegshark.com', referrer = '', navigator = {}, embedded = false } = {}) {
  const window = {};
  window.self = window;
  window.top = embedded ? {} : window;
  const scripts = [];
  const location = new URL(`https://${host}/gallery/?private=value#photo`);
  const document = { referrer, createElement: () => ({}), head: { append: script => scripts.push(script) } };
  runInNewContext(source, { window, location, navigator, document, URL });
  return { commands: (window.dataLayer ?? []).map(args => [...args]), scripts };
}

const production = loadAnalytics({ referrer: 'https://example.net/path?private=value' });
assert.equal(production.scripts.length, 1);
const [, [command, id, config]] = production.commands;
assert.equal(command, 'config');
assert.equal(production.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
assert.equal(config.page_location, 'https://www.vegshark.com/gallery/');
assert.equal(config.page_referrer, 'https://example.net');
assert.equal(config.allow_google_signals, false);
assert.equal(config.allow_ad_personalization_signals, false);
assert.equal(loadAnalytics({ referrer: 'https://www.vegshark.com/projects/?private=value' }).commands[1][2].page_referrer,
  'https://www.vegshark.com/projects/');
for (const options of [{ host: 'localhost' }, { embedded: true }, { navigator: { doNotTrack: '1' } },
  { navigator: { globalPrivacyControl: true } }]) {
  const blocked = loadAnalytics(options);
  assert.equal(blocked.commands.length, 0);
  assert.equal(blocked.scripts.length, 0);
}

console.log('Website analytics deployment, event configuration, and opt-out checks passed.');
