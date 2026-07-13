// Netplay client: 2 máy chơi cùng qua LAN, relay tín hiệu qua WebSocket
// /netplay của Vite dev server (xem netplayRelay trong vite.config.js).
// Máy vào phòng trước là player 1, vào sau là player 2.
export const NetPlay = {
  socket: null,
  room: '',
  role: 0, // 1 | 2, 0 = chưa vào phòng
  peerCount: 0,
  handlers: {}, // { role, peers, input, launch, error, close }

  get connected() {
    return Boolean(this.socket) && this.socket.readyState === WebSocket.OPEN;
  },

  // Đủ 2 máy trong phòng thì input mới được relay
  get active() {
    return this.connected && this.role > 0 && this.peerCount >= 2;
  },

  join(room) {
    this.leave();
    this.room = room;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${proto}://${location.host}/netplay?room=${encodeURIComponent(room)}`);
    this.socket = socket;

    socket.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      if (msg.type === 'role') {
        this.role = msg.role;
        this.peerCount = msg.peers;
        this.handlers.role?.(msg.role);
      } else if (msg.type === 'peers') {
        this.peerCount = msg.count;
        this.handlers.peers?.(msg.count);
      } else if (msg.type === 'full') {
        this.handlers.error?.('Phòng đã đủ 2 máy, không vào thêm được.');
      } else {
        // Các message app tự định nghĩa (input, launch, state-request, state...)
        this.handlers[msg.type]?.(msg);
      }
    });

    socket.addEventListener('close', () => {
      // Chỉ báo khi rớt kết nối ngoài ý muốn (leave() chủ động thì bỏ qua)
      if (this.socket === socket) {
        this.socket = null;
        this.role = 0;
        this.peerCount = 0;
        this.handlers.close?.();
      }
    });

    socket.addEventListener('error', () => {
      this.handlers.error?.('Không kết nối được phòng. Máy này phải mở web qua server của máy chủ phòng (vd http://192.168.x.x:5173).');
    });
  },

  leave() {
    const socket = this.socket;
    this.socket = null;
    this.room = '';
    this.role = 0;
    this.peerCount = 0;
    socket?.close();
  },

  send(msg) {
    if (this.connected) this.socket.send(JSON.stringify(msg));
  },

  // Gửi thao tác bấm/nhả nút của người chơi local cho máy kia
  sendInput(method, button) {
    if (this.active) this.send({ type: 'input', method, button, player: this.role });
  },
};
