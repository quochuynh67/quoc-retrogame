import './style.css';
import { Nostalgist } from 'nostalgist';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="header">
    <h1>Hệ Thống Arcade Cổ Điển</h1>
    <p>Chơi game giả lập ngay trên trình duyệt với giao diện Retro</p>
  </header>

  <main class="main-content">
    <section class="game-area">
      <div class="screen-shell">
        <canvas id="game"></canvas>
      </div>
      <div class="controls-bar">
        <button id="launchBtn" class="primary">Tải Game</button>
        <button id="pauseBtn" disabled>Tạm Dừng</button>
        <button id="resumeBtn" disabled>Tiếp Tục</button>
        <button id="exitBtn" disabled>Thoát</button>
      </div>

      <!-- VIRTUAL GAMEPAD -->
      <div class="virtual-gamepad">
        <div class="joystick-base" id="joystickBase">
          <div class="joystick-knob" id="joystickKnob"></div>
        </div>
        
        <div class="system-buttons">
          <div class="sys-btn" data-key="Shift">Nạp xu</div>
          <div class="sys-btn" data-key="Enter">Bắt đầu</div>
        </div>

        <div class="action-buttons">
          <div class="action-btn btn-x" data-key="s">X</div>
          <div class="action-btn btn-y" data-key="a">Y</div>
          <div class="action-btn btn-a" data-key="x">A</div>
          <div class="action-btn btn-b" data-key="z">B</div>
        </div>
      </div>
    </section>

    <aside class="sidebar">
      <div class="stack">
        <label class="label">Trạng Thái</label>
        <span id="status" class="status">Đang chờ...</span>
      </div>

      <div class="stack">
        <label class="label" for="romUrl">Đường Dẫn ROM (URL)</label>
        <textarea id="romUrl" class="input" rows="3">https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wof.zip</textarea>
        <p class="hint">
          Hỗ trợ tải nhiều ROM (vd: Parent ROM, BIOS). Mỗi URL một dòng. Hỗ trợ CORS là bắt buộc.
        </p>
      </div>

      <div class="stack">
        <label class="label" for="coreName">Trình Giả Lập (Core)</label>
        <select id="coreName" class="input">
          <option value="fbneo">fbneo (FinalBurn Neo)</option>
          <option value="fbalpha2012_cps1">fbalpha2012_cps1 (Arcade)</option>
          <option value="fbalpha2012">fbalpha2012 (Arcade)</option>
          <option value="mame2003_plus">mame2003_plus (Arcade)</option>
          <option value="fceumm">fceumm (NES)</option>
          <option value="snes9x">snes9x (SNES)</option>
        </select>
        <p class="hint">
          Lựa chọn core phù hợp với hệ máy của ROM. Đối với game Arcade, ROM set phải khớp với phiên bản core.
        </p>
      </div>

      <div class="stack">
        <label class="label">Nhật Ký (Log)</label>
        <pre id="log" class="log">Sẵn sàng.</pre>
      </div>
    </aside>
  </main>
