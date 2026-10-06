const http = require('http');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/' || parsed.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EXP00 Web Target</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; max-width: 650px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; margin-top: 0; }
    code { background: #090d16; color: #4ade80; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
    .badge { display: inline-block; background: #0284c7; color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; }
    button { background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 1rem; }
    button:hover { background: #2563eb; }
    pre { background: #020617; padding: 1rem; border-radius: 8px; overflow-x: auto; color: #a7f3d0; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">EXP00-demo Target</span>
    <h1>Virtual Lab Demo Target</h1>
    <p>Target web server is <strong>HEALTHY</strong> and running inside the isolated lab network.</p>
    <hr style="border-color: #334155; margin: 1.5rem 0;">
    <h3>Available Endpoints for Testing:</h3>
    <ul>
      <li><code>GET /api/status</code> — System health check JSON</li>
      <li><code>GET /api/search?q=test</code> — Reflective parameter echo test</li>
      <li><code>GET /api/stress</code> — Triggers simulated CPU/Memory stress metric output</li>
    </ul>
    <button onclick="fetch('/api/status').then(r=>r.json()).then(d=>document.getElementById('out').innerText=JSON.stringify(d,null,2))">Test Status API</button>
    <button onclick="fetch('/api/stress').then(r=>r.json()).then(d=>document.getElementById('out').innerText=JSON.stringify(d,null,2))">Simulate Server Load</button>
    <pre id="out">Click a button above to test endpoints…</pre>
  </div>
</body>
</html>
    `);
    return;
  }

  if (parsed.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'target', uptime: process.uptime(), timestamp: new Date().toISOString() }));
    return;
  }

  if (parsed.pathname === '/api/search') {
    const q = parsed.query.q || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ query: q, results: [`Sample result matching: ${q}`] }));
    return;
  }

  if (parsed.pathname === '/api/stress') {
    const cpuVal = Math.floor(75 + Math.random() * 20);
    const memVal = Math.floor(60 + Math.random() * 25);
    const rpsVal = Math.floor(800 + Math.random() * 400);

    // Emit VLAB_METRIC string in standard stdout for metrics scanner
    console.log(`VLAB_METRIC {"cpu":${cpuVal},"memoryPct":${memVal},"rps":${rpsVal}}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Simulated load spike generated!', metrics: { cpu: cpuVal, memoryPct: memVal, rps: rpsVal } }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Target web server listening on port ${PORT}`);
});
