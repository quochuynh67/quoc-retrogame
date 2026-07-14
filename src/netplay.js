// Netplay client: 2 máy chơi cùng nhau, máy vào phòng trước là player 1,
// vào sau là player 2. Hỗ trợ 3 đường truyền, tự chọn khi join:
//  - 'ws': WebSocket relay của Vite dev server (xem netplayRelay trong
//    vite.config.js) — độ trễ thấp nhất, dùng khi 2 máy cùng mạng LAN.
//  - 'public': relay broadcast "mù" bất kỳ (xem server/relay.mjs — chạy
//    local hoặc deploy free tier Render/Railway/Fly). Server chỉ phát lại
//    message cho mọi client, không hiểu nội dung, nên client tự gắn
//    room/from vào message để lọc và tự phân vai. Bật bằng cách đặt
//    VITE_PUBLIC_WS_URL (vd: ws://localhost:8787 hay wss://xxx.onrender.com).
//  - 'supabase': Supabase Realtime (broadcast + presence) — dùng cho bản
//    release trên hosting tĩnh (Firebase...), chơi được qua Internet.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// URL relay broadcast tự host; để trống thì bỏ qua transport 'public'
const PUBLIC_WS_URL = import.meta.env.VITE_PUBLIC_WS_URL || '';

// Ép chọn đường truyền: '' (tự chọn: LAN → public → supabase) | 'public' | 'supabase'
const FORCED_TRANSPORT = import.meta.env.VITE_NETPLAY_TRANSPORT || '';

// Supabase Realtime giới hạn kích thước message (~256KB), savestate thì
// vài MB nên message lớn phải cắt thành nhiều mảnh '__chunk' rồi ráp lại.
const CHUNK_SIZE = 60_000;

let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      // Mặc định client chỉ cho gửi 10 msg/s — quá ít cho relay input
      realtime: { params: { eventsPerSecond: 50 } },
    });
  }
  return supabaseClient;
}

