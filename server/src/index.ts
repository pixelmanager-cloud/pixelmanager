// Placeholder for the authoritative game server.
// Multiplayer plan: the MatchEngine from @fm/shared runs HERE with a server-chosen
// seed; clients receive the seed + team data and replay the identical deterministic
// sim locally for rendering. Server owns leagues, squads, transfers, results.
import { createServer } from 'node:http';

const server = createServer((_req, res) => {
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ ok: true, service: 'fm-server', version: '0.1.0' }));
});

server.listen(8787, () => console.log('fm-server listening on :8787'));
