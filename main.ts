// Leonida Trophy Atlas — hand-in program for gta6-trophy-guide-01 (Node 22, stdlib only).
//
// The entry is plain static files: app/index.html + app/app.js + app/style.css +
// app/data/trophies.json (all 55 official trophies with guides in our own words).
// No build step, no network at runtime. This program copies app/ and screenshots/
// from beside this file into /output (or MAKEFUN_OUTPUT_DIR outside the grader)
// and writes /output/dossier.json with the kit's vendored library —
// vendor/makefun-frontend.ts is the scorer's own copy, left byte-for-byte as shipped.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//   node cli/makefun.mjs check --repo . --json   (from the kit directory)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Gate caps (reference/gate.json): 4 screenshots max, 256 KiB each; app/ at most
// 993 files/dirs and 48 MiB; dossier text at most 163,840 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
