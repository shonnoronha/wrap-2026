// Packs the static demo build (dist/) into one HTML fragment: CSS and JS inline.
// Usage: node scripts/make-artifact.mjs <out.html>
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const out = process.argv[2] || 'dist/safarnama-demo.html';
const files = readdirSync('dist/assets');
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`dist/assets/${f}`, 'utf8')).join('\n');
const jsFiles = files.filter((f) => f.endsWith('.js'));
if (jsFiles.length !== 1) throw new Error(`Expected one JS bundle, found ${jsFiles.length}`);
const js = readFileSync(`dist/assets/${jsFiles[0]}`, 'utf8').replace(/<\/script/gi, '<\\/script');

const html = `<title>Safarnama 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
writeFileSync(out, html);
console.log(`Wrote ${out} (${Math.round(html.length / 1024)} KB)`);