export const NetPlay = {
  transport: '', // 'ws' | 'supabase' | '' (chưa vào phòng)
  socket: null,
  channel: null,
  clientId: '',
  joinedAt: 0,
  room: '',
  role: 0, // 1 | 2, 0 = chưa vào phòng
  peerCount: 0,
  handlers: {}, // { role, peers, input, launch, state, 'state-request', error, close }
  chunkBuffers: new Map(),

  get connected() {
    if (this.transport === 'ws' || this.transport === 'public') {
      return Boolean(this.socket) && this.socket.readyState === WebSocket.OPEN;
    }
    if (this.transport === 'supabase') {
      return Boolean(this.channel) && this.role > 0;
    }
    return false;
  },

  // Đủ 2 máy trong phòng thì input mới được relay
  get active() {
    return this.connected && this.role > 0 && this.peerCount >= 2;
  },

  async join(room) {
    this.leave();
    this.room = room;

    if (FORCED_TRANSPORT === 'supabase') return this.joinSupabase(room);
    if (FORCED_TRANSPORT === 'public') return this.joinPublic(room);

    // Ưu tiên relay LAN của Vite dev server; không có (bản release trên
    // hosting tĩnh) thì dùng relay tự host nếu cấu hình, cuối cùng là
    // Supabase Realtime. Lưu ý hosting SPA thường rewrite mọi URL về
    // index.html nên phải kiểm tra content-type JSON.
    let lanRelay = false;
    try {
      const res = await fetch('/netplay-info', { signal: AbortSignal.timeout(1500) });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) {
        const info = await res.json();
        lanRelay = Array.isArray(info.addresses);
      }
    } catch { /* không có relay LAN */ }

    if (this.room !== room) return; // đã leave/đổi phòng trong lúc dò
    if (lanRelay) this.joinWs(room);
    else if (PUBLIC_WS_URL) this.joinPublic(room);
    else this.joinSupabase(room);
  },

  joinWs(room) {
    this.transport = 'ws';
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
        this.routeMessage(msg);
      }
    });

    socket.addEventListener('close', () => {
      // Chỉ báo khi rớt kết nối ngoài ý muốn (leave() chủ động thì bỏ qua)
      if (this.socket === socket) {
        this.socket = null;
        this.transport = '';
        this.role = 0;
        this.peerCount = 0;
        this.handlers.close?.();
      }
    });

    socket.addEventListener('error', () => {
      this.handlers.error?.('Không kết nối được phòng qua LAN.');
    });
  },

  // Relay broadcast "mù" chỉ phát lại message cho mọi client, không có
  // khái niệm room/role/peers như relay Vite, nên client tự lo:
  //  - gắn 'room' vào mọi message, bên nhận lọc bỏ message khác phòng
  //  - lọc echo (server có thể gửi lại chính message của mình) bằng 'from'
  //  - phân vai qua handshake: máy mới gửi '__join', máy có vai trả '__peer',
  //    chờ 1s gom câu trả lời rồi nhận vai còn trống (trùng vai thì máy vào
  //    sau nhường — giống logic presence của Supabase)
  //  - đếm peer bằng heartbeat '__peer' định kỳ (server không báo ai rớt)
  joinPublic(room) {
    if (!PUBLIC_WS_URL) {
      this.handlers.error?.('Thiếu cấu hình relay (VITE_PUBLIC_WS_URL).');
      return;
    }
    this.transport = 'public';
    this.clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.joinedAt = Date.now();

    let socket;
    try {
      // Vẫn kèm ?room= cho server nào biết tách phòng; relay mù thì bỏ qua
      const url = new URL(PUBLIC_WS_URL);
      url.searchParams.set('room', room);
      socket = new WebSocket(url);
    } catch {
      this.transport = '';
      this.handlers.error?.(`URL relay không hợp lệ: ${PUBLIC_WS_URL}`);
      return;
    }
    this.socket = socket;

    const peers = new Map(); // clientId -> { role, ts, lastSeen }

    const sendRaw = (msg) => {
      if (this.socket !== socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ ...msg, room, from: this.clientId }));
    };

    const announce = () => {
      if (this.role > 0) sendRaw({ type: '__peer', role: this.role, ts: this.joinedAt });
    };

    const updatePeerCount = () => {
      const count = Math.min(2, peers.size + 1);
      if (count !== this.peerCount) {
        this.peerCount = count;
        this.handlers.peers?.(count);
      }
    };

    const roomFull = () => {
      this.handlers.error?.('Phòng đã đủ 2 máy, không vào thêm được.');
      this.leave();
    };

    const heartbeat = setInterval(() => {
      announce();
      let pruned = false;
      for (const [key, peer] of peers) {
        if (Date.now() - peer.lastSeen > 12_000) {
          peers.delete(key);
          pruned = true;
        }
      }
      if (pruned) updatePeerCount();
    }, 5000);

    socket.addEventListener('open', () => {
      if (this.socket !== socket) return;
      sendRaw({ type: '__join' });
      // Chờ các máy đang trong phòng trả '__peer' rồi mới nhận vai trống
      setTimeout(() => {
        if (this.socket !== socket || this.role > 0) return;
        const usedRoles = new Set([...peers.values()].map((p) => p.role));
        if (usedRoles.has(1) && usedRoles.has(2)) return roomFull();
        this.role = usedRoles.has(1) ? 2 : 1;
        this.handlers.role?.(this.role);
        announce();
        updatePeerCount();
      }, 1000);
    });

    socket.addEventListener('message', async (event) => {
      const text = typeof event.data === 'string' ? event.data : await event.data.text();
      if (this.socket !== socket) return;
      let msg;
      try { msg = JSON.parse(text); } catch { return; }
      if (!msg || typeof msg !== 'object') return;
      if (msg.from === this.clientId || msg.room !== room) return; // echo / khác phòng

      if (msg.type === '__join') {
        announce();
        return;
      }
      if (msg.type === '__peer') {
        peers.set(msg.from, { role: msg.role, ts: msg.ts, lastSeen: Date.now() });
        const loserOfConflict = this.role > 0 && msg.role === this.role
          && (msg.ts < this.joinedAt || (msg.ts === this.joinedAt && msg.from < this.clientId));
        if (loserOfConflict) {
          const freeRole = this.role === 1 ? 2 : 1;
          if ([...peers.values()].some((p) => p.role === freeRole)) return roomFull();
          this.role = freeRole;
          this.handlers.role?.(this.role);
          announce();
        }
        updatePeerCount();
        return;
      }
      if (msg.type === '__leave') {
        peers.delete(msg.from);
        updatePeerCount();
        return;
      }
      this.routeMessage(msg);
    });

    socket.addEventListener('close', () => {
      clearInterval(heartbeat);
      // Chỉ báo khi rớt kết nối ngoài ý muốn (leave() chủ động thì bỏ qua)
      if (this.socket === socket) {
        this.socket = null;
        this.transport = '';
        this.role = 0;
        this.peerCount = 0;
        this.handlers.close?.();
      }
    });

    socket.addEventListener('error', () => {
      this.handlers.error?.(`Không kết nối được relay ${PUBLIC_WS_URL} — kiểm tra server/mạng.`);
    });
  },

  joinSupabase(room) {
    const client = getSupabase();
    if (!client) {
      this.handlers.error?.('Thiếu cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
      return;
    }

    this.transport = 'supabase';
    this.clientId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    this.joinedAt = Date.now();
    let claimed = false;

    const channel = client.channel(`netplay-${room}`, {
      config: { broadcast: { self: false }, presence: { key: this.clientId } },
    });
    this.channel = channel;

    channel.on('broadcast', { event: 'msg' }, ({ payload }) => this.routeMessage(payload));

    // Phân vai bằng presence: mỗi máy công bố vai của mình; máy mới vào
    // nhận vai còn trống. Nếu 2 máy vào cùng lúc claim trùng vai thì máy
    // vào sau (ts lớn hơn) nhường.
    channel.on('presence', { event: 'sync' }, () => {
      if (this.channel !== channel) return;
      const state = channel.presenceState();
      const others = Object.entries(state)
        .filter(([key]) => key !== this.clientId)
        .map(([key, metas]) => ({ key, ...(metas[0] || {}) }));

      if (!claimed) {
        claimed = true;
        const usedRoles = new Set(others.map((o) => o.role));
        if (usedRoles.has(1) && usedRoles.has(2)) {
          this.handlers.error?.('Phòng đã đủ 2 máy, không vào thêm được.');
          this.leave();
          return;
        }
        this.role = usedRoles.has(1) ? 2 : 1;
        channel.track({ role: this.role, ts: this.joinedAt });
        this.handlers.role?.(this.role);
      } else {
        const loserOfConflict = others.some((o) => o.role === this.role
          && (o.ts < this.joinedAt || (o.ts === this.joinedAt && o.key < this.clientId)));
        if (loserOfConflict) {
          const freeRole = this.role === 1 ? 2 : 1;
          if (others.some((o) => o.role === freeRole)) {
            this.handlers.error?.('Phòng đã đủ 2 máy, không vào thêm được.');
            this.leave();
            return;
          }
          this.role = freeRole;
          channel.track({ role: this.role, ts: this.joinedAt });
          this.handlers.role?.(this.role);
        }
      }

      const count = Math.min(2, others.length + 1);
      if (count !== this.peerCount) {
        this.peerCount = count;
        this.handlers.peers?.(count);
      }
    });

    channel.subscribe((status) => {
      if (this.channel !== channel) return;
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.handlers.error?.('Không kết nối được Supabase Realtime — kiểm tra mạng/cấu hình.');
      } else if (status === 'CLOSED') {
        this.channel = null;
        this.transport = '';
        this.role = 0;
        this.peerCount = 0;
        this.handlers.close?.();
      }
    });
  },

  // Message app (input, launch, state...) + ráp các mảnh '__chunk'
  routeMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === '__chunk') {
      let buf = this.chunkBuffers.get(msg.id);
      if (!buf) {
        buf = { parts: new Array(msg.total), got: 0 };
        this.chunkBuffers.set(msg.id, buf);
      }
      if (buf.parts[msg.seq] === undefined) {
        buf.parts[msg.seq] = msg.part;
        buf.got += 1;
      }
      if (buf.got === msg.total) {
        this.chunkBuffers.delete(msg.id);
        try { this.routeMessage(JSON.parse(buf.parts.join(''))); } catch { /* mảnh hỏng */ }
      }
      return;
    }
    this.handlers[msg.type]?.(msg);
  },

  async send(msg) {
    if (this.transport === 'ws') {
      if (this.connected) this.socket.send(JSON.stringify(msg));
      return;
    }
    if (this.transport === 'public') {
      if (!this.connected) return;
      // Relay mù nên message phải kèm 'room' + 'from' để bên nhận lọc;
      // message lớn (savestate) cắt thành mảnh nhỏ cho đỡ nghẽn socket
      const raw = JSON.stringify(msg);
      if (raw.length <= CHUNK_SIZE) {
        this.socket.send(JSON.stringify({ ...msg, room: this.room, from: this.clientId }));
        return;
      }
      const id = `${this.clientId}-${Date.now().toString(36)}`;
      const total = Math.ceil(raw.length / CHUNK_SIZE);
      for (let seq = 0; seq < total; seq += 1) {
        if (!this.connected) return; // đã rời phòng giữa chừng
        this.socket.send(JSON.stringify({
          type: '__chunk', room: this.room, from: this.clientId,
          id, seq, total, part: raw.slice(seq * CHUNK_SIZE, (seq + 1) * CHUNK_SIZE),
        }));
        await new Promise((resolve) => setTimeout(resolve, 15)); // tránh nghẽn/drop
      }
      return;
    }
    if (this.transport !== 'supabase' || !this.channel) return;

    const raw = JSON.stringify(msg);
    if (raw.length <= CHUNK_SIZE) {
      this.channel.send({ type: 'broadcast', event: 'msg', payload: msg });
      return;
    }
    const id = `${this.clientId}-${Date.now().toString(36)}`;
    const total = Math.ceil(raw.length / CHUNK_SIZE);
    for (let seq = 0; seq < total; seq += 1) {
      if (this.channel === null) return; // đã rời phòng giữa chừng
      await this.channel.send({
        type: 'broadcast',
        event: 'msg',
        payload: { type: '__chunk', id, seq, total, part: raw.slice(seq * CHUNK_SIZE, (seq + 1) * CHUNK_SIZE) },
      });
      await new Promise((resolve) => setTimeout(resolve, 30)); // tránh rate limit
    }
  },

  // Gửi thao tác bấm/nhả nút của người chơi local cho máy kia
  sendInput(method, button) {
    if (this.active) this.send({ type: 'input', method, button, player: this.role });
  },

  leave() {
    const socket = this.socket;
    const channel = this.channel;
    // Relay mù không báo peer rớt, nên chủ động chào tạm biệt trước khi đóng
    if (this.transport === 'public' && socket?.readyState === WebSocket.OPEN) {
      try { socket.send(JSON.stringify({ type: '__leave', room: this.room, from: this.clientId })); } catch { /* đóng luôn */ }
    }
    this.socket = null;
    this.channel = null;
    this.transport = '';
    this.room = '';
    this.role = 0;
    this.peerCount = 0;
    this.chunkBuffers.clear();
    socket?.close();
    if (channel) {
      channel.untrack?.();
      getSupabase()?.removeChannel(channel);
    }
  },
};
