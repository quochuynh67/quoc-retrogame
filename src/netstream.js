// Netplay stream (WebRTC): host (player 1) là máy DUY NHẤT chạy giả lập,
// stream hình + tiếng cho máy 2 xem và nhận phím bấm của máy 2 gửi về qua
// data channel. Không còn 2 giả lập chạy song song nên không còn cảnh máy 2
// bị "tua lại" mỗi lần nạp savestate như cách đồng bộ state cũ.
//
// Signaling (trao đổi SDP/ICE lúc bắt tay) đi qua đường relay sẵn có của
// NetPlay (LAN/relay tự host/Supabase) — chỉ vài message lúc đầu, sau đó
// video/input chạy P2P trực tiếp. Chỉ dùng STUN (không TURN) nên mạng NAT
// quá chặt có thể không nối được → máy 2 tự xin quay về cách cũ (tải game
// về + đồng bộ savestate) qua handlers.viewFailed.
import { NetPlay } from './netplay.js';

const RTC_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// RetroArch wasm phát tiếng qua Web Audio, không có API lấy luồng ra, nên
// chặn AudioNode.connect: node nào nối vào loa (destination) thì nối thêm
// một nhánh vào MediaStreamDestination để lấy track audio đem stream.
// Phải cài từ lúc nạp module — trước khi giả lập được khởi động.
const audioTaps = new Map(); // AudioContext -> MediaStreamAudioDestinationNode
let restartForAudioTimer = 0;
if (typeof AudioNode === 'function' && typeof AudioContext === 'function') {
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function connectWithTap(target, ...rest) {
    try {
      if (typeof AudioDestinationNode === 'function' && target instanceof AudioDestinationNode) {
        let tap = audioTaps.get(this.context);
        if (!tap) {
          tap = this.context.createMediaStreamDestination();
          audioTaps.set(this.context, tap);
          // Giả lập thường nối audio SAU khi host đã mở stream (startHost chạy
          // ngay khi launch xong, RetroArch khởi động tiếng muộn hơn) → stream
          // đang chạy mà thiếu track audio thì mở lại để máy 2 có tiếng.
          if (NetStream.mode === 'host' && NetStream.lastCanvas) {
            clearTimeout(restartForAudioTimer);
            restartForAudioTimer = setTimeout(() => {
              if (NetStream.mode === 'host') NetStream.startHost(NetStream.lastCanvas);
            }, 500);
          }
        }
        origConnect.call(this, tap);
      }
    } catch { /* tap hỏng thì thôi — tiếng vẫn phát bình thường, chỉ stream câm */ }
    return origConnect.call(this, target, ...rest);
  };
}

