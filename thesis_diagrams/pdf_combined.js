const { spawn } = require('child_process');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIR    = __dirname;
const IN_HTML = path.join(DIR, 'use_case_combined.html');
const OUT_PDF = path.join(DIR, 'use_case_combined.pdf');

// Serve the HTML on a local port so Chrome can load it with network access
const html = fs.readFileSync(IN_HTML, 'utf8');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(9600, '127.0.0.1', () => {
  console.log('Serving on http://127.0.0.1:9600');
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    `--print-to-pdf=${OUT_PDF}`,
    '--no-pdf-header-footer',
    '--virtual-time-budget=5000',
    'http://127.0.0.1:9600/',
  ];
  const chrome = spawn(`"${CHROME}"`, args, { shell: true, stdio: 'pipe' });
  let stderr = '';
  chrome.stderr.on('data', d => { stderr += d.toString(); });
  chrome.on('close', code => {
    server.close();
    if (fs.existsSync(OUT_PDF)) {
      console.log(`\n✓ PDF saved: ${OUT_PDF}`);
    } else {
      console.error(`✗ Failed (exit ${code}): ${stderr.slice(-300)}`);
    }
  });
  setTimeout(() => { chrome.kill(); server.close(); }, 25000);
});
