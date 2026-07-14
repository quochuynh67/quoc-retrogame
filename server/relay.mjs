// Relay broadcast "mù" cho netplay (transport 'public' trong src/netplay.js):
// nhận message từ 1 client rồi phát lại cho mọi client khác, không hiểu nội
// dung — client tự gắn room/from vào message để lọc phòng và phân vai.
//
// Chạy local:   npm run relay        (ws://localhost:8787)
// Rồi chạy app: VITE_PUBLIC_WS_URL=ws://localhost:8787 npm run dev
//
// Deploy free tier (Render/Railway/Fly): trỏ vào file này, host sẽ set PORT.
// Lưu ý: package 'ws' đang ở devDependencies — host nào cài production-only
// (NODE_ENV=production) thì chuyển 'ws' sang dependencies.
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

const port = Number(process.env.PORT || 8787);

// Trả HTTP 200 cho health check của PaaS (Render ping / để biết app sống)
const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('netplay relay ok\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  socket.on('message', (data, isBinary) => {
    for (const client of wss.clients) {
      if (client !== socket && client.readyState === client.OPEN) {
        client.send(data, { binary: isBinary });
      }
    }
  });
  socket.on('error', () => {}); // client rớt đột ngột thì kệ, đừng crash server
});

server.listen(port, () => {
  console.log(`netplay relay chạy tại ws://localhost:${port} (${wss.clients.size} client)`);
});
