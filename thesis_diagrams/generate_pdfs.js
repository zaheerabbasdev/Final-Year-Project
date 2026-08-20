/**
 * generate_pdfs.js
 * Uses system Chrome (headless) to render mermaid HTML files and save as PDF.
 * Run: node generate_pdfs.js
 */
const { execSync, spawn } = require('child_process');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR    = __dirname;

// ── Diagram definitions ──────────────────────────────────────────────────────
const diagrams = [
  {
    title:    'FIGURE 3.1 — Kaarkun System Architecture Diagram',
    mmdFile:  '01_system_architecture.mmd',
    outPDF:   '01_system_architecture.pdf',
    landscape: true,
  },
  {
    title:    'FIGURE 3.3 — Use Case Diagram: Customer Actor',
    mmdFile:  '02_use_case_customer.mmd',
    outPDF:   '02_use_case_customer.pdf',
    landscape: true,
  },
  {
    title:    'FIGURE 3.4 — Use Case Diagram: Service Provider Actor',
    mmdFile:  '03_use_case_provider.mmd',
    outPDF:   '03_use_case_provider.pdf',
    landscape: true,
  },
];

// ── Inline mermaid.min.js (download once) ────────────────────────────────────
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
const MERMAID_LOCAL = path.join(DIR, '_mermaid.min.js');

function downloadMermaid() {
  if (fs.existsSync(MERMAID_LOCAL)) {
    console.log('mermaid.min.js already cached');
    return;
  }
  console.log('Downloading mermaid.min.js …');
  execSync(
    `node -e "const h=require('https'),f=require('fs');` +
    `h.get('${MERMAID_CDN}',r=>{const s=f.createWriteStream('${MERMAID_LOCAL.replace(/\\/g,'/')}');r.pipe(s);s.on('finish',()=>process.exit(0));});"`,
    { stdio: 'inherit', timeout: 30000 }
  );
  console.log('Downloaded mermaid.min.js');
}

// ── Build HTML for a diagram ─────────────────────────────────────────────────
function buildHtml(title, mmdContent, landscape) {
  const mermaidJs = fs.readFileSync(MERMAID_LOCAL, 'utf8');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: ${landscape ? 'A4 landscape' : 'A4 portrait'}; margin: 15mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: #fff;
    color: #111;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 13pt;
    font-weight: 700;
    text-align: center;
    margin: 0 0 16px 0;
    letter-spacing: 0.03em;
    border-bottom: 2px solid #1a3a6b;
    padding-bottom: 8px;
    color: #1a3a6b;
  }
  #diagram {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    overflow: visible;
  }
  #diagram svg {
    max-width: 100%;
    height: auto;
  }
</style>
</head>
<body>
<h1>${title}</h1>
<div id="diagram">
  <pre class="mermaid">
${mmdContent}
  </pre>
</div>
<script>
${mermaidJs}
</script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    flowchart: { useMaxWidth: true, htmlLabels: true },
    securityLevel: 'loose',
  });
  // Signal Chrome that rendering is done
  mermaid.init(undefined, '.mermaid').then(() => {
    document.title = 'READY:' + document.title;
    window._mermaidDone = true;
  });
</script>
</body>
</html>`;
}

// ── Start a local HTTP server ─────────────────────────────────────────────────
function serve(htmlContent, port) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlContent);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// ── Use Chrome headless to print the page to PDF ─────────────────────────────
async function printToPDF(url, outPath, landscape) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--run-all-compositor-stages-before-draw',
      `--print-to-pdf=${outPath}`,
      '--no-pdf-header-footer',
      `--print-to-pdf-no-header`,
      landscape ? '--print-to-pdf-paper-size=a4-landscape' : '--print-to-pdf-paper-size=a4',
      '--virtual-time-budget=8000',
      url,
    ];
    const chrome = spawn(`"${CHROME}"`, args, { shell: true, stdio: 'pipe' });
    let stderr = '';
    chrome.stderr.on('data', d => { stderr += d.toString(); });
    chrome.on('close', code => {
      if (fs.existsSync(outPath)) { resolve(); }
      else { reject(new Error(`Chrome exit ${code}: ${stderr.slice(-300)}`)); }
    });
    setTimeout(() => {
      chrome.kill();
      if (fs.existsSync(outPath)) resolve();
      else reject(new Error('timeout'));
    }, 20000);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  downloadMermaid();

  for (let i = 0; i < diagrams.length; i++) {
    const d = diagrams[i];
    const mmdContent = fs.readFileSync(path.join(DIR, d.mmdFile), 'utf8');
    const html       = buildHtml(d.title, mmdContent, d.landscape);
    const outPath    = path.join(DIR, d.outPDF);
    const port       = 9500 + i;

    console.log(`\n[${i+1}/${diagrams.length}] Generating: ${d.outPDF}`);
    const server = await serve(html, port);
    const url    = `http://127.0.0.1:${port}/`;

    try {
      await printToPDF(url, outPath, d.landscape);
      console.log(`  ✓ Saved: ${outPath}`);
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    } finally {
      server.close();
    }
  }

  console.log('\nAll done.');
})();
