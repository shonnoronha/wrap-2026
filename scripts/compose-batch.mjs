// Batch job: compose every user's wrap once and store it. The API then only
// reads these files. In production this runs over the pipeline table before
// launch and writes to the wrap store instead of the local disk.
//
//   node scripts/compose-batch.mjs            writes server/data/wraps/<userId>.json
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PROFILES, ROWS } from '../server/data/rows.mjs';
import { composeBatch } from '../server/wrap/compose.mjs';

const OUT = fileURLToPath(new URL('../server/data/wraps/', import.meta.url));

const entries = Object.keys(ROWS).map((id) => ({ userId: Number(id), row: ROWS[id], profile: PROFILES[id] }));
const out = composeBatch(entries);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const [userId, doc] of Object.entries(out)) {
  await writeFile(`${OUT}${userId}.json`, JSON.stringify(doc, null, 2));
  console.log(`user ${String(userId).padEnd(4)} ${doc.wrap.pages.length} pages  fingerprint ${doc.meta.deckFingerprint}`);
}
console.log(`Stored ${entries.length} wraps in server/data/wraps/`);