`;

const gameEl = document.querySelector('#game');
const statusEl = document.querySelector('#status');
const logEl = document.querySelector('#log');
const romUrlEl = document.querySelector('#romUrl');
const coreNameEl = document.querySelector('#coreName');
const launchBtn = document.querySelector('#launchBtn');
const pauseBtn = document.querySelector('#pauseBtn');
const resumeBtn = document.querySelector('#resumeBtn');
const exitBtn = document.querySelector('#exitBtn');

let emulator = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function setLog(message) {
  logEl.textContent = message;
  logEl.scrollTop = logEl.scrollHeight;
}

function setControlState(running) {
  pauseBtn.disabled = !running;
  resumeBtn.disabled = !running;
  exitBtn.disabled = !running;
  if (running) {
    document.body.classList.add('playing');
  } else {
    document.body.classList.remove('playing');
  }
}

async function destroyRunningGame() {
  if (!emulator) return;

  try {
    await emulator.exit();
  } catch (error) {
    console.warn('Lỗi khi thoát:', error);
  }

  emulator = null;
  gameEl.innerHTML = '';
  setControlState(false);
  setStatus('Đang chờ...');
}

async function launchGame() {
  const romUrlRaw = romUrlEl.value.trim();
  const core = coreNameEl.value;

  if (!romUrlRaw) {
    setStatus('Thiếu ROM');
    setLog('Bạn cần nhập đường dẫn ROM trước khi tải game.');
    return;
  }

  const romUrls = romUrlRaw.split('\n').map(u => u.trim()).filter(u => u);
  const rom = romUrls.length === 1 ? romUrls[0] : romUrls;

  launchBtn.disabled = true;
  setStatus('Đang tải...');
  setLog([
    'Đang khởi động game...',
    `Core: ${core}`,
    `ROM: ${romUrlRaw}`,
    '',
    'Lưu ý nếu gặp lỗi:',
    '- File ROM phải truy cập được (Public).',
    '- Máy chủ chứa ROM phải hỗ trợ CORS.',
    '- ROM set phải tương thích chuẩn với Core.'
  ].join('\n'));

  await destroyRunningGame();

  try {
    emulator = await Nostalgist.launch({
      element: '#game',
      core,
      rom: rom,
      size: 'auto',
      respondToGlobalEvents: true,
      style: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
      },
      cache: {
        core: true,
        rom: false,
        bios: false,
        shader: false,
      },
      retroarchConfig: {
        menu_mouse_enable: true,
      },
      onLaunch() {
        setStatus('Đang chạy');
        setLog([
          'Tải thành công!',
          `Core: ${core}`,
          `ROM: ${romUrl}`,
          '',
          'Bạn có thể dùng nút Tạm Dừng/Tiếp Tục để quản lý tiến trình.'
        ].join('\n'));
      },
    });

    setControlState(true);
  } catch (error) {
    emulator = null;
    setControlState(false);
    setStatus('Lỗi');
    setLog([
      'Không thể khởi động game.',
      '',
      `Lỗi: ${error?.message || String(error)}`,
      '',
      'Gợi ý:',
      '1) Thử chuyển sang một Core khác.',
      '2) Đảm bảo ROM đúng phiên bản của hệ thống.',
      '3) Kiểm tra lại lỗi CORS của link tải ROM.'
    ].join('\n'));
  } finally {
    launchBtn.disabled = false;
  }
}

launchBtn.addEventListener('click', launchGame);

pauseBtn.addEventListener('click', async () => {
  if (!emulator) return;
  await emulator.pause();
  setStatus('Đã tạm dừng');
  setLog('Game đã được tạm dừng.');
});

resumeBtn.addEventListener('click', async () => {
  if (!emulator) return;
  await emulator.resume();
  setStatus('Đang chạy');
  setLog('Tiếp tục chơi game.');
});

exitBtn.addEventListener('click', async () => {
  await destroyRunningGame();
  setLog('Đã thoát game và dọn dẹp giả lập.');
});

window.addEventListener('beforeunload', () => {
  if (emulator) emulator.exit().catch(() => { });
});

// --- VIRTUAL GAMEPAD LOGIC ---
// Action and System Buttons
const vButtons = document.querySelectorAll('.virtual-gamepad [data-key]');

vButtons.forEach(btn => {
  const btnName = btn.getAttribute('data-key');

  const nostalgistMap = {
    "Enter": "start",
    "Shift": "select",
    "z": "b",
    "x": "a",
    "a": "y",
    "s": "x"
  };

  const padBtn = nostalgistMap[btnName];

  const downHandler = (e) => {
    e.preventDefault();
    if (!btn.classList.contains('active')) {
      btn.classList.add('active');
      if (emulator && emulator.pressDown && padBtn) {
        emulator.pressDown({ button: padBtn, player: 1 });
      }
    }
  };

  const upHandler = (e) => {
    e.preventDefault();
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      if (emulator && emulator.pressUp && padBtn) {
        emulator.pressUp({ button: padBtn, player: 1 });
      }
    }
  };

  btn.addEventListener('touchstart', downHandler, { passive: false });
  btn.addEventListener('touchend', upHandler);
  btn.addEventListener('touchcancel', upHandler);

  btn.addEventListener('mousedown', downHandler);
  btn.addEventListener('mouseup', upHandler);
  btn.addEventListener('mouseleave', upHandler);
});

// Joystick Logic
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

let isDragging = false;
let currentDirs = { up: false, down: false, left: false, right: false };

function handleJoystickEvent(e) {
  if (!isDragging) return;
  e.preventDefault();

  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  const rect = joystickBase.getBoundingClientRect();
  const radius = rect.width / 2;
  const centerX = rect.left + radius;
  const centerY = rect.top + radius;

  let dx = clientX - centerX;
  let dy = clientY - centerY;
  const distance = Math.hypot(dx, dy);

  if (distance > radius) {
    const angle = Math.atan2(dy, dx);
    dx = Math.cos(angle) * radius;
    dy = Math.sin(angle) * radius;
  }

  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

  const threshold = radius * 0.3;
  const newDirs = {
    up: dy < -threshold,
    down: dy > threshold,
    left: dx < -threshold,
    right: dx > threshold
  };

  for (const dir in newDirs) {
    if (newDirs[dir] !== currentDirs[dir]) {
      if (newDirs[dir]) {
        if (emulator && emulator.pressDown) emulator.pressDown({ button: dir, player: 1 });
      } else {
        if (emulator && emulator.pressUp) emulator.pressUp({ button: dir, player: 1 });
      }
      currentDirs[dir] = newDirs[dir];
    }
  }
}

function resetJoystick(e) {
  if (e) e.preventDefault();
  isDragging = false;
  joystickKnob.style.transform = `translate(0px, 0px)`;
  for (const dir in currentDirs) {
    if (currentDirs[dir]) {
      if (emulator && emulator.pressUp) emulator.pressUp({ button: dir, player: 1 });
      currentDirs[dir] = false;
    }
  }
}

joystickBase.addEventListener('pointerdown', (e) => {
  isDragging = true;
  joystickBase.setPointerCapture(e.pointerId);
  handleJoystickEvent(e);
});

joystickBase.addEventListener('pointermove', handleJoystickEvent);
joystickBase.addEventListener('pointerup', resetJoystick);
joystickBase.addEventListener('pointercancel', resetJoystick);

joystickBase.addEventListener('touchstart', (e) => {
  isDragging = true;
  handleJoystickEvent(e);
}, { passive: false });
joystickBase.addEventListener('touchmove', handleJoystickEvent, { passive: false });
joystickBase.addEventListener('touchend', resetJoystick);
joystickBase.addEventListener('touchcancel', resetJoystick);