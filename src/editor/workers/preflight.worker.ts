import { runFullPreflightScan } from '../publishing/preflightEngine';
self.onmessage = (event) => {
  if (event.data.type === "warm") { self.postMessage({ ready: true }); return; }
  try { self.postMessage({ report: runFullPreflightScan(event.data.book, event.data.elements) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Preflight failed' }); }
};
