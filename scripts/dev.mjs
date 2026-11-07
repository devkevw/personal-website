import { watch } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const execute = promisify(execFile);
async function build() {
  // A fresh process picks up edited templates, avoiding ESM's import cache.
  const { stdout } = await execute(process.execPath, [path.join(root, 'scripts/build.mjs')]);
  process.stdout.write(stdout);
}
await build();
serve();
let timer;
let building = false;
let queued = false;
async function rebuild() {
  if (building) { queued = true; return; }
  building = true;
  try { await build(); console.log('Updated. Refresh the browser to see changes.'); }
  catch (error) { console.error(error); }
  finally { building = false; if (queued) { queued = false; await rebuild(); } }
}
for (const folder of ['src', 'images']) watch(path.join(root, folder), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 150);
});