export const NetStream = {
  supported: typeof RTCPeerConnection === 'function'
    && typeof HTMLCanvasElement !== 'undefined'
    && typeof HTMLCanvasElement.prototype.captureStream === 'function',
  mode: '', // 'host' | 'view' | '' (không stream)
  lastCanvas: null, // canvas đang stream — để mở lại stream khi audio tới muộn
  pc: null,
  channel: null,
  pendingIce: [],
  answerTimer: 0,
  connectTimer: 0,
  handlers: {}, // { stream(MediaStream|null), input(msg), viewFailed(), hostNoAnswer() }

  closePc() {
    clearTimeout(this.answerTimer);
    clearTimeout(this.connectTimer);
    this.pendingIce = [];
    try { this.channel?.close(); } catch { /* đã đóng */ }
    try { this.pc?.close(); } catch { /* đã đóng */ }
    this.channel = null;
    this.pc = null;
  },

  // notifyPeer: báo máy kia dọn màn hình stream (khi mình chủ động dừng)
  stop(notifyPeer = false) {
    const hadMode = this.mode;
    this.mode = '';
    this.closePc();
    if (notifyPeer && hadMode && NetPlay.connected) NetPlay.send({ type: 'rtc-stop' });
    if (hadMode === 'view') this.handlers.stream?.(null);
  },

  async flushPendingIce() {
    if (!this.pc?.remoteDescription) return;
    const queued = this.pendingIce;
    this.pendingIce = [];
    for (const candidate of queued) {
      try { await this.pc.addIceCandidate(candidate); } catch { /* candidate hỏng, bỏ */ }
    }
  },

  // Host: bắt hình từ canvas giả lập + tiếng từ audio tap rồi mời máy 2.
  // LƯU Ý: Nostalgist thay canvas #game bằng canvas riêng khi launch, nên
  // caller phải truyền canvas thật (emulator.getCanvas()) vào đây.
  async startHost(canvas) {
    if (!this.supported || !NetPlay.active || NetPlay.role !== 1) return;
    this.stop(true);

    canvas = canvas || document.querySelector('.screen-shell canvas') || document.getElementById('game');
    if (!canvas || typeof canvas.captureStream !== 'function') return;

    this.mode = 'host';
    this.lastCanvas = canvas;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    try {
      const media = canvas.captureStream(60);
      for (const [ctx, tap] of audioTaps) {
        if (ctx.state === 'closed') { audioTaps.delete(ctx); continue; }
        for (const track of tap.stream.getAudioTracks()) media.addTrack(track);
      }
      // Hình pixel art mà để encoder tự lo sẽ RẤT mờ: mặc định WebRTC ưu tiên
      // giữ fps nên thiếu băng thông là nó hạ độ phân giải, và bitrate trần
      // mặc định (~2.5Mbps) quá thấp cho nét pixel. Ép giữ nguyên resolution
      // + nâng trần bitrate, báo encoder đây là hình cần chi tiết.
      for (const track of media.getVideoTracks()) {
        track.contentHint = 'detail'; // Chrome coi như screencast → tự ưu tiên giữ resolution
        const { sender } = pc.addTransceiver(track, {
          direction: 'sendonly',
          streams: [media],
          sendEncodings: [{ maxBitrate: 8_000_000, scaleResolutionDownBy: 1 }],
        });
        try {
          const params = sender.getParameters();
          params.degradationPreference = 'maintain-resolution';
          await sender.setParameters(params);
        } catch { /* browser không hỗ trợ — đã có contentHint đỡ */ }
      }
      for (const track of media.getAudioTracks()) pc.addTrack(track, media);
    } catch {
      this.stop();
      return;
    }

    const channel = pc.createDataChannel('input', { ordered: true });
    this.channel = channel;
    channel.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      this.handlers.input?.(msg);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && this.pc === pc) {
        NetPlay.send({ type: 'rtc-ice', candidate: event.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (this.pc === pc && pc.connectionState === 'failed') this.stop();
    };

    try {
      const offer = await pc.createOffer();
      if (this.pc !== pc) return;
      await pc.setLocalDescription(offer);
      NetPlay.send({ type: 'rtc-offer', sdp: pc.localDescription.sdp });
    } catch {
      if (this.pc === pc) this.stop();
      return;
    }

    // Máy 2 chạy bản app cũ sẽ không biết trả lời offer → host quay về
    // cách cũ (gửi 'launch' cho máy 2 tự tải) qua handlers.hostNoAnswer
    this.answerTimer = setTimeout(() => {
      if (this.pc === pc && !pc.currentRemoteDescription) {
        this.stop();
        this.handlers.hostNoAnswer?.();
      }
    }, 5000);
  },

  // Máy 2: nhận offer của host, trả answer, chờ hình đổ về
  async acceptOffer(sdp) {
    if (!this.supported || NetPlay.role !== 2 || !sdp) return;
    this.stop();

    this.mode = 'view';
    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.pc = pc;

    pc.ontrack = (event) => {
      if (this.pc !== pc) return;
      this.handlers.stream?.(event.streams[0] || new MediaStream([event.track]));
    };
    pc.ondatachannel = (event) => {
      if (this.pc === pc) this.channel = event.channel;
    };
    pc.onicecandidate = (event) => {
      if (event.candidate && this.pc === pc) {
        NetPlay.send({ type: 'rtc-ice', candidate: event.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (this.pc !== pc) return;
      if (pc.connectionState === 'connected') clearTimeout(this.connectTimer);
      if (pc.connectionState === 'failed') {
        this.stop();
        this.handlers.viewFailed?.();
      }
    };

    // NAT chặt không STUN nổi thì đừng để máy 2 nhìn màn hình đen mãi
    this.connectTimer = setTimeout(() => {
      if (this.pc === pc && pc.connectionState !== 'connected') {
        this.stop();
        this.handlers.viewFailed?.();
      }
    }, 15_000);

    try {
      await pc.setRemoteDescription({ type: 'offer', sdp });
      await this.flushPendingIce();
      const answer = await pc.createAnswer();
      if (this.pc !== pc) return;
      await pc.setLocalDescription(answer);
      NetPlay.send({ type: 'rtc-answer', sdp: pc.localDescription.sdp });
    } catch {
      if (this.pc === pc) {
        this.stop();
        this.handlers.viewFailed?.();
      }
    }
  },

  // Gửi input qua data channel (nhanh hơn relay); false = chưa nối, caller
  // tự fallback sang NetPlay.sendInput
  sendInput(msg) {
    if (this.channel?.readyState === 'open') {
      try {
        this.channel.send(JSON.stringify(msg));
        return true;
      } catch { /* channel vừa đứt, rơi xuống relay */ }
    }
    return false;
  },
};

// Signaling đi chung đường message của NetPlay
NetPlay.handlers['rtc-offer'] = ({ sdp }) => { NetStream.acceptOffer(sdp); };

NetPlay.handlers['rtc-answer'] = async ({ sdp }) => {
  const pc = NetStream.pc;
  if (NetStream.mode !== 'host' || !pc || !sdp) return;
  try {
    await pc.setRemoteDescription({ type: 'answer', sdp });
    await NetStream.flushPendingIce();
  } catch {
    if (NetStream.pc === pc) NetStream.stop();
  }
};

NetPlay.handlers['rtc-ice'] = async ({ candidate }) => {
  if (!NetStream.pc || !candidate) return;
  // ICE có thể tới trước offer/answer (relay không đảm bảo thứ tự) → xếp hàng
  if (!NetStream.pc.remoteDescription) {
    NetStream.pendingIce.push(candidate);
    return;
  }
  try { await NetStream.pc.addIceCandidate(candidate); } catch { /* candidate hỏng, bỏ */ }
};

NetPlay.handlers['rtc-stop'] = () => {
  // Máy kia chủ động dừng (host đóng game / máy 2 thoát màn hình xem)
  if (NetStream.mode) NetStream.stop();
};
