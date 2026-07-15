import './style.css';
import { Nostalgist } from 'nostalgist';
import { NetPlay } from './netplay.js';
import { NetStream } from './netstream.js';
import ARCADE_MAP from '../fbneo_rom_boxarts.json';

// const isDev = new URLSearchParams(window.location.search).get('dev') === '1';
const isDev = true;

let romSource = 'list';

// Capture console logs and append to the status log panel for easier troubleshooting
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

function appendToConsoleLog(type, ...args) {
  const text = args.map(arg => {
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch (e) { return String(arg); }
    }
    return String(arg);
  }).join(' ');

  const logEl = document.querySelector('#log');
  if (logEl) {
    const current = logEl.textContent;
    const lines = current.split('\n');
    if (lines.length > 500) {
      lines.splice(0, lines.length - 500);
    }
    logEl.textContent = lines.join('\n') + `\n[${type}] ${text}`;
    logEl.scrollTop = logEl.scrollHeight;
  }
}

console.log = function (...args) {
  originalLog.apply(console, args);
  appendToConsoleLog('LOG', ...args);
};
console.warn = function (...args) {
  originalWarn.apply(console, args);
  appendToConsoleLog('WARN', ...args);
};
console.error = function (...args) {
  originalError.apply(console, args);
  appendToConsoleLog('ERROR', ...args);
};

const app = document.querySelector('#app');

app.innerHTML = `
  <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background-image: url('/background-tuoitho.jpg'); background-size: cover; background-position: center; filter: blur(8px) brightness(0.5); transform: scale(1.1); pointer-events: none;"></div>
  <div id="rotatePrompt" class="rotate-prompt" aria-hidden="true">
    <div class="rotate-phone">
      <div class="rotate-phone-screen"></div>
    </div>
    <div class="rotate-copy">
      <strong>Xoay ngang màn hình</strong>
      <span>Game sẽ dễ nhìn và điều khiển mượt hơn.</span>
    </div>
  </div>

  <header class="header" style="position: relative; padding-top: 20px; padding-bottom: 20px; background-color: rgba(0, 0, 0, 0.6); overflow: hidden;">
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; background-image: url('/background-tuoitho.jpg'); background-size: cover; background-position: center; filter: blur(6px) brightness(0.5); transform: scale(1.05); pointer-events: none;"></div>
    <div class="header-content" style="position: relative; z-index: 1;">
      <div class="brand">
        <h1>Chơi game thùng Cổ Điển</h1>
        <p>Chơi game giả lập ngay trên trình duyệt với giao diện Retro</p>
      </div>
      <div class="header-controls">
        <!-- Timer HUD Overlay -->
        <div id="timerHud" class="timer-hud hidden" style="display: none !important;">
          <span class="hud-icon">⏱️</span> THỜI GIAN CÒN LẠI: <span id="timerVal">03:00</span>
        </div>

        <div class="coin-dashboard" style="display: none !important;">
          <div class="coin-balance-display">
            <span class="coin-pulse">🪙</span>
            <span class="coin-val" id="coinCount">--</span> <span class="coin-unit">xu</span>
          </div>
          <button id="shopBtn" class="primary shop-trigger" style="display: none !important;">Nạp Xu</button>
        </div>
        <button id="settingsBtn" class="secondary" title="Cài đặt nút điều khiển">⚙ Nút</button>
        <button id="restoreControlsBtn" class="secondary" type="button" title="Khôi phục vị trí mặc định">↺ Reset</button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <section class="game-area">
      <div class="screen-shell" style="position: relative; background-image: url('/background-tuoitho.jpg'); background-size: cover; background-position: center;">
        <!-- Continue Overlay -->
        <div id="continueOverlay" class="continue-overlay hidden">
          <div class="continue-box">
            <h2 class="continue-title">CONTINUE?</h2>
            <div id="continueCountdown" class="continue-number">9</div>
            <p class="continue-hint">Nhấn [Shift] để tiếp tục</p>
            <div class="continue-actions">
              <button id="insertCoinContinueBtn" class="primary neon-btn">Tiếp Tục Chơi (Miễn Phí)</button>
              <button id="exitGameContinueBtn" class="secondary">Thoát Game</button>
            </div>
          </div>
        </div>

        <canvas id="game" style="width: 100%; height: 100%;"></canvas>
      </div>
      <div class="controls-bar collapsed" id="controlsBar">
        <button id="controlsToggleBtn" class="controls-toggle-btn secondary" title="Hiện menu điều khiển">⚙ Menu</button>
        <div class="controls-bar-content" id="controlsBarContent">
          <button id="launchBtn" class="primary">Tải Game</button>
          <button id="pauseBtn" disabled>Tạm Dừng</button>
          <button id="resumeBtn" disabled>Tiếp Tục</button>
          <button id="customizeControlsBtn" class="secondary" type="button">Cài đặt nút</button>
          <button id="addCustomControlBtn" class="secondary" type="button" title="Thêm nút combo">＋ Nút</button>
        <div class="flash-controls-bar-group">
          <div class="flash-controls-bar-row">
            <button id="flashKeyConfigBtn" class="flash-icon-btn" type="button" title="Cài đặt phím Flash / Lưu">⚙️</button>
            <label class="flash-toggle-switch" title="Ẩn / Hiện nút Flash">
              <input type="checkbox" id="flashHideAllToggle" />
              <span class="flash-toggle-track"><span class="flash-toggle-thumb"></span></span>
              <span class="flash-toggle-label">Ẩn nút</span>
            </label>
            <button id="addFlashBtn" class="flash-icon-btn" type="button" title="Thêm nút mới vào giữa màn hình">＋</button>
          </div>
          <label class="flash-toggle-switch" title="Bật / Tắt chuột ảo 8 hướng">
            <input type="checkbox" id="vmouseToggle" />
            <span class="flash-toggle-track"><span class="flash-toggle-thumb"></span></span>
            <span class="flash-toggle-label">VMouse</span>
          </label>
          <div class="flash-controls-bar-row">
            <button id="exportFlashConfigBtn" class="flash-icon-btn" type="button" title="Xuất config ra file JSON">📤</button>
            <button id="copyFlashConfigBtn" class="flash-icon-btn" type="button" title="Copy config vào clipboard">📋</button>
            <button id="pasteFlashConfigBtn" class="flash-icon-btn" type="button" title="Paste config từ clipboard">📋↩</button>
            <button id="importFlashConfigBtn" class="flash-icon-btn" type="button" title="Nhập config từ file JSON">📥</button>
            <input type="file" id="importFlashConfigFile" accept=".json" style="display:none;" />
          </div>
        </div>
          <div class="exit-actions" style="display: flex; flex-direction: column; gap: 10px;">
            <button id="exitBtn" disabled title="Thoát game">✕ Thoát</button>
            <button id="saveBtn" disabled title="Lưu game">💾 Save</button>
            <button id="loadBtn" disabled title="Chơi tiếp">▶ Tiếp</button>
            <button id="shareBtn" disabled title="Chia sẻ game này">🔗 Chia sẻ</button>
          </div>
        </div>
      </div>

      <!-- VIRTUAL GAMEPAD -->
      <div class="virtual-gamepad">
        <div class="joystick-wrapper">
          <div class="action-btn macro-btn macro-slide-l" data-key="macro-slide-l" data-control-id="macro-slide-l">⬅️⬅️⬅️</div>
          <div class="action-btn macro-btn macro-slide-r" data-key="macro-slide-r" data-control-id="macro-slide-r">➡️➡️➡️</div>
          <div class="joystick-base" id="joystickBase" data-control-id="joystick">
            <div class="joystick-knob" id="joystickKnob"></div>
          </div>
        </div>
        

        <div class="system-buttons">
          <div class="sys-btn" data-key="Shift" data-control-id="select">Nhét xu</div>
          <div class="sys-btn" data-key="Enter" data-control-id="start">Bắt đầu</div>
        </div>

        <div class="action-buttons">
          <div class="action-btn btn-x" data-key="s" data-control-id="btn-x">X</div>
          <div class="action-btn btn-y" data-key="a" data-control-id="btn-y">Y</div>
          <div class="action-btn btn-a" data-key="x" data-control-id="btn-a">A</div>
          <div class="action-btn btn-b" data-key="z" data-control-id="btn-b">B</div>
          <div class="action-btn btn-combo-ab" data-key="combo-xz" data-control-id="combo-ab">A+B</div>
          <div class="action-btn btn-combo-yab" data-key="combo-axz" data-control-id="combo-yab">Y+A+B</div>
        </div>

        <!-- Virtual mouse pad (flash mouse-mode): Joystick / D-Pad -->
        <div id="vmousePad" class="vmouse-pad">
          <div class="vmouse-mode-tabs">
            <button class="vmouse-tab active" data-mode="joystick">Joystick</button>
            <button class="vmouse-tab" data-mode="dpad">D-Pad</button>
          </div>
          <!-- Joystick mode (default) -->
          <div id="vmouseJoystickWrap" class="vmouse-section">
            <div class="vmouse-base" id="vmouseBase">
              <div class="vmouse-knob" id="vmouseKnob">🖱</div>
              <div class="vmouse-ring"></div>
            </div>
          </div>
          <!-- D-Pad mode -->
          <div id="vmouseDpadGrid" class="vmouse-section vmouse-dpad-grid" style="display:none">
            <button class="vmouse-btn" data-dx="-0.707" data-dy="-0.707">↖</button>
            <button class="vmouse-btn" data-dx="0"      data-dy="-1"    >↑</button>
            <button class="vmouse-btn" data-dx="0.707"  data-dy="-0.707">↗</button>
            <button class="vmouse-btn" data-dx="-1"     data-dy="0"     >←</button>
            <button class="vmouse-btn vmouse-center" data-dx="0" data-dy="0">⊕</button>
            <button class="vmouse-btn" data-dx="1"      data-dy="0"     >→</button>
            <button class="vmouse-btn" data-dx="-0.707" data-dy="0.707" >↙</button>
            <button class="vmouse-btn" data-dx="0"      data-dy="1"     >↓</button>
            <button class="vmouse-btn" data-dx="0.707"  data-dy="0.707" >↘</button>
          </div>
        </div>

        <button class="flash-btn flash-dir-btn flash-btn-up"
                data-flash-key="w" data-flash-code="KeyW"
                data-flash-control-id="flash-up">
          <span class="flash-btn-icon">▲</span>
          <span class="flash-btn-keylabel">W</span>
        </button>
        <button class="flash-btn flash-dir-btn flash-btn-left"
                data-flash-key="a" data-flash-code="KeyA"
                data-flash-control-id="flash-left">
          <span class="flash-btn-icon">◀</span>
          <span class="flash-btn-keylabel">A</span>
        </button>
        <button class="flash-btn flash-dir-btn flash-btn-right"
                data-flash-key="d" data-flash-code="KeyD"
                data-flash-control-id="flash-right">
          <span class="flash-btn-icon">▶</span>
          <span class="flash-btn-keylabel">D</span>
        </button>
        <button class="flash-btn flash-dir-btn flash-btn-down"
                data-flash-key="s" data-flash-code="KeyS"
                data-flash-control-id="flash-down">
          <span class="flash-btn-icon">▼</span>
          <span class="flash-btn-keylabel">S</span>
        </button>
        <button class="flash-btn flash-action-btn flash-btn-jump"
                data-flash-key=" " data-flash-code="Space"
                data-flash-control-id="flash-jump">
          <span class="flash-btn-icon">😊</span>
          <span class="flash-btn-keylabel">Space</span>
        </button>
        <button class="flash-btn flash-action-btn flash-btn-continue"
                data-flash-key="Enter" data-flash-code="Enter"
                data-flash-control-id="flash-continue">
          <span class="flash-btn-icon">▶START</span>
          <span class="flash-btn-keylabel">Enter</span>
        </button>

        <!-- Add-flash-button overlay (visible only in edit mode) -->
        <button id="addFlashBtnOverlay" class="flash-add-overlay-btn" type="button">
          ＋ Thêm nút
        </button>
      </div>

      <!-- Flash key config popover -->
      <div id="flashKeyPopover" class="flash-key-popover hidden" aria-hidden="true">
        <div class="flash-key-popover-inner">
          <div class="flash-key-popover-head">
            <strong>Cài đặt nút</strong>
            <button type="button" id="flashKeyPopoverClose" class="secondary">✕</button>
          </div>
          <label class="flash-key-popover-label">
            Tên nút
            <input id="flashKeyPopoverName" class="input" maxlength="12" placeholder="Để trống = tên phím" />
          </label>
          <div class="flash-key-popover-current">
            Phím đang chọn: <strong id="flashKeyPopoverSelectedLabel">—</strong>
          </div>
          <div class="flash-key-popover-grid-wrap">
            <div class="flash-key-popover-group-label">Mũi tên</div>
            <div class="flash-key-popover-grid" id="flashKeyGrid-arrows"></div>
            <div class="flash-key-popover-group-label">Phổ biến</div>
            <div class="flash-key-popover-grid" id="flashKeyGrid-common"></div>
            <div class="flash-key-popover-group-label">WASD / Chữ cái</div>
            <div class="flash-key-popover-grid" id="flashKeyGrid-letters"></div>
            <div class="flash-key-popover-group-label">Số</div>
            <div class="flash-key-popover-grid" id="flashKeyGrid-digits"></div>
            <div class="flash-key-popover-group-label">Hàm / Khác</div>
            <div class="flash-key-popover-grid" id="flashKeyGrid-fn"></div>
          </div>
          <div class="flash-key-popover-hint">Hoặc bấm phím vật lý trên bàn phím</div>
          <div class="flash-key-popover-actions">
            <button type="button" id="flashKeyPopoverCancel" class="secondary">Hủy</button>
            <button type="button" id="flashKeyPopoverSave" class="primary">Lưu</button>
          </div>
        </div>
      </div>

      <div id="customControlModal" class="custom-control-modal hidden" aria-hidden="true">
        <form id="customControlForm" class="custom-control-form">
          <div class="custom-control-form-head">
            <strong>Tạo nút combo</strong>
            <button type="button" id="closeCustomControlModalBtn" class="secondary">Đóng</button>
          </div>
          <label>
            Tên nút
            <input id="customControlName" class="input" maxlength="12" value="Combo" />
          </label>
          <div class="custom-action-list" id="customActionList">
            ${[0, 1, 2].map((idx) => `
              <div class="custom-action-row">
                <select class="input custom-action-select" data-index="${idx}">
                  <option value="">Bỏ qua</option>
                  <option value="left">left</option>
                  <option value="right">right</option>
                  <option value="down">down</option>
                  <option value="up">up</option>
                  <option value="X">X</option>
                  <option value="Y">Y</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
                <input class="input custom-delay-input" data-index="${idx}" type="text" inputmode="numeric" pattern="[0-9]*" value="${idx === 0 ? 0 : 60}" />
                <button type="button" class="custom-remove-action-btn" title="Xoá action">×</button>
              </div>
            `).join('')}
          </div>
          <button type="button" id="addCustomActionRowBtn" class="secondary">Thêm action</button>
          <button type="submit" class="primary">Tạo nút</button>
        </form>
      </div>
    </section>

    <aside class="sidebar">
      <div class="stack">
        <label class="label">Trạng Thái</label>
        <span id="status" class="status">Đang chờ...</span>
      </div>

      <div class="stack" id="netplayStack">
        <label class="label">Chơi 2 máy</label>
        <div style="display: flex; gap: 8px;">
          <input id="netplayRoom" class="input" placeholder="Tên phòng" maxlength="24" style="flex: 1; min-width: 0;" />
          <button id="netplayJoinBtn" class="secondary" type="button">Vào phòng</button>
        </div>
        <span id="netplayStatus" class="status">Chưa kết nối</span>
      </div>

      <div class="stack" id="romStack">
        <label class="label">${isDev ? 'Nguồn Game (ROM)' : 'Chọn Game (ROM)'}</label>
        ${isDev ? `
        <div class="dev-tabs">
          <button type="button" class="dev-tab-btn active" data-source="list">Danh sách</button>
          <button type="button" class="dev-tab-btn" data-source="url">Đường dẫn (URL)</button>
          <button type="button" class="dev-tab-btn" data-source="file">Tải File ROM</button>
        </div>
        ` : ''}

        <!-- 1. Selection dropdown (Default) -->
        <div id="romListContainer" class="rom-input-group">
          <select id="romUrl" class="input" style="display: none;">
          <option value="/roms/kov.zip">kov</option>
          <option value="/roms/kovplus.zip">kovplus</option>
          <option value="/roms/sengoku3.zip">sengoku3</option>
          <option value="/roms/dmnfrnt.zip">dmnfrnt</option>
          <option value="/roms/dino.zip">dino</option>
          <option value="/roms/olds.zip">olds</option>
          <option value="/roms/oldsplusp.zip">oldsplusp</option>
          <option value="/roms/doubledr.zip">doubledr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/1942.zip">1942</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/1943.zip">1943</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/1943kai.zip">1943kai</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/64street.zip">64street</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aburner2.zip">aburner2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/actfancr.zip">actfancr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aerofgt.zip">aerofgt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/agallet.zip">agallet</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/airwolf.zip">airwolf</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ajax.zip">ajax</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aliens.zip">aliens</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aliensyn.zip">aliensyn</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aligator.zip">aligator</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/altbeast.zip">altbeast</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/amidar.zip">amidar</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aquajack.zip">aquajack</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/arkanoid.zip">arkanoid</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/arknoid2.zip">arknoid2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/armorcar.zip">armorcar</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/armwrest.zip">armwrest</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/astdelux.zip">astdelux</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/asterix.zip">asterix</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/asteroid.zip">asteroid</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/astorm.zip">astorm</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/atetris.zip">atetris</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/aurail.zip">aurail</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/avengers.zip">avengers</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/avspirit.zip">avspirit</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/baddudes.zip">baddudes</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/badlands.zip">badlands</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bankp.zip">bankp</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/batman.zip">batman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/batrider.zip">batrider</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bbros.zip">bbros</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/berzerk.zip">berzerk</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bgaregga.zip">bgaregga</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/biomtoy.zip">biomtoy</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bionicc.zip">bionicc</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/blktiger.zip">blktiger</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bloodbro.zip">bloodbro</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/blstroid.zip">blstroid</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/blswhstl.zip">blswhstl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bnj.zip">bnj</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bogeyman.zip">bogeyman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bombjack.zip">bombjack</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bongo.zip">bongo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/boogwing.zip">boogwing</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/brkthru.zip">brkthru</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/btime.zip">btime</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/btoads.zip">btoads</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bubbles.zip">bubbles</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bublbob2.zip">bublbob2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bublbobl.zip">bublbobl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/buckrog.zip">buckrog</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bucky.zip">bucky</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bwidow.zip">bwidow</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/bzone.zip">bzone</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/cabal.zip">cabal</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/captaven.zip">captaven</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/carnival.zip">carnival</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ccastles.zip">ccastles</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/cclimber.zip">cclimber</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/centiped.zip">centiped</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/chaknpop.zip">chaknpop</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/chasehq.zip">chasehq</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/chinagat.zip">chinagat</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/choplift.zip">choplift</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/circusc.zip">circusc</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/citycon.zip">citycon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ckong.zip">ckong</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ckongpt2.zip">ckongpt2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/cleopatr.zip">cleopatr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/columns.zip">columns</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/commando.zip">commando</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/congo.zip">congo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/contra.zip">contra</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/cotton.zip">cotton</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/crimfght.zip">crimfght</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ctribe.zip">ctribe</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/cyvern.zip">cyvern</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/darkseal.zip">darkseal</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dassault.zip">dassault</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dbreed.zip">dbreed</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dbz.zip">dbz</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dbz2.zip">dbz2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ddcrew2.zip">ddcrew2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ddragon.zip">ddragon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ddragon2.zip">ddragon2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ddragon3.zip">ddragon3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ddux.zip">ddux</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/deadconx.zip">deadconx</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/defender.zip">defender</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/digdug.zip">digdug</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/digdug2.zip">digdug2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dkong.zip">dkong</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dkong3.zip">dkong3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dkongjr.zip">dkongjr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dmnfrnt.zip">dmnfrnt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/docastle.zip">docastle</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dondokod.zip">dondokod</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/drgnbstr.zip">drgnbstr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/drtoppel.zip">drtoppel</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dsaber.zip">dsaber</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dsoccr94.zip">dsoccr94</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/dynagear.zip">dynagear</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/edrandy.zip">edrandy</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/elevator.zip">elevator</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/elvactr.zip">elvactr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/enduror.zip">enduror</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/eprom.zip">eprom</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/eswat.zip">eswat</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/exedexes.zip">exedexes</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/fantzn2.zip">fantzn2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/fantzone.zip">fantzone</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/fastlane.zip">fastlane</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/flicky.zip">flicky</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/foodf.zip">foodf</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/frogger.zip">frogger</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/funkyjet.zip">funkyjet</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ga2.zip">ga2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gaia.zip">gaia</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gaiden.zip">gaiden</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/galaga.zip">galaga</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/galaga88.zip">galaga88</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/galaxian.zip">galaxian</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/galivan.zip">galivan</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/galmedes.zip">galmedes</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gangwars.zip">gangwars</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gaplus.zip">gaplus</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gaunt22p.zip">gaunt22p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gauntlet2p.zip">gauntlet2p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gblchmp.zip">gblchmp</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/geebeeg.zip">geebeeg</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gground.zip">gground</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ghostb.zip">ghostb</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gijoe.zip">gijoe</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gnbarich.zip">gnbarich</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gng.zip">gng</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/godzilla.zip">godzilla</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gogomile.zip">gogomile</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/goldnaxe.zip">goldnaxe</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gradius3.zip">gradius3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/grdians.zip">grdians</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/growl.zip">growl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gstream.zip">gstream</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gtmr2.zip">gtmr2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gunbird2.zip">gunbird2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gunforce.zip">gunforce</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gunlock.zip">gunlock</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gunnail.zip">gunnail</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gunsmoke.zip">gunsmoke</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/gyruss.zip">gyruss</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hangon.zip">hangon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hbarrel.zip">hbarrel</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hcastle.zip">hcastle</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/heatbrl.zip">heatbrl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hharry.zip">hharry</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hitice.zip">hitice</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hook.zip">hook</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hopmappy.zip">hopmappy</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/horekid.zip">horekid</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/horizon.zip">horizon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/hvysmsh.zip">hvysmsh</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ikari.zip">ikari</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ikari3.zip">ikari3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/imgfight.zip">imgfight</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/inthunt.zip">inthunt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/invaders.zip">invaders</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/jackal.zip">jackal</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/jailbrek.zip">jailbrek</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/jedi.zip">jedi</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/journey.zip">journey</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/joust.zip">joust</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/junglek.zip">junglek</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/junofrst.zip">junofrst</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kangaroo.zip">kangaroo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/karnov.zip">karnov</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kchamp.zip">kchamp</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kick.zip">kick</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kicker.zip">kicker</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kingball.zip">kingball</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/klax.zip">klax</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kof95h.zip">kof95h</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/krull.zip">krull</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/kungfum.zip">kungfum</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/landmakr.zip">landmakr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ldrun.zip">ldrun</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ldrun2.zip">ldrun2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ldrun3.zip">ldrun3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ldrun4.zip">ldrun4</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/lethalth.zip">lethalth</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/liblrabl.zip">liblrabl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/lightbr.zip">lightbr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/liquidk.zip">liquidk</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/lizwiz.zip">lizwiz</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/lkage.zip">lkage</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/llander.zip">llander</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/locomotn.zip">locomotn</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/loderndf.zip">loderndf</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/loht.zip">loht</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/lwings.zip">lwings</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/macross.zip">macross</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/macross2.zip">macross2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/macrossp.zip">macrossp</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mainevt2p.zip">mainevt2p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mario.zip">mario</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mazinger.zip">mazinger</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/metamrph.zip">metamrph</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/metmqstr.zip">metmqstr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mgcrystl.zip">mgcrystl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mhavoc.zip">mhavoc</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mikie.zip">mikie</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/milliped.zip">milliped</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/missile.zip">missile</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mk.zip">mk</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mk2.zip">mk2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/moomesa.zip">moomesa</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mpatrol.zip">mpatrol</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mrdo.zip">mrdo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mrgoemon.zip">mrgoemon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mspacman.zip">mspacman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mwalk.zip">mwalk</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/mystwarr.zip">mystwarr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/narc.zip">narc</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nbajamte.zip">nbajamte</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nbbatman.zip">nbbatman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nemesis.zip">nemesis</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nibbler.zip">nibbler</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ninjak.zip">ninjak</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ninjakd2.zip">ninjakd2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ninjakun.zip">ninjakun</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nitedrvr.zip">nitedrvr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nitrobal.zip">nitrobal</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nob.zip">nob</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nrallyx.zip">nrallyx</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nslashers.zip">nslashers</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/nspirit.zip">nspirit</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/osman.zip">osman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/outfxies.zip">outfxies</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/outrun.zip">outrun</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pacland.zip">pacland</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pacman.zip">pacman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/parodius.zip">parodius</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pbobble3.zip">pbobble3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/penbros.zip">penbros</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pengo.zip">pengo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/phoenix.zip">phoenix</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pipedrm.zip">pipedrm</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pitfight.zip">pitfight</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pleiads.zip">pleiads</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pooyan.zip">pooyan</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/popeye.zip">popeye</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/pow.zip">pow</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/punchout.zip">punchout</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/punkshot2.zip">punkshot2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/puyo.zip">puyo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/puyopuy2.zip">puyopuy2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/puzzloop.zip">puzzloop</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/qbert.zip">qbert</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/qix.zip">qix</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/quartet2.zip">quartet2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/radm.zip">radm</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/raiden2.zip">raiden2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rallyx.zip">rallyx</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rambo3.zip">rambo3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rampage.zip">rampage</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rampart2p.zip">rampart2p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rastan.zip">rastan</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rbisland.zip">rbisland</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/renegade.zip">renegade</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ringking.zip">ringking</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/riotcity.zip">riotcity</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/robocop.zip">robocop</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/robocop2.zip">robocop2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/robotron.zip">robotron</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rocnrope.zip">rocnrope</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rohga.zip">rohga</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rthun2.zip">rthun2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rthunder.zip">rthunder</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rtype.zip">rtype</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rtype2.zip">rtype2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rtypeleo.zip">rtypeleo</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rushatck.zip">rushatck</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/rygar.zip">rygar</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/s1945.zip">s1945</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/s1945ii.zip">s1945ii</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/s1945iii.zip">s1945iii</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sabotenb.zip">sabotenb</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sailormn.zip">sailormn</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/salamand.zip">salamand</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/scobra.zip">scobra</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/scontra.zip">scontra</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/scramble.zip">scramble</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/seawolft.zip">seawolft</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/seganinj.zip">seganinj</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/seicross.zip">seicross</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sf.zip">sf</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/shadfrce.zip">shadfrce</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/shangon.zip">shangon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sharrier.zip">sharrier</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/shdancer.zip">shdancer</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/shinobi.zip">shinobi</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/shollow.zip">shollow</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sidearms.zip">sidearms</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/simpsons2p.zip">simpsons2p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sinistar.zip">sinistar</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/skykid.zip">skykid</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/slapshot.zip">slapshot</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/slyspy.zip">slyspy</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/smashtv.zip">smashtv</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/snowbros.zip">snowbros</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/solomon.zip">solomon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/solrwarr.zip">solrwarr</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sonic.zip">sonic</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sonicfgt.zip">sonicfgt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sonson.zip">sonson</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spacedx.zip">spacedx</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spcinv95.zip">spcinv95</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spidman.zip">spidman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/splatter.zip">splatter</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spnchout.zip">spnchout</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spyhunt.zip">spyhunt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/spyhunt2.zip">spyhunt2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/srumbler.zip">srumbler</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/ssridersubc.zip">ssridersubc</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/starwars.zip">starwars</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/stdragon.zip">stdragon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/stmblade.zip">stmblade</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/superman.zip">superman</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/superpac.zip">superpac</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/sxevious.zip">sxevious</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/szaxxon.zip">szaxxon</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tankfrce.zip">tankfrce</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tapper.zip">tapper</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tempest.zip">tempest</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tengai.zip">tengai</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tetrisp2.zip">tetrisp2</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tgm2p.zip">tgm2p</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/thndrbld.zip">thndrbld</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/thundfox.zip">thundfox</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tigeroad.zip">tigeroad</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/timeplt.zip">timeplt</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tmnt22pu.zip">tmnt22pu</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tmnt2pj.zip">tmnt2pj</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tnzs.zip">tnzs</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/todruaga.zip">todruaga</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/toki.zip">toki</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/toobin.zip">toobin</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/totcarn.zip">totcarn</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/trackfld.zip">trackfld</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/trojan.zip">trojan</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tron.zip">tron</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/tumblep.zip">tumblep</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/twocrude.zip">twocrude</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/uccops.zip">uccops</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/umk3.zip">umk3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/upndown.zip">upndown</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/valkyrie.zip">valkyrie</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/vball.zip">vball</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/vendetta2pu.zip">vendetta2pu</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/viostorm.zip">viostorm</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/volfied.zip">volfied</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/vulcan.zip">vulcan</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wb3.zip">wb3</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wbml.zip">wbml</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wboy.zip">wboy</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wildfang.zip">wildfang</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wizdfire.zip">wizdfire</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wof.zip">wof</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wwfsstar.zip">wwfsstar</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/wwfwfest.zip">wwfwfest</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/xexex.zip">xexex</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/xmen2pa.zip">xmen2pa</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/xmultipl.zip">xmultipl</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/xybots.zip">xybots</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/yiear.zip">yiear</option>
          <option value="https://quoc67k1-profile.web.app/tuoitho/fb_neo_rom/zookeep.zip">zookeep</option>
        </select>

        <!-- CATEGORY TABS switcher -->
        <div class="console-categories">
          <button type="button" class="category-btn active" data-system="all">🌐 Tất cả</button>
          <button type="button" class="category-btn" data-system="favorite">❤️ Yêu thích</button>
          <button type="button" class="category-btn" data-system="recent">⏱️ Vừa chơi</button>
          <button type="button" class="category-btn" data-system="arcade">🕹️ Arcade</button>
          <button type="button" class="category-btn" data-system="flash">⚡ Flash</button>
        </div>

        <!-- SEARCH INPUT -->
        <div class="search-box-wrapper">
          <input type="text" id="gameSearchInput" class="input game-search-input" placeholder="🔍 Tìm kiếm game..." />
        </div>

        <!-- SELECTED GAME SHOWCASE PANEL -->
        <div id="selectedGameShowcase" class="selected-game-showcase">
          <div class="showcase-thumb-wrapper">
            <div class="crt-overlay"></div>
            <img id="showcaseThumb" class="showcase-thumb" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='65' viewBox='0 0 90 65'><rect width='100%' height='100%' fill='%23111'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2300ffcc' font-family='Courier' font-size='10' font-weight='bold'>🕹️ RETRO</text></svg>" />
          </div>
          <div class="showcase-details">
            <h3 id="showcaseTitle" class="showcase-title">Chọn Một Game</h3>
            <div class="showcase-meta">
              <span id="showcaseSystem" class="showcase-system-badge">ARCADE</span>
              <span id="showcaseRom" class="showcase-rom-name">chưa chọn</span>
            </div>
          </div>
        </div>

        <!-- DYNAMIC GRID OF GAME CARDS -->
        <div id="gameCardsGrid" class="game-cards-grid">
          <!-- Dynamically populated via JS -->
        </div>
        </div>

        ${isDev ? `
        <!-- 2. Custom URL Input -->
        <div id="romUrlContainer" class="rom-input-group hidden">
          <input type="text" id="romUrlText" class="input" placeholder="Dán link ROM (.zip, .nes, .sfc...)" />
        </div>

        <!-- 3. Local File Input -->
        <div id="romFileContainer" class="rom-input-group hidden">
          <div class="file-upload-wrapper">
            <input type="file" id="romFile" accept=".zip,.bin,.rom,.iso,.nes,.smc,.sfc,.gb,.gbc,.gba" multiple style="display: none;" />
            <button type="button" id="customFileBtn" class="secondary select-file-btn">Chọn file từ máy tính</button>
            <span id="fileNameDisplay" class="file-name-display">Chưa chọn file nào</span>
          </div>
        </div>
        ` : ''}

        <p class="hint" id="romHint">
          Chọn game từ danh sách. Một số game có thể cần kèm file BIOS.
        </p>
      </div>

      <div class="stack" style="display: none !important;">
        <label class="label" for="coreName">Trình Giả Lập (Core)</label>
        <select id="coreName" class="input">
          <option value="ruffle">ruffle (Flash / SWF)</option>
          <option value="fbneo">fbneo (FinalBurn Neo)</option>
          <option value="fbalpha2012_cps1">fbalpha2012_cps1 (Arcade)</option>
          <option value="fbalpha2012">fbalpha2012 (Arcade)</option>
          <option value="mame2003_plus">mame2003_plus (Arcade)</option>
          <option value="fceumm">fceumm (NES)</option>
          <option value="snes9x">snes9x (SNES)</option>
        </select>
        <button id="sidebarLaunchBtn" class="primary sidebar-launch-btn">Bắt Đầu Chơi</button>
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

// --- APPEND COIN SHOP MODAL, TOASTS AND CONFETTI TO DOM ---
app.innerHTML += `
<!-- COIN SHOP MODAL -->
<div id="shopModal" class="shop-modal hidden">
  <div class="modal-backdrop"></div>
  <div class="modal-content">
    <button class="modal-close" id="closeShopBtn">×</button>
    <div class="shop-header">
      <h2>🏪 CỬA HÀNG ARCADE COIN</h2>
      <p>Nạp thêm xu để tiếp tục hành trình chiến game huyền thoại</p>
    </div>
    
    <div class="shop-tabs">
      <button class="tab-btn active" id="tabBuy">Mua Gói Xu</button>
      <button class="tab-btn" id="tabGiftcode">Nhập Code Quà Tặng</button>
    </div>
    
    <!-- TAB 1: BUY COINS -->
    <div class="tab-content" id="tabContentBuy">
      <div class="packages-grid">
        <div class="package-card" data-package="package_1">
          <div class="pack-badge">Bình Dân</div>
          <div class="pack-icon">🪙</div>
          <div class="pack-title">Gói Đồng</div>
          <div class="pack-qty">5 Xu</div>
          <div class="pack-price">10.000đ</div>
          <button class="buy-now-btn">Nạp Ngay</button>
        </div>
        <div class="package-card featured" data-package="package_2">
          <div class="pack-badge">Hời Nhất</div>
          <div class="pack-icon">🪙🪙</div>
          <div class="pack-title">Gói Bạc</div>
          <div class="pack-qty">12 Xu <span class="bonus">+2 free</span></div>
          <div class="pack-price">20.000đ</div>
          <button class="buy-now-btn">Nạp Ngay</button>
        </div>
        <div class="package-card" data-package="package_3">
          <div class="pack-badge">Đại Cao Thủ</div>
          <div class="pack-icon">💰</div>
          <div class="pack-title">Gói Vàng</div>
          <div class="pack-qty">35 Xu <span class="bonus">+10 free</span></div>
          <div class="pack-price">50.000đ</div>
          <button class="buy-now-btn">Nạp Ngay</button>
        </div>
        <div class="package-card" data-package="package_4">
          <div class="pack-badge">VIP Pro</div>
          <div class="pack-icon">💎</div>
          <div class="pack-title">Gói Kim Cương</div>
          <div class="pack-qty">80 Xu <span class="bonus">+30 free</span></div>
          <div class="pack-price">100.000đ</div>
          <button class="buy-now-btn">Nạp Ngay</button>
        </div>
        <div class="package-card unlimited" data-package="package_unlimited">
          <div class="pack-badge">Không Giới Hạn</div>
          <div class="pack-icon">♾️</div>
          <div class="pack-title">Gói Vô Hạn</div>
          <div class="pack-qty">24 Giờ Chơi</div>
          <div class="pack-price">150.000đ</div>
          <button class="buy-now-btn">Nạp Ngay</button>
        </div>
      </div>
      
      <div class="shop-options">
        <label class="toggle-switch">
          <input type="checkbox" id="testSpeedToggle">
          <span class="slider"></span>
          <span class="toggle-label">⚡ Chế độ test nhanh (1 Coin = 20 giây chơi - dành cho người kiểm thử)</span>
        </label>
      </div>
    </div>
    
    <!-- TAB 2: GIFT CODE -->
    <div class="tab-content hidden" id="tabContentGiftcode">
      <div class="giftcode-box">
        <p>Nhập mã quà tặng hoặc thẻ cào để nhận xu miễn phí:</p>
        <div class="giftcode-form">
          <input type="text" id="giftcodeInput" class="input" placeholder="Ví dụ: RETROGAMER5" style="text-transform: uppercase;" />
          <button id="applyGiftcodeBtn" class="primary">Áp Dụng</button>
        </div>
        <p class="hint">Thử nhập code: <strong>RETRO2026</strong> (+10 xu) hoặc <strong>FREECOINS</strong> (+3 xu) hoặc <strong>INFINITYGAME</strong> (Vô hạn 24H) để trải nghiệm!</p>
        <div id="giftcodeMessage" class="giftcode-msg"></div>
      </div>
    </div>
    
    <!-- PAYMENT MODAL INNER PANEL -->
    <div id="paymentPanel" class="payment-panel hidden">
      <div class="payment-box">
        <button class="back-to-shop-btn" id="cancelPayBtn">← Trở Về Cửa Hàng</button>
        <h3 class="payment-title">QUÉT MÃ THANH TOÁN (DEMO)</h3>
        <p class="payment-desc">Vui lòng quét mã QR Momo/ZaloPay giả lập dưới đây để hoàn tất thanh toán.</p>
        
        <div class="payment-details">
          <div class="payment-info-text">
            <div>Sản phẩm: <strong id="payItemName">Gói Bạc (12 Xu)</strong></div>
            <div>Số tiền thanh toán: <strong id="payAmount" class="price-highlight">20.000đ</strong></div>
          </div>
          
          <div class="qr-container">
            <img id="qrImage" src="" alt="Momo QR Code" />
            <div class="qr-scanner-line"></div>
          </div>
        </div>
        
        <div class="payment-status-sim">
          <div class="spinner"></div>
          <span>Hệ thống đang chờ bạn quét mã...</span>
        </div>
        
        <button id="simSuccessBtn" class="primary sim-success-btn">Xác Nhận Đã Thanh Toán (Demo)</button>
      </div>
    </div>
  </div>
</div>

<!-- TOAST NOTIFICATION -->
<div id="arcadeToast" class="arcade-toast hidden">
  <span class="toast-icon">🛎️</span>
  <span id="toastMsg" class="toast-text">Thông báo</span>
</div>

<!-- CONFETTI CANVAS -->
<canvas id="confettiCanvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 9999;"></canvas>
`;

// --- AUDIO SYNTHESIS ENGINE ---
const AudioSynth = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playCoin() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  },
  playSuccess() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.08);

        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  },
  playWarning() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now); // A3

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  },
  playGameOver() {
    try {
      this.init();
      const ctx = this.ctx;
      const now = ctx.currentTime;
      const freqs = [392.00, 349.23, 311.13, 246.94]; // G4, F4, D#4, B3
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.15);

        gain.gain.setValueAtTime(0.08, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.35);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }
};

// --- CONFETTI CANVAS PARTICLES ---
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,

  init() {
    this.canvas = document.getElementById('confettiCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  },

  spawn() {
    this.init();
    if (!this.canvas) return;
    this.particles = [];
    const colors = ['#ff0055', '#00ffcc', '#ffcc00', '#9900ff', '#33ff33', '#3399ff'];
    for (let i = 0; i < 150; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * this.canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animate();
  },

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let active = false;

    this.particles.forEach((p) => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.x += Math.sin(p.tiltAngle);
      p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

      if (p.y <= this.canvas.height) {
        active = true;
      }

      this.ctx.beginPath();
      this.ctx.lineWidth = p.r;
      this.ctx.strokeStyle = p.color;
      this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      this.ctx.stroke();
    });

    if (active) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

// --- COIN SYSTEM STATE MANAGEMENT ---
const CoinSystem = {
  coins: 5, // Default coins on first load
  infiniteUntil: 0, // Infinite timestamp
  isTestSpeed: false, // 1 coin = 20s if true, 180s if false

  load() {
    const savedCoins = localStorage.getItem('arcade_coins');
    if (savedCoins !== null) {
      this.coins = parseInt(savedCoins) || 0;
    } else {
      localStorage.setItem('arcade_coins', this.coins);
    }

    this.infiniteUntil = parseInt(localStorage.getItem('arcade_infinite_until')) || 0;
    this.isTestSpeed = localStorage.getItem('arcade_test_speed') === 'true';

    const checkbox = document.getElementById('testSpeedToggle');
    if (checkbox) {
      checkbox.checked = this.isTestSpeed;
    }

    this.updateUI();
  },

  save() {
    localStorage.setItem('arcade_coins', this.coins);
    localStorage.setItem('arcade_infinite_until', this.infiniteUntil);
    localStorage.setItem('arcade_test_speed', this.isTestSpeed);
    this.updateUI();
  },

  isInfinite() {
    return true; // Tạm thời free toàn bộ
  },

  getCoinsDisplay() {
    if (this.isInfinite()) {
      return '♾️';
    }
    return this.coins;
  },

  updateUI() {
    const coinCountEl = document.getElementById('coinCount');
    if (coinCountEl) {
      coinCountEl.textContent = this.getCoinsDisplay();
    }
  },

  addCoins(amount) {
    this.coins += amount;
    this.save();
    AudioSynth.playCoin();
    Confetti.spawn();
    showToast(`Đã nạp thành công ${amount} xu vào tài khoản!`);
  },

  setInfinite(hours) {
    const duration = hours * 60 * 60 * 1000;
    const currentInfinite = this.isInfinite() ? this.infiniteUntil : Date.now();
    this.infiniteUntil = currentInfinite + duration;
    this.save();
    AudioSynth.playCoin();
    Confetti.spawn();
    showToast(`Đã kích hoạt chế độ Vô Hạn Chơi Game trong ${hours} giờ!`);
  },

  consumeCoin() {
    if (this.isInfinite()) return true;
    if (this.coins > 0) {
      this.coins--;
      this.save();
      return true;
    }
    return false;
  }
};

// --- TOAST NOTIFICATIONS ---
function showToast(msg, type = 'success') {
  const toast = document.getElementById('arcadeToast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.className = `arcade-toast ${type}`;
  toast.classList.remove('hidden');

  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// --- TIMED PLAYTIME LOGIC ---
let emulator = null;

// Danh sách player nhận input từ bộ điều khiển trên máy này.
// Chơi 1 máy: 1 người điều khiển song song cả player1 và player2.
// Chơi 2 máy (netplay): mỗi máy chỉ điều khiển đúng player của mình
// (máy vào phòng trước = [1], vào sau = [2]) — xem syncNetplayState().
let localPlayers = [1, 2];

// Game gần nhất đã launch (rom URL + core) để host gửi cho máy 2 vào sau
let netplayLastLaunch = null;

// true khi launchGame() được kích hoạt từ lệnh 'launch' của host (phân biệt
// với việc máy 2 tự bấm Tải Game — trong phòng chỉ host được chọn game)
let netplayLaunchFromHost = false;

// 2 bộ phím bind cho RetroArch: LOCAL cho player do máy này điều khiển
// (trùng bộ phím vật lý quen thuộc), REMOTE cho player của máy kia —
// Nostalgist pressDown() giả lập phím theo bind nên 2 bộ PHẢI khác nhau.
const LOCAL_KEY_BINDS = { up: 'w', left: 'a', down: 's', right: 'd', x: 'i', y: 'j', a: 'k', b: 'l', select: 'space', start: 'enter' };
const REMOTE_KEY_BINDS = { up: 'up', left: 'left', down: 'down', right: 'right', x: 'c', y: 'x', a: 'v', b: 'b', select: 'q', start: 'e' };

function buildPlayerKeyBinds() {
  // Vào phòng là tách vai ngay (không đợi đủ 2 máy) để keybind ổn định
  const localPlayer = NetPlay.connected && NetPlay.role > 0 ? NetPlay.role : 1;
  const binds = {};
  for (const player of [1, 2]) {
    const keys = player === localPlayer ? LOCAL_KEY_BINDS : REMOTE_KEY_BINDS;
    for (const [button, key] of Object.entries(keys)) {
      binds[`input_player${player}_${button}`] = key;
    }
  }
  return binds;
}

// Mở stream màn hình cho máy 2 (host). Trả false nếu không lấy được canvas
// hoặc máy không hỗ trợ — caller rơi về cách cũ (gửi 'launch' + sync state).
// Nostalgist thay canvas #game bằng canvas riêng nên phải hỏi emulator.
function netplayStartStream() {
  if (!NetStream.supported || !emulator) return false;
  let canvas = null;
  try {
    canvas = typeof emulator.getCanvas === 'function' ? emulator.getCanvas() : null;
  } catch { canvas = null; }
  canvas = canvas || document.querySelector('.screen-shell canvas');
  if (!canvas || typeof canvas.captureStream !== 'function') return false;
  NetStream.startHost(canvas);
  return true;
}

// Gửi input cho máy kia: ưu tiên data channel WebRTC (nhanh, P2P),
// chưa nối được thì đi đường relay như cũ
function netplayRelayInput(method, button) {
  if (!NetPlay.active) return;
  if (NetStream.sendInput({ type: 'input', method, button, player: NetPlay.role })) return;
  NetPlay.sendInput(method, button);
}

function emulatorPress(method, button) {
  // Máy 2 đang xem stream: không có giả lập local, gửi thẳng phím cho host
  if (NetStream.mode === 'view') {
    if (method === 'pressDown' || method === 'pressUp') netplayRelayInput(method, button);
    return;
  }
  if (!emulator || typeof emulator[method] !== 'function') return;
  localPlayers.forEach((player) => emulator[method]({ button, player }));
  netplayRelayInput(method, button);
}
let isLaunching = false;
let flashButtonsHidden = localStorage.getItem('flash_buttons_hidden') === 'true';
let activeFlashGameId = null;
let ALL_FLASH_GAMES = [];
let continueTimer = null;
let continueCountdownVal = 9;
let timeLeft = 0;
let gameTimer = null;

function updateTimerHud() {
  const timerHud = document.getElementById('timerHud');
  const timerVal = document.getElementById('timerVal');
  if (!timerVal) return;

  if (CoinSystem.isInfinite()) {
    timerVal.textContent = 'VÔ HẠN';
    if (timerHud) timerHud.classList.remove('warning');
    return;
  }

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  timerVal.textContent = `${minutes}:${seconds}`;

  if (timeLeft <= 30) {
    if (timerHud) timerHud.classList.add('warning');
  } else {
    if (timerHud) timerHud.classList.remove('warning');
  }
}

function startPlayTimer() {
  stopPlayTimer();

  const timerHud = document.getElementById('timerHud');
  if (timerHud) timerHud.classList.remove('hidden');

  timeLeft = CoinSystem.isTestSpeed ? 20 : 180; // 20s test or 180s standard
  updateTimerHud();

  gameTimer = setInterval(() => {
    if (CoinSystem.isInfinite()) {
      updateTimerHud();
      return;
    }

    timeLeft--;
    updateTimerHud();

    if (timeLeft <= 30 && timeLeft > 0) {
      if (timeLeft % 5 === 0) {
        AudioSynth.playWarning();
      }
    }

    if (timeLeft <= 0) {
      stopPlayTimer();
      triggerContinueCountdown();
    }
  }, 1000);
}

function stopPlayTimer() {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
  const timerHud = document.getElementById('timerHud');
  if (timerHud) timerHud.classList.add('hidden');
}

function triggerContinueCountdown() {
  if (continueTimer) return;

  const continueOverlay = document.getElementById('continueOverlay');
  const continueCountdown = document.getElementById('continueCountdown');

  if (continueOverlay) continueOverlay.classList.remove('hidden');

  if (emulator) {
    emulator.pause().catch(() => { });
    setStatus('Đang chờ đút xu...');
  }

  AudioSynth.playWarning();
  continueCountdownVal = 9;
  if (continueCountdown) continueCountdown.textContent = continueCountdownVal;

  continueTimer = setInterval(() => {
    continueCountdownVal--;
    if (continueCountdown) continueCountdown.textContent = continueCountdownVal;

    if (continueCountdownVal > 0) {
      AudioSynth.playWarning();
    } else {
      stopContinueCountdown();
      AudioSynth.playGameOver();
      showToast('HẾT GIỜ! Game Over!', 'error');
      destroyRunningGame();
    }
  }, 1000);
}

function stopContinueCountdown() {
  if (continueTimer) {
    clearInterval(continueTimer);
    continueTimer = null;
  }
  const continueOverlay = document.getElementById('continueOverlay');
  if (continueOverlay) continueOverlay.classList.add('hidden');
}

async function pauseForControlEditing() {
  if (!emulator || userPausedGame || autoPausedForControls) return;
  try {
    await emulator.pause();
    autoPausedForControls = true;
    setStatus('Đang chỉnh nút - game đã tạm dừng');
  } catch (err) {
    console.warn('Không thể auto-pause khi chỉnh nút', err);
  }
}

async function resumeAfterControlEditing() {
  const continueOverlay = document.getElementById('continueOverlay');
  const waitingForContinue = continueOverlay && !continueOverlay.classList.contains('hidden');
  if (!emulator || userPausedGame || !autoPausedForControls || controlEditMode || waitingForContinue) return;
  try {
    await emulator.resume();
    autoPausedForControls = false;
    setStatus('Đang chạy');
  } catch (err) {
    console.warn('Không thể auto-resume sau khi chỉnh nút', err);
  }
}

function handleInsertCoinContinue() {
  if (CoinSystem.isInfinite() || CoinSystem.coins > 0) {
    if (CoinSystem.consumeCoin()) {
      stopContinueCountdown();
      AudioSynth.playCoin();
      showToast('Đã tiếp tục lượt chơi thành công!');

      const textFloat = document.createElement('div');
      textFloat.className = 'timer-hud-toast';
      textFloat.textContent = CoinSystem.isTestSpeed ? '+20 GIÂY' : '+3 PHÚT';
      document.querySelector('.screen-shell').appendChild(textFloat);
      setTimeout(() => textFloat.remove(), 1200);

      if (emulator) {
        emulator.resume().catch(() => { });
        setStatus('Đang chạy');
      }

      startPlayTimer();
    }
  } else {
    if (continueTimer) {
      clearInterval(continueTimer);
      continueTimer = null;
    }
    showToast('Tài khoản của bạn đã hết xu! Hãy nạp xu để tiếp tục.', 'error');
    openShopModal();
  }
}

function handleExtendPlayTime() {
  if (CoinSystem.isInfinite()) {
    // showToast('Tài khoản Vô Hạn đang kích hoạt!', 'success');
    return;
  }

  if (CoinSystem.coins > 0) {
    if (CoinSystem.consumeCoin()) {
      timeLeft += CoinSystem.isTestSpeed ? 20 : 180;
      AudioSynth.playCoin();

      if (timeLeft > 5940) timeLeft = 5940;

      updateTimerHud();

      const textFloat = document.createElement('div');
      textFloat.className = 'timer-hud-toast';
      textFloat.textContent = CoinSystem.isTestSpeed ? '+20 GIÂY' : '+3 PHÚT';
      document.querySelector('.screen-shell').appendChild(textFloat);
      setTimeout(() => textFloat.remove(), 1200);

      showToast('Đã đút 1 xu, thêm thời gian chơi!');
    }
  } else {
    showToast('Tài khoản của bạn đã hết xu! Hãy nạp thêm.', 'error');
    openShopModal();
  }
}

function openShopModal() {
  const shopModal = document.getElementById('shopModal');
  if (shopModal) shopModal.classList.remove('hidden');
}

function closeShopModal() {
  const shopModal = document.getElementById('shopModal');
  if (shopModal) shopModal.classList.add('hidden');

  const continueOverlay = document.getElementById('continueOverlay');
  if (continueOverlay && !continueOverlay.classList.contains('hidden') && !continueTimer) {
    const continueCountdown = document.getElementById('continueCountdown');
    continueTimer = setInterval(() => {
      continueCountdownVal--;
      if (continueCountdown) continueCountdown.textContent = continueCountdownVal;

      if (continueCountdownVal > 0) {
        AudioSynth.playWarning();
      } else {
        stopContinueCountdown();
        AudioSynth.playGameOver();
        showToast('HẾT GIỜ! Game Over!', 'error');
        destroyRunningGame();
      }
    }, 1000);
  }
}

function initShopHandlers() {
  const shopBtn = document.getElementById('shopBtn');
  const closeShopBtn = document.getElementById('closeShopBtn');
  const tabBuy = document.getElementById('tabBuy');
  const tabGiftcode = document.getElementById('tabGiftcode');
  const tabContentBuy = document.getElementById('tabContentBuy');
  const tabContentGiftcode = document.getElementById('tabContentGiftcode');
  const testSpeedToggle = document.getElementById('testSpeedToggle');
  const cancelPayBtn = document.getElementById('cancelPayBtn');
  const simSuccessBtn = document.getElementById('simSuccessBtn');
  const applyGiftcodeBtn = document.getElementById('applyGiftcodeBtn');

  if (shopBtn) shopBtn.addEventListener('click', openShopModal);
  if (closeShopBtn) closeShopBtn.addEventListener('click', closeShopModal);

  if (tabBuy && tabGiftcode) {
    tabBuy.addEventListener('click', () => {
      tabBuy.classList.add('active');
      tabGiftcode.classList.remove('active');
      tabContentBuy.classList.remove('hidden');
      tabContentGiftcode.classList.add('hidden');
      document.getElementById('paymentPanel').classList.add('hidden');
    });

    tabGiftcode.addEventListener('click', () => {
      tabGiftcode.classList.add('active');
      tabBuy.classList.remove('active');
      tabContentGiftcode.classList.remove('hidden');
      tabContentBuy.classList.add('hidden');
      document.getElementById('paymentPanel').classList.add('hidden');
    });
  }

  const packageCards = document.querySelectorAll('.package-card');
  let selectedPackage = null;

  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      const packageId = card.getAttribute('data-package');
      selectedPackage = packageId;

      const qtyText = card.querySelector('.pack-qty').childNodes[0].textContent.trim();
      const priceText = card.querySelector('.pack-price').textContent;
      const titleText = card.querySelector('.pack-title').textContent;

      document.getElementById('payItemName').textContent = `${titleText} (${qtyText})`;
      document.getElementById('payAmount').textContent = priceText;

      const qrData = `MomoPay_RetroGame_${packageId}_${priceText.replace(/\D/g, '')}`;
      document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

      document.getElementById('paymentPanel').classList.remove('hidden');
      AudioSynth.playCoin();
    });
  });

  if (cancelPayBtn) {
    cancelPayBtn.addEventListener('click', () => {
      document.getElementById('paymentPanel').classList.add('hidden');
    });
  }

  if (simSuccessBtn) {
    simSuccessBtn.addEventListener('click', () => {
      if (selectedPackage === 'package_1') {
        CoinSystem.addCoins(5);
      } else if (selectedPackage === 'package_2') {
        CoinSystem.addCoins(12);
      } else if (selectedPackage === 'package_3') {
        CoinSystem.addCoins(35);
      } else if (selectedPackage === 'package_4') {
        CoinSystem.addCoins(80);
      } else if (selectedPackage === 'package_unlimited') {
        CoinSystem.setInfinite(24);
      }

      document.getElementById('paymentPanel').classList.add('hidden');
      closeShopModal();
      AudioSynth.playSuccess();
    });
  }

  if (testSpeedToggle) {
    testSpeedToggle.addEventListener('change', (e) => {
      CoinSystem.isTestSpeed = e.target.checked;
      CoinSystem.save();
      showToast(CoinSystem.isTestSpeed ? 'Đã bật chế độ test nhanh (1 xu = 20s)' : 'Đã tắt chế độ test nhanh (1 xu = 3 phút)');
    });
  }

  if (applyGiftcodeBtn) {
    applyGiftcodeBtn.addEventListener('click', () => {
      const code = document.getElementById('giftcodeInput').value.trim().toUpperCase();
      const msgEl = document.getElementById('giftcodeMessage');
      if (!msgEl) return;

      if (!code) {
        msgEl.className = 'giftcode-msg error';
        msgEl.textContent = 'Vui lòng nhập mã code!';
        return;
      }

      if (code === 'RETRO2026') {
        CoinSystem.addCoins(10);
        msgEl.className = 'giftcode-msg success';
        msgEl.textContent = 'Mã CODE hợp lệ! Bạn nhận được 10 xu.';
        AudioSynth.playSuccess();
      } else if (code === 'FREECOINS') {
        CoinSystem.addCoins(3);
        msgEl.className = 'giftcode-msg success';
        msgEl.textContent = 'Mã CODE hợp lệ! Bạn nhận được 3 xu.';
        AudioSynth.playSuccess();
      } else if (code === 'INFINITYGAME') {
        CoinSystem.setInfinite(24);
        msgEl.className = 'giftcode-msg success';
        msgEl.textContent = 'Mã CODE hợp lệ! Kích hoạt 24 Giờ Vô Hạn.';
        AudioSynth.playSuccess();
      } else {
        msgEl.className = 'giftcode-msg error';
        msgEl.textContent = 'Mã CODE không tồn tại hoặc đã hết hạn!';
        AudioSynth.playWarning();
      }

      document.getElementById('giftcodeInput').value = '';
    });
  }

  const insertCoinContinueBtn = document.getElementById('insertCoinContinueBtn');
  const exitGameContinueBtn = document.getElementById('exitGameContinueBtn');

  if (insertCoinContinueBtn) {
    insertCoinContinueBtn.addEventListener('click', handleInsertCoinContinue);
  }
  if (exitGameContinueBtn) {
    exitGameContinueBtn.addEventListener('click', () => {
      stopContinueCountdown();
      AudioSynth.playGameOver();
      destroyRunningGame();
    });
  }
}

function initDevRomHandlers() {
  const devTabs = document.querySelectorAll('.dev-tab-btn');
  const romListContainer = document.getElementById('romListContainer');
  const romUrlContainer = document.getElementById('romUrlContainer');
  const romFileContainer = document.getElementById('romFileContainer');
  const romHint = document.getElementById('romHint');

  const romUrlText = document.getElementById('romUrlText');
  const romFile = document.getElementById('romFile');
  const customFileBtn = document.getElementById('customFileBtn');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const coreNameEl = document.getElementById('coreName');

  if (!devTabs.length) return;

  // Handle source tab switches
  devTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      devTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const source = tab.getAttribute('data-source');
      romSource = source;

      // Hide all input groups
      romListContainer.classList.add('hidden');
      romUrlContainer.classList.add('hidden');
      romFileContainer.classList.add('hidden');

      // Show the selected input group
      if (source === 'list') {
        romListContainer.classList.remove('hidden');
        romHint.textContent = 'Chọn game từ danh sách. Một số game có thể cần kèm file BIOS.';
      } else if (source === 'url') {
        romUrlContainer.classList.remove('hidden');
        romHint.textContent = 'Dán đường dẫn trực tiếp tới file ROM (phải truy cập được công khai và hỗ trợ CORS).';
      } else if (source === 'file') {
        romFileContainer.classList.remove('hidden');
        romHint.textContent = 'Tải tệp tin game từ máy tính của bạn (tính năng dev).';
      }
    });
  });

  // Handle file picker button click
  if (customFileBtn && romFile) {
    customFileBtn.addEventListener('click', () => {
      romFile.click();
    });
  }

  // Handle file selection
  if (romFile) {
    romFile.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        fileNameDisplay.textContent = Array.from(files).map(f => f.name).join(', ');
        // Auto detect core from extension
        const ext = files[0].name.split('.').pop().toLowerCase();
        if (ext === 'nes') {
          coreNameEl.value = 'fceumm';
        } else if (ext === 'sfc' || ext === 'smc') {
          coreNameEl.value = 'snes9x';
        } else if (ext === 'swf') {
          coreNameEl.value = 'ruffle';
        }
      } else {
        fileNameDisplay.textContent = 'Chưa chọn file nào';
      }
    });
  }

  // Handle URL change to auto-detect core
  if (romUrlText) {
    romUrlText.addEventListener('input', () => {
      const urlValue = romUrlText.value.trim().toLowerCase();
      if (urlValue.endsWith('.nes')) {
        coreNameEl.value = 'fceumm';
      } else if (urlValue.endsWith('.sfc') || urlValue.endsWith('.smc')) {
        coreNameEl.value = 'snes9x';
      } else if (urlValue.endsWith('.swf')) {
        coreNameEl.value = 'ruffle';
      }
    });
  }
}

const FavoritesSystem = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('arcade_favorites')) || [];
    } catch {
      return [];
    }
  },
  toggle(url) {
    const favs = this.get();
    const index = favs.indexOf(url);
    if (index === -1) {
      favs.push(url);
      showToast('❤️ Đã thêm vào danh sách yêu thích!', 'success');
    } else {
      favs.splice(index, 1);
      showToast('💔 Đã xóa khỏi danh sách yêu thích!', 'success');
    }
    localStorage.setItem('arcade_favorites', JSON.stringify(favs));
  },
  isFavorite(url) {
    return this.get().includes(url);
  }
};

const RecentSystem = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('arcade_recent')) || [];
    } catch {
      return [];
    }
  },
  add(url) {
    if (!url) return;
    let recents = this.get();
    recents = recents.filter(u => u !== url);
    recents.unshift(url);
    if (recents.length > 20) {
      recents = recents.slice(0, 20);
    }
    localStorage.setItem('arcade_recent', JSON.stringify(recents));
  }
};

// Sound Synthesizer Utility for Retro UI Interaction
const RetroSynth = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  playHover() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) { }
  },
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.setValueAtTime(700, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) { }
  }
};

// Global image error handler
window.handleImageError = function (img, title) {
  title = title || img.dataset.title || '';
  img.onerror = null;
  const fallback = document.createElement('div');
  fallback.className = 'card-fallback';
  fallback.innerHTML = `⚡<div class="card-fallback-text">${title.slice(0, 12)}</div>`;
  img.replaceWith(fallback);
};

function initGameLibraryGrid() {
  const romUrlEl = document.querySelector('#romUrl');
  const coreNameEl = document.querySelector('#coreName');
  const gridContainer = document.querySelector('#gameCardsGrid');
  const searchInput = document.querySelector('#gameSearchInput');
  const categoryBtns = document.querySelectorAll('.category-btn');

  const showcaseThumb = document.querySelector('#showcaseThumb');
  const showcaseTitle = document.querySelector('#showcaseTitle');
  const showcaseSystem = document.querySelector('#showcaseSystem');
  const showcaseRom = document.querySelector('#showcaseRom');

  if (!romUrlEl || !gridContainer) return;

  // 1. Arcade Title & Thumbnail Mapping Table loaded dynamically via ES import

  // 2. Predefined high-quality console ROM databases
  const consoleGames = [];

  // Flash games played via Ruffle
  const flashGames = [
    {
      title: 'Strike Force Heroes',
      rom: 'strike-force-heroes--14775',
      url: 'https://cache.armorgames.com/files/games/strike-force-heroes--14775.swf',
      system: 'flash',
      thumbnail: '',
      core: 'ruffle',
    },
    {
      title: 'Jump Run Turtle Odyssey 2',
      rom: 'jump-run-turtle-odyssey-2',
      url: '/ruffle/jump-run-turtle-odyssey-2.swf',
      system: 'flash',
      thumbnail: '',
      core: 'ruffle',
    },
    {
      title: 'Age of War',
      rom: 'age-of-war',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/age-of-war.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Age of War 2',
      rom: 'age-of-war-2-5933',
      url: '/ruffle/age-of-war-2-5933.swf',
      system: 'flash',
      thumbnail: '',
      core: 'ruffle',
    },
    {
      title: 'Kingdom Rush Frontiers',
      rom: 'kingdom-rush-frontie-15717',
      url: '/ruffle/kingdom-rush-frontie-15717.swf',
      system: 'flash',
      thumbnail: '',
      core: 'ruffle',
    },
    {
      title: 'Age of Defense 8',
      rom: 'age-of-defense-8',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/age-of-defense-8.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloons Tower Defence 2',
      rom: 'bloons-tower-defence-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloons-tower-defence-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloons Tower Defence 3',
      rom: 'bloons-tower-defence-3',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloons-tower-defence-3.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloons Tower Defence 4',
      rom: 'bloons-tower-defence-4',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloons-tower-defence-4.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloons Tower Defence',
      rom: 'bloons-tower-defence',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloons-tower-defence.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloons',
      rom: 'bloons',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloons.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bloxorz',
      rom: 'bloxorz',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bloxorz.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Bob the Robber',
      rom: 'bob-the-robber',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/bob-the-robber.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Checkers',
      rom: 'checkers',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/checkers.swf',
    },
    {
      title: 'Commando 2 (Miniclip)',
      rom: 'commando-2-by-miniclip',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/commando-2-by-miniclip.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Commando',
      rom: 'commando',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/commando.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: "Dad 'n Me",
      rom: 'dad-n-me',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/dad-n-me.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: "Don't Escape",
      rom: 'dont-escape',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/dont-escape.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
    {
      title: 'Fish Tales 2',
      rom: 'fish-tales-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/fish-tales-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Fish Tales Deluxe Edition',
      rom: 'fish-tales-deluxe-edition',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/fish-tales-deluxe-edition.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Flash Sonic',
      rom: 'flash-sonic',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/flash-sonic.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Gotham City Rush',
      rom: 'gotham-city-rush',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/gotham-city-rush.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Mad Arrow',
      rom: 'mad-arrow',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/mad-arrow.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Pac-Man (Flash)',
      rom: 'pacman-flash',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/pacman.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: "Papa's Pizzeria",
      rom: 'papas-pizzeria',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/papas-pizzeria.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
    {
      title: 'PC Breakdown',
      rom: 'pc-breakdown',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/pc-breakdown.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Penguin Diner',
      rom: 'penguin-diner',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/penguin-diner.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
    {
      title: 'Pipe Riders',
      rom: 'pipe-riders',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/pipe-riders.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Pocket Fighter Nova (Updated)',
      rom: 'pocket-fighter-nova-updated',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/pocket-fighter-nova-updated.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Pocket Fighter Nova',
      rom: 'pocket-fighter-nova',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/pocket-fighter-nova.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Portal Flash',
      rom: 'portal-flash',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/portal-flash.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Rollercoaster Creator',
      rom: 'rollercoaster-creator',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/rollercoaster-creator.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: "Rubik's Cube",
      rom: 'rubiks-cube',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/rubiks-cube.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Scrap Metal Heroes',
      rom: 'scrap-metal-heroes',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/scrap-metal-heroes.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Shopping Cart Hero',
      rom: 'shopping-cart-hero',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/shopping-cart-hero.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Stick RPG',
      rom: 'stick-rpg',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/stick-rpg.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Strikeforce Kitty 2',
      rom: 'strikeforce-kitty-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/strikeforce-kitty-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Strikeforce Kitty: Last Stand',
      rom: 'strikeforce-kitty-last-stand',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/strikeforce-kitty-last-stand.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Strikeforce Kitty League',
      rom: 'strikeforce-kitty-league',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/strikeforce-kitty-league.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Strikeforce Kitty',
      rom: 'strikeforce-kitty',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/strikeforce-kitty.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Super Mario Flash (SMFCreator)',
      rom: 'super-mario-flash-by-smfcreator',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/super-mario-flash-by-smf_creator.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'The Fancy Pants Adventure 1',
      rom: 'the-fancy-pants-adventure-1',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/the-fancy-pants-adventure-1.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'The Fancy Pants Adventure 2',
      rom: 'the-fancy-pants-adventure-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/the-fancy-pants-adventure-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: "The World's Hardest Game",
      rom: 'the-worlds-hardest-game',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/the-world\'s-hardest-game.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Toxic 2',
      rom: 'toxic-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/toxic-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Truck Loader 2',
      rom: 'truck-loader-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/truck-loader-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Truck Loader 3',
      rom: 'truck-loader-3',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/truck-loader-3.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Truck Loader 4',
      rom: 'truck-loader-4',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/truck-loader-4.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Truck Loader 5',
      rom: 'truck-loader-5',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/truck-loader-5.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Truck Loader',
      rom: 'truck-loader',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/truck-loader.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },

    {
      title: 'Super Mario Flash 4',
      rom: 'super-mario-flash-4',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/super-mario-flash-4.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',
    },
    {
      title: 'Sugar Sugar 2',
      rom: 'sugar-sugar-2',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/sugar-sugar-2.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
    {
      title: 'Sugar Sugar 3',
      rom: 'sugar-sugar-3',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/sugar-sugar-3.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
    {
      title: 'Sugar Sugar',
      rom: 'sugar-sugar',
      url: 'https://raw.githubusercontent.com/AmmarSAA/Flash-Games-Directory/main/sugar-sugar.swf',
      system: 'flash', thumbnail: '', core: 'ruffle',

    },
  ];

  // 3. Dynamically parse Arcade options from DOM select
  const arcadeOptions = Array.from(romUrlEl.querySelectorAll('option'));
  const arcadeGames = arcadeOptions.map(opt => {
    const value = opt.value;
    const romName = opt.text.trim();
    const arcadeMeta = ARCADE_MAP[romName] || null;
    const cleanTitle = arcadeMeta?.title || (romName.charAt(0).toUpperCase() + romName.slice(1));
    const thumbnail = arcadeMeta?.thumbnail || '';
    return {
      title: cleanTitle,
      rom: romName,
      url: value,
      system: 'arcade',
      thumbnail,
      core: 'fbneo'
    };
  });

  ALL_FLASH_GAMES = flashGames;
  const allGames = [...arcadeGames, ...consoleGames, ...flashGames];
  let activeSystemFilter = 'all';
  let activeSearchQuery = '';
  let currentlySelectedUrl = romUrlEl.value;

  // 4. Update Chosen Game Showcase Card details
  function updateShowcase(game) {
    if (!game) {
      showcaseTitle.textContent = "Chưa chọn game nào";
      showcaseSystem.textContent = "NONE";
      showcaseRom.textContent = "...";
      showcaseThumb.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='65' viewBox='0 0 90 65'><rect width='100%' height='100%' fill='%23111'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2300ffcc' font-family='Courier' font-size='10' font-weight='bold'>🕹️ RETRO</text></svg>";
      return;
    }
    showcaseTitle.textContent = game.title;
    showcaseSystem.textContent = game.system.toUpperCase();
    showcaseRom.textContent = game.rom + (game.system === 'arcade' ? '.zip' : '');
    showcaseThumb.src = game.thumbnail;

    showcaseThumb.onerror = function () {
      showcaseThumb.onerror = null;
      showcaseThumb.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='65' viewBox='0 0 90 65'><rect width='100%' height='100%' fill='%23222'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2300ffcc' font-family='Courier' font-size='10' font-weight='bold'>🎮 PLAY</text></svg>";
    };
  }

  // 5. Select a game (handles tab syncing and option mapping)
  function selectGame(game, playFeedback = true) {
    if (playFeedback) {
      RetroSynth.playClick();
    }
    currentlySelectedUrl = game.url;

    let optionEl = Array.from(romUrlEl.options).find(opt => opt.value === game.url);
    if (!optionEl) {
      const newOpt = document.createElement('option');
      newOpt.value = game.url;
      newOpt.textContent = game.rom;
      romUrlEl.appendChild(newOpt);
    }

    romUrlEl.value = game.url;
    if (coreNameEl) {
      coreNameEl.value = game.core;
    }

    romUrlEl.dispatchEvent(new Event('change'));
    updateShowcase(game);

    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('type', game.system);
    urlParams.set('id', game.rom);
    urlParams.delete('game');
    history.replaceState(null, '', '?' + urlParams.toString());

    window._currentGame = { type: game.system, id: game.rom, title: game.title, url: game.url };
    ParentBridge.post('retro:gameSelected', { type: game.system, id: game.rom, title: game.title });

    const cards = gridContainer.querySelectorAll('.game-card');
    cards.forEach(card => {
      if (card.getAttribute('data-url') === game.url) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.classList.remove('active');
      }
    });

    if (playFeedback) {
      showToast(`🎯 Đã chọn: ${game.title} (${game.system.toUpperCase()})!`, 'success');
    }
  }

  // 6. Draw scrollable grid cards list
  function renderGames() {
    gridContainer.innerHTML = '';

    const query = activeSearchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
    let filtered = [];

    if (activeSystemFilter === 'favorite') {
      const favs = FavoritesSystem.get();
      filtered = allGames.filter(g => favs.includes(g.url));
    } else if (activeSystemFilter === 'recent') {
      const recents = RecentSystem.get();
      filtered = recents
        .map(url => allGames.find(g => g.url === url))
        .filter(Boolean);
    } else {
      filtered = allGames.filter(game => {
        return activeSystemFilter === 'all' || game.system === activeSystemFilter;
      });
    }

    if (query) {
      filtered = filtered.filter(game => {
        return game.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query) ||
          game.rom.toLowerCase().replace(/[^a-z0-9]/g, '').includes(query);
      });
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #666; padding: 20px; font-size: 12px; font-family: sans-serif;">
          Không tìm thấy game nào phù hợp 👾
        </div>
      `;
      return;
    }

    filtered.forEach(game => {
      const card = document.createElement('div');
      const isFav = FavoritesSystem.isFavorite(game.url);
      card.className = `game-card ${game.url === currentlySelectedUrl ? 'active' : ''}`;
      card.setAttribute('data-url', game.url);

      card.innerHTML = `
        <div class="card-thumb-wrapper">
          <img class="card-thumb" src="${game.thumbnail}" loading="lazy" data-title="${game.title.replace(/"/g, '&quot;')}" onerror="handleImageError(this)" />
          <button type="button" class="card-fav-btn ${isFav ? 'active' : ''}" data-url="${game.url}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-info">
          <h4 class="card-title">${game.title}</h4>
          <div class="card-info-bottom">
            <span class="card-system-badge">${game.system}</span>
            <div class="card-play-btn">▶</div>
          </div>
        </div>
        <div class="play-hint-tooltip">Double Click để chơi</div>
      `;

      card.addEventListener('mouseenter', () => {
        RetroSynth.playHover();
      });

      let pointerStartX = 0;
      let pointerStartY = 0;
      let isDragging = false;

      card.addEventListener('pointerdown', (e) => {
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;
        isDragging = false;
      });

      card.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientX - pointerStartX) > 10 || Math.abs(e.clientY - pointerStartY) > 10) {
          isDragging = true;
        }
      });

      let lastClick = 0;
      card.addEventListener('click', (e) => {
        if (isDragging) {
          e.preventDefault();
          return;
        }

        const currentTime = new Date().getTime();
        const clickLength = currentTime - lastClick;

        selectGame(game);

        if (clickLength < 300 && clickLength > 0) {
          launchGame();
        }
        lastClick = currentTime;
      });

      const favBtn = card.querySelector('.card-fav-btn');
      if (favBtn) {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          FavoritesSystem.toggle(game.url);
          RetroSynth.playClick();
          renderGames();
        });
      }

      const playBtn = card.querySelector('.card-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectGame(game);
          launchGame();
        });
      }

      gridContainer.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim();
      renderGames();
    });
  }

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSystemFilter = btn.getAttribute('data-system');
      RetroSynth.playClick();
      renderGames();
    });
  });

  renderGames();

  if (allGames.length > 0) {
    const defaultGame = allGames.find(g => g.url === romUrlEl.value) || allGames[0];
    selectGame(defaultGame, false);
  }

  romUrlEl.addEventListener('change', () => {
    const currentUrl = romUrlEl.value;
    if (currentUrl !== currentlySelectedUrl) {
      const game = allGames.find(g => g.url === currentUrl);
      if (game) {
        selectGame(game, false);
      } else {
        currentlySelectedUrl = currentUrl;
        const romName = romUrlEl.options[romUrlEl.selectedIndex]?.text?.trim() || '';
        const arcadeMeta = ARCADE_MAP[romName] || null;
        const title = arcadeMeta?.title || romName || "Tùy chọn";
        updateShowcase({
          title,
          rom: romName || title,
          url: currentUrl,
          system: 'custom',
          thumbnail: arcadeMeta?.thumbnail || '',
          core: coreNameEl.value
        });
      }
    }
  });

  window._retroLib = { allGames, selectGame };
}

// Call state initializer on boot
setTimeout(() => {
  CoinSystem.load();
  initShopHandlers();
  Confetti.init();
  initGameLibraryGrid();
  if (isDev) {
    initDevRomHandlers();
  }
}, 100);

const screenShellEl = document.querySelector('.screen-shell');
const statusEl = document.querySelector('#status');
const logEl = document.querySelector('#log');
const romUrlEl = document.querySelector('#romUrl');
const coreNameEl = document.querySelector('#coreName');
const launchBtn = document.querySelector('#launchBtn');
const sidebarLaunchBtn = document.querySelector('#sidebarLaunchBtn');
const pauseBtn = document.querySelector('#pauseBtn');
const resumeBtn = document.querySelector('#resumeBtn');
const exitBtn = document.querySelector('#exitBtn');
const saveBtn = document.querySelector('#saveBtn');
const loadBtn = document.querySelector('#loadBtn');
const shareBtn = document.querySelector('#shareBtn');
const settingsBtn = document.querySelector('#settingsBtn');
const restoreControlsBtn = document.querySelector('#restoreControlsBtn');
const addCustomControlBtn = document.querySelector('#addCustomControlBtn');
const customControlModal = document.querySelector('#customControlModal');
const customControlForm = document.querySelector('#customControlForm');
const closeCustomControlModalBtn = document.querySelector('#closeCustomControlModalBtn');
const customControlName = document.querySelector('#customControlName');
const customActionList = document.querySelector('#customActionList');
const addCustomActionRowBtn = document.querySelector('#addCustomActionRowBtn');
const customizeControlsBtn = document.querySelector('#customizeControlsBtn');
const controlsBar = document.querySelector('.controls-bar');
const controlsBarContent = document.querySelector('#controlsBarContent');
const headerControls = document.querySelector('.header-controls');
const virtualGamepad = document.querySelector('.virtual-gamepad');

function setStatus(text) {
  statusEl.textContent = text;
}

function setLog(message) {
  logEl.textContent = message;
  logEl.scrollTop = logEl.scrollHeight;
}

function setControlState(running) {
  saveBtn.disabled = !running;
  loadBtn.disabled = !running;
  pauseBtn.disabled = !running;
  resumeBtn.disabled = !running;
  exitBtn.disabled = !running;
  if (shareBtn) shareBtn.disabled = !running;
  if (running) {
    userPausedGame = false;
    autoPausedForControls = false;
    document.body.classList.add('playing');
    if (settingsBtn && controlsBarContent && settingsBtn.parentElement !== controlsBarContent) {
      controlsBarContent.insertBefore(settingsBtn, controlsBarContent.firstElementChild);
    }
    if (restoreControlsBtn && controlsBarContent && restoreControlsBtn.parentElement !== controlsBarContent) {
      settingsBtn?.after(restoreControlsBtn);
    }
    if (addCustomControlBtn && controlsBarContent && addCustomControlBtn.parentElement !== controlsBarContent) {
      restoreControlsBtn?.after(addCustomControlBtn);
    }
    // Keep flash controls group after exit-actions
    const flashBarGroup = controlsBarContent?.querySelector('.flash-controls-bar-group');
    if (flashBarGroup) controlsBarContent.appendChild(flashBarGroup);
    applySavedControlLayout();
  } else {
    userPausedGame = false;
    autoPausedForControls = false;
    document.body.classList.remove('playing');
    document.body.classList.remove('flash-mode');
    document.body.classList.remove('flash-no-buttons');
    document.body.classList.remove('mouse-mode');
    const vmouseToggle = document.getElementById('vmouseToggle');
    if (vmouseToggle) vmouseToggle.checked = false;
    setControlEditMode(false);
    if (flashEditMode) setFlashEditMode(false);
    if (settingsBtn && headerControls && settingsBtn.parentElement !== headerControls) {
      headerControls.appendChild(settingsBtn);
    }
    if (restoreControlsBtn && headerControls && restoreControlsBtn.parentElement !== headerControls) {
      headerControls.appendChild(restoreControlsBtn);
    }
    if (addCustomControlBtn && controlsBarContent && addCustomControlBtn.parentElement !== controlsBarContent) {
      controlsBarContent.insertBefore(addCustomControlBtn, document.querySelector('.exit-actions'));
    }
    clearControlLayoutStyles(true);
    restoreControlParents();
  }
}

async function destroyRunningGame() {
  stopPlayTimer();
  stopContinueCountdown();
  // Host đóng game (hoặc máy 2 thoát màn hình xem) thì dừng stream luôn
  if (NetStream.mode) NetStream.stop(true);

  if (!emulator) {
    if (flashEditMode) setFlashEditMode(false);
    screenShellEl.innerHTML = `
        <!-- Continue Overlay -->
        <div id="continueOverlay" class="continue-overlay hidden">
          <div class="continue-box">
            <h2 class="continue-title">CONTINUE?</h2>
            <div id="continueCountdown" class="continue-number">9</div>
            <p class="continue-hint">Nhấn [Shift] để tiếp tục</p>
            <div class="continue-actions">
              <button id="insertCoinContinueBtn" class="primary neon-btn">Tiếp Tục Chơi (Miễn Phí)</button>
              <button id="exitGameContinueBtn" class="secondary">Thoát Game</button>
            </div>
          </div>
        </div>
        <canvas id="game" style="width: 100%; height: 100%;"></canvas>
    `;
    const insertCoinContinueBtn = document.getElementById('insertCoinContinueBtn');
    const exitGameContinueBtn = document.getElementById('exitGameContinueBtn');
    if (insertCoinContinueBtn) insertCoinContinueBtn.addEventListener('click', handleInsertCoinContinue);
    if (exitGameContinueBtn) exitGameContinueBtn.addEventListener('click', () => {
      stopContinueCountdown();
      AudioSynth.playGameOver();
      destroyRunningGame();
    });
    return;
  }

  try {
    await emulator.exit();
  } catch (error) {
    console.warn('Lỗi khi thoát:', error);
  }

  emulator = null;
  screenShellEl.innerHTML = `
      <!-- Continue Overlay -->
      <div id="continueOverlay" class="continue-overlay hidden">
        <div class="continue-box">
          <h2 class="continue-title">CONTINUE?</h2>
          <div id="continueCountdown" class="continue-number">9</div>
          <p class="continue-hint">Nhấn [Shift] để tiếp tục</p>
          <div class="continue-actions">
            <button id="insertCoinContinueBtn" class="primary neon-btn">Tiếp Tục Chơi (Miễn Phí)</button>
            <button id="exitGameContinueBtn" class="secondary">Thoát Game</button>
          </div>
        </div>
      </div>
      <canvas id="game" style="width: 100%; height: 100%;"></canvas>
  `;

  const insertCoinContinueBtn = document.getElementById('insertCoinContinueBtn');
  const exitGameContinueBtn = document.getElementById('exitGameContinueBtn');
  if (insertCoinContinueBtn) insertCoinContinueBtn.addEventListener('click', handleInsertCoinContinue);
  if (exitGameContinueBtn) exitGameContinueBtn.addEventListener('click', () => {
    stopContinueCountdown();
    AudioSynth.playGameOver();
    destroyRunningGame();
  });

  if (flashEditMode) setFlashEditMode(false);
  activeFlashGameId = null;
  resetFlashButtonLayout();
  setControlState(false);
  setStatus('Đang chờ...');
}

function detectBiosForRom(romUrl) {
  const urlLower = String(romUrl).toLowerCase();
  const biosList = [];

  if (
    urlLower.includes('sengoku') ||
    urlLower.includes('kof') ||
    urlLower.includes('mslug') ||
    urlLower.includes('neogeo') ||
    urlLower.includes('samsho') ||
    urlLower.includes('fatfury') ||
    urlLower.includes('bstars') ||
    urlLower.includes('lastblad') ||
    urlLower.includes('pulstar') ||
    urlLower.includes('viewpoin') ||
    urlLower.includes('wakuwak7') ||
    urlLower.includes('rotd') ||
    urlLower.includes('matrimec') ||
    urlLower.includes('doubledr') ||
    urlLower.includes('double')
  ) {
    biosList.push('neogeo.zip');
  }

  if (
    urlLower.includes('kov') ||
    urlLower.includes('pgm') ||
    urlLower.includes('ddp2') ||
    urlLower.includes('dmnfrnt') ||
    urlLower.includes('demon') ||
    urlLower.includes('martymcl') ||
    urlLower.includes('olds') ||
    urlLower.includes('svg')
  ) {
    biosList.push('pgm.zip');
  }

  return biosList;
}

async function launchGame() {
  if (isLaunching) return;

  // Trong phòng 2 máy, chỉ host (Player 1) chọn game. Máy 2 bấm Tải Game
  // thì xin host gửi game hiện tại thay vì tự tải game khác trận.
  if (NetPlay.active && NetPlay.role === 2 && !netplayLaunchFromHost) {
    if (NetStream.mode === 'view') {
      showToast('Bạn đang chơi trực tiếp qua stream từ host — không cần tải game.', 'success');
      return;
    }
    // Xin host mở stream; host không stream được sẽ tự chuyển sang gửi game
    NetPlay.send({ type: 'stream-request' });
    showToast('Trong phòng 2 máy, host (Player 1) là người chọn game — đã xin vào trận của host.', 'success');
    return;
  }

  isLaunching = true;

  const activeCard = document.querySelector('.game-card.active');
  const activePlayBtn = activeCard ? activeCard.querySelector('.card-play-btn') : null;
  if (activePlayBtn) {
    activePlayBtn.classList.add('loading');
    activePlayBtn.innerHTML = '↻';
  }

  function resetLaunchState() {
    isLaunching = false;
    if (activePlayBtn) {
      activePlayBtn.classList.remove('loading');
      activePlayBtn.innerHTML = '▶';
    }
  }

  if (!CoinSystem.isInfinite() && CoinSystem.coins <= 0) {
    AudioSynth.playWarning();
    showToast('Tài khoản của bạn đã hết xu! Hãy nạp thêm xu để chơi game.', 'error');
    openShopModal();
    resetLaunchState();
    return;
  }

  let rom;
  let romLogName = '';
  let bios = [];
  const core = coreNameEl.value;

  if (isDev && romSource === 'file') {
    const romFileEl = document.getElementById('romFile');
    const files = romFileEl ? Array.from(romFileEl.files) : [];
    if (files.length === 0) {
      setStatus('Thiếu ROM');
      setLog('Bạn cần chọn file ROM từ máy tính trước khi tải game.');
      resetLaunchState();
      return;
    }

    const biosNames = ['qsound.zip', 'pgm.zip', 'neogeo.zip'];
    const romFiles = [];
    const biosFiles = [];
    for (const f of files) {
      if (biosNames.includes(f.name.toLowerCase())) {
        biosFiles.push(f);
      } else {
        romFiles.push(f);
      }
    }

    if (romFiles.length === 0) {
      setStatus('Thiếu ROM');
      setLog('Bạn cần chọn file ROM game (không phải chỉ file BIOS).');
      resetLaunchState();
      return;
    }

    rom = romFiles.length === 1 ? romFiles[0] : romFiles;
    bios = biosFiles;
    romLogName = files.map(f => f.name).join(', ');
  } else if (isDev && romSource === 'url') {
    const romUrlTextEl = document.getElementById('romUrlText');
    const customUrl = romUrlTextEl ? romUrlTextEl.value.trim() : '';
    if (!customUrl) {
      setStatus('Thiếu ROM');
      setLog('Bạn cần nhập đường dẫn ROM trước khi tải game.');
      resetLaunchState();
      return;
    }
    rom = customUrl;
    romLogName = customUrl;
    bios = detectBiosForRom(customUrl);
  } else {
    const romUrlRaw = romUrlEl.value.trim();
    if (!romUrlRaw) {
      setStatus('Thiếu ROM');
      setLog('Bạn cần chọn ROM từ danh sách trước khi tải game.');
      resetLaunchState();
      return;
    }
    const romUrls = romUrlRaw.split('\n').map(u => u.trim()).filter(u => u);
    rom = romUrls.length === 1 ? romUrls[0] : romUrls;
    romLogName = romUrlRaw;

    const allBios = [];
    for (const rUrl of romUrls) {
      const bList = detectBiosForRom(rUrl);
      for (const b of bList) {
        if (!allBios.includes(b)) {
          allBios.push(b);
        }
      }
    }
    bios = allBios;
  }

  const originalBtnHtml = launchBtn.innerHTML;
  launchBtn.disabled = true;
  launchBtn.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><span class="spinner"></span> Đang tải...</div>';

  let originalSidebarBtnHtml = '';
  if (sidebarLaunchBtn) {
    originalSidebarBtnHtml = sidebarLaunchBtn.innerHTML;
    sidebarLaunchBtn.disabled = true;
    sidebarLaunchBtn.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;"><span class="spinner"></span> Đang tải...</div>';
  }

  setStatus('Đang tải...');

  const logText = [
    'Đang khởi động game...',
    `Core: ${core}`,
    `ROM: ${romLogName}`,
  ];
  if (bios && bios.length > 0) {
    const biosNamesStr = isDev && romSource === 'file'
      ? bios.map(f => f.name).join(', ')
      : bios.join(', ');
    logText.push(`BIOS: ${biosNamesStr}`);
  }
  logText.push(
    '',
    'Lưu ý nếu gặp lỗi:',
    '- File ROM phải truy cập được (Public).',
    '- Máy chủ chứa ROM phải hỗ trợ CORS.',
    '- ROM set phải tương thích chuẩn với Core.'
  );
  if (bios && bios.length > 0 && romSource !== 'file') {
    logText.push(`- Đảm bảo các file BIOS (${bios.join(', ')}) đã được đặt trong thư mục public/ hoặc public/roms/`);
  }
  setLog(logText.join('\n'));

  // Ensure BIOS files are copied to the ROM directory as well, since arcade cores (like FBNeo)
  // frequently look for parent ROMs and BIOS files in the same directory as the game ROM.
  let finalRom = rom;
  let finalBios = [];
  if (romSource === 'file') {
    const romFiles = Array.isArray(rom) ? rom : [rom];
    if (bios && bios.length > 0) {
      finalRom = [...romFiles, ...bios];
      finalBios = bios;
    }
  } else if (bios && bios.length > 0) {
    const romUrls = Array.isArray(rom) ? [...rom] : [rom];
    const biosUrls = [];
    for (const b of bios) {
      // Resolve the BIOS path/URL
      let resolvedPath = `/${b}`;
      try {
        const response = await fetch(`/roms/${b}`, { method: 'HEAD' });
        if (response.ok) {
          resolvedPath = `/roms/${b}`;
        }
      } catch (e) { }
      if (!romUrls.includes(resolvedPath)) {
        romUrls.push(resolvedPath);
      }
      biosUrls.push(resolvedPath);
    }
    finalRom = romUrls;
    finalBios = biosUrls;
  }

  await destroyRunningGame();

  // Ruffle Flash Player branch
  if (core === 'ruffle') {
    const swfUrl = typeof rom === 'string' ? rom : (Array.isArray(rom) ? rom[0] : '');
    try {
      const ruffle = window.RufflePlayer?.newest();
      if (!ruffle) throw new Error('Ruffle player chưa tải. Vui lòng tải lại trang.');

      const player = ruffle.createPlayer();
      player.style.cssText = 'width:100%;height:100%;display:block;';

      const gameCanvas = document.getElementById('game');
      if (gameCanvas) gameCanvas.replaceWith(player);
      window.RufflePlayer.config = {
        // Merge with any existing config, such as the user's extension config. Options you set below will have priority.
        ...window.RufflePlayer.config,

        // Options affecting the whole page
        "publicPath": undefined,
        "polyfills": true,

        // Options affecting files only
        "allowScriptAccess": true, // Polyfill elements have a different default value, see the allowScriptAccess section
        "autoplay": "auto",
        "unmuteOverlay": "visible",
        "backgroundColor": '#000000',
        "wmode": "window",
        "letterbox": "fullscreen",
        "warnOnUnsupportedContent": true,
        "contextMenu": "off",
        "showSwfDownload": false,
        "upgradeToHttps": window.location.protocol === "https:",
        "maxExecutionDuration": 15,
        "logLevel": "error",
        "base": null,
        "menu": true,
        "salign": "",
        "forceAlign": true,
        "scale": "showAll",
        "forceScale": true,
        "frameRate": null,
        "quality": "high",
        "splashScreen": true,
        "preferredRenderer": null,
        "openUrlMode": "allow",
        "allowNetworking": "all",
        "favorFlash": true,
        "playerVersion": 32,
        "socketProxy": [],
        "fontSources": [],
        "defaultFonts": {},
        "credentialAllowList": [],
        "playerRuntime": "flashPlayer",
        "allowFullscreen": true,
        "fullScreenAspectRatio": "",
        "backgroundExecutionMode": "none",
      };
      await player.load({ url: swfUrl, allowScriptAccess: true, allowFullscreen: true, scale: 'showAll', letterbox: 'off', backgroundColor: '#000000' });

      emulator = {
        async pause() { player.pause(); },
        async resume() { player.play(); },
        async exit() { },
        async saveState() { throw new Error('Flash không hỗ trợ Save State'); },
        async loadState() { throw new Error('Flash không hỗ trợ Load State'); },
      };

      setStatus('Đang chạy');
      setLog(['Tải Flash thành công!', `ROM: ${romLogName}`, '', 'Ruffle đang chạy file .swf.'].join('\n'));
      ParentBridge.post('retro:gameLaunched', window._currentGame || {});
      CoinSystem.consumeCoin();
      startPlayTimer();
      RecentSystem.add(swfUrl);
      setControlState(true);
      document.body.classList.add('flash-mode');
      document.body.classList.toggle('flash-no-buttons', flashButtonsHidden);
      activeFlashGameId = swfUrl;
      loadAndApplyFlashLayout(swfUrl);
    } catch (error) {
      emulator = null;
      setControlState(false);
      setStatus('Lỗi');
      setLog(['Không thể khởi động Flash game.', '', `Lỗi: ${error?.message || String(error)}`].join('\n'));
    } finally {
      launchBtn.disabled = false;
      launchBtn.innerHTML = originalBtnHtml || 'Tải Game';
      if (sidebarLaunchBtn) {
        sidebarLaunchBtn.disabled = false;
        sidebarLaunchBtn.innerHTML = originalSidebarBtnHtml || 'Bắt Đầu Chơi';
      }
      resetLaunchState();
    }
    return;
  }

  try {
    const launchOptions = {
      element: '#game',
      core,
      rom: finalRom,
      bios: finalBios,

      async beforeLaunch(nostalgist) {
        const fs = nostalgist.getEmscriptenFS();

        function forceDirectories(path) {
          const parts = path.split('/').filter(p => p);
          let current = '';
          for (const part of parts) {
            current += '/' + part;
            try {
              fs.mkdir(current);
            } catch (e) { }
          }
        }

        async function downloadAndWriteFile(url, destPath) {
          try {
            console.log(`[App] Downloading parent/BIOS: ${url} to ${destPath}...`);
            const response = await fetch(url);
            if (!response.ok) {
              console.error(`[App] Failed to download ${url}: ${response.status}`);
              return;
            }
            const buffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);

            const dir = destPath.substring(0, destPath.lastIndexOf('/'));
            forceDirectories(dir);

            fs.writeFile(destPath, uint8Array);
            console.log(`[App] Wrote ${uint8Array.length} bytes to ${destPath}`);
          } catch (err) {
            console.error(`[App] Error downloading/writing ${url}:`, err);
          }
        }

        const currentRom = typeof rom === 'string' ? rom.toLowerCase() : '';
        if (currentRom.includes('kov100hk') || currentRom.includes('kovplus')) {
          await downloadAndWriteFile('/roms/kov.zip', '/home/web_user/retroarch/userdata/content/kov.zip');
          await downloadAndWriteFile('/roms/kov.zip', '/home/web_user/retroarch/userdata/content/kov');
        }
        if (currentRom.includes('oldsplusp')) {
          await downloadAndWriteFile('/roms/olds.zip', '/home/web_user/retroarch/userdata/content/olds.zip');
          await downloadAndWriteFile('/roms/olds.zip', '/home/web_user/retroarch/userdata/content/olds');
        }

        if (
          currentRom.includes('kov') ||
          currentRom.includes('ddp2') ||
          currentRom.includes('dmnfrnt') ||
          currentRom.includes('demon')
        ) {
          await downloadAndWriteFile('/roms/pgm.zip', '/home/web_user/retroarch/userdata/system/pgm.zip');
          await downloadAndWriteFile('/roms/pgm.zip', '/home/web_user/retroarch/userdata/system/pgm');
        }
      },

      emscriptenModule: {
        print(str) {
          console.log(`[RetroArch] ${str}`);
        },
        printErr(str) {
          console.error(`[RetroArch] ${str}`);
        }
      },

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
        log_verbosity: true,
        libretro_log_level: 0,

        // Native keyboard mappings: player do máy này điều khiển nhận bộ phím
        // LOCAL (w/a/s/d, i/j/k/l...), player còn lại nhận bộ REMOTE. Tránh dùng
        // 'num1'..'num9' trong bind vì Nostalgist dịch sai thành phím Numpad
        // trong khi RetroArch hiểu là phím số hàng trên.
        ...buildPlayerKeyBinds(),
      },
      onLaunch() {
        setStatus('Đang chạy');
        setLog([
          'Tải thành công!',
          `Core: ${core}`,
          `ROM: ${romLogName}`,
          '',
          'Bạn có thể dùng nút Tạm Dừng/Tiếp Tục để quản lý tiến trình.'
        ].join('\n'));

        CoinSystem.consumeCoin();
        startPlayTimer();

        // Record played game in recents
        if (typeof rom === 'string') {
          RecentSystem.add(rom);
        } else if (Array.isArray(rom) && rom.length > 0) {
          RecentSystem.add(rom[0]);
        }
      },
    };

    if (bios && bios.length > 0) {
      launchOptions.bios = bios;
      launchOptions.resolveBios = async function (biosName) {
        try {
          const response = await fetch(`/roms/${biosName}`, { method: 'HEAD' });
          if (response.ok) {
            return `/roms/${biosName}`;
          }
        } catch (e) {
          // Fallback if fetch fails
        }
        return `/${biosName}`;
      };
    }

    emulator = await Nostalgist.launch(launchOptions);

    // Netplay: nhớ game đang chạy để khi máy 2 vào phòng sau thì host gửi
    // cho họ tự tải theo (chỉ sync được ROM dạng URL, không sync file local)
    const romIsSyncable = typeof rom === 'string' || (Array.isArray(rom) && rom.every((r) => typeof r === 'string'));
    netplayLastLaunch = romIsSyncable ? { rom, core } : null;
    if (NetPlay.active && NetPlay.role === 1) {
      // Ưu tiên stream WebRTC (máy 2 xem trực tiếp, chơi được cả ROM file
      // local); không mở được thì gửi 'launch' cho máy 2 tự tải như cũ
      if (!netplayStartStream() && romIsSyncable) NetPlay.send({ type: 'launch', rom, core });
    }
    // Máy 2 vừa tải game xong thì xin savestate của host để 2 màn hình
    // giống nhau, sau đó Player 2 tự nhét xu/bấm bắt đầu để vào chơi
    if (NetPlay.active && NetPlay.role === 2) {
      setTimeout(() => {
        if (emulator && NetPlay.active && NetPlay.role === 2) {
          NetPlay.send({ type: 'state-request' });
        }
      }, 1500);
    }

    ParentBridge.post('retro:gameLaunched', window._currentGame || {});
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
    launchBtn.innerHTML = originalBtnHtml || 'Tải Game';
    if (sidebarLaunchBtn) {
      sidebarLaunchBtn.disabled = false;
      sidebarLaunchBtn.innerHTML = originalSidebarBtnHtml || 'Bắt Đầu Chơi';
    }
    resetLaunchState();
  }
}

launchBtn.addEventListener('click', launchGame);
if (sidebarLaunchBtn) {
  sidebarLaunchBtn.addEventListener('click', launchGame);
}

pauseBtn.addEventListener('click', async () => {
  if (!emulator) return;
  await emulator.pause();
  userPausedGame = true;
  autoPausedForControls = false;
  setStatus('Đã tạm dừng');
  setLog('Game đã được tạm dừng.');
});

resumeBtn.addEventListener('click', async () => {
  if (!emulator) return;
  await emulator.resume();
  userPausedGame = false;
  autoPausedForControls = false;
  setStatus('Đang chạy');
  setLog('Tiếp tục chơi game.');
});

exitBtn.addEventListener('click', async () => {
  await destroyRunningGame();
  setLog('Đã thoát game và dọn dẹp giả lập.');
});

saveBtn.addEventListener('click', async () => {
  if (!emulator) return;
  try {
    const state = await emulator.saveState();
    const blob = state.state || state;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retro-game.state';
    a.click();
    URL.revokeObjectURL(url);

    setStatus('Đã lưu file game');
    setLog('Game đã được tải về dưới dạng file .state.');
  } catch (err) {
    console.error('Lỗi khi save game', err);
    setLog('Lỗi khi save game: ' + err.message);
  }
});

loadBtn.addEventListener('click', () => {
  if (!emulator) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.state';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await emulator.loadState(file);
      setStatus('Đã load game');
      setLog('Đã load state từ file thành công.');
    } catch (err) {
      console.error('Lỗi khi load game', err);
      setLog('Lỗi khi load game: ' + err.message);
    }
  };
  input.click();
});

if (shareBtn) {
  shareBtn.addEventListener('click', () => {
    const game = window._currentGame;
    if (!game) return;

    const sharePayload = {
      type: game.type,
      id: game.id,
      title: game.title,
      url: game.url,
      deeplink: `${window.location.origin}${window.location.pathname}?type=${encodeURIComponent(game.type)}&id=${encodeURIComponent(game.id)}`,
    };

    ParentBridge.post('retro:shareGame', sharePayload);

    // Fallback khi không chạy trong iframe: copy deeplink vào clipboard
    if (window.parent === window) {
      navigator.clipboard?.writeText(sharePayload.deeplink).then(() => {
        showToast('Đã copy link game vào clipboard!', 'success');
      }).catch(() => {
        showToast(`Link: ${sharePayload.deeplink}`, 'info');
      });
    } else {
      showToast(`Đang chia sẻ: ${game.title}`, 'success');
    }
  });
}

// --- KEYBOARD CONTROLS LOGIC ---
const keyboardMap = {
  // Movement WASD
  'KeyW': 'up',
  'KeyA': 'left',
  'KeyS': 'down',
  'KeyD': 'right',

  // Actions - J K L I
  'KeyI': 'x',
  'KeyJ': 'y',
  'KeyK': 'a',
  'KeyL': 'b',

  // Combos
  'KeyM': 'combo-ab',
  'KeyO': 'combo-yab',

  // System buttons
  'Space': 'select',
  'Enter': 'start'
};

const actionSelectors = {
  'select': '.sys-btn[data-key="Shift"]',
  'start': '.sys-btn[data-key="Enter"]',
  'b': '.btn-b',
  'a': '.btn-a',
  'y': '.btn-y',
  'x': '.btn-x',
  'combo-ab': '.btn-combo-ab',
  'combo-yab': '.btn-combo-yab'
};

window.addEventListener('keydown', (e) => {
  // Ignore keyboard controls if user is typing in forms/dropdowns
  if (document.activeElement && (
    document.activeElement.tagName === 'INPUT' ||
    document.activeElement.tagName === 'SELECT' ||
    document.activeElement.tagName === 'TEXTAREA'
  )) {
    return;
  }

  // Intercept Shift/Space for Coin insertion
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space' || e.code === 'Shift') {
    const continueOverlay = document.getElementById('continueOverlay');
    if (continueOverlay && !continueOverlay.classList.contains('hidden')) {
      e.preventDefault();
      handleInsertCoinContinue();
      return;
    }

    if (emulator && continueOverlay && continueOverlay.classList.contains('hidden')) {
      e.preventDefault();
      if (e.repeat) return;
      handleExtendPlayTime();

      emulatorPress('pressDown', 'select');
      const btn = document.querySelector('.sys-btn[data-key="Shift"]');
      if (btn) btn.classList.add('active');
      return;
    }
  }

  if (!emulator) return;

  const action = keyboardMap[e.code];
  if (!action) return;

  e.preventDefault();

  if (e.repeat) return;

  // Note: Gameplay keys (WASD, J K L I, Enter) are now handled natively inside 
  // RetroArch's WebAssembly core via retroarchConfig. This ensures 100% fluid, 
  // smooth movement and simultaneous combinations. We only toggle virtual gamepad 
  // UI states here for visual feedback.
  const selector = actionSelectors[action];
  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) btn.classList.add('active');
  }

  // Handle custom combo logic programmatically since core doesn't natively map them
  if (action.startsWith('combo-') && emulator && emulator.pressDown) {
    const comboButtons = action === 'combo-ab' ? ['a', 'b'] : ['y', 'a', 'b'];
    comboButtons.forEach(b => {
      emulatorPress('pressDown', b);
      const el = document.querySelector(`.btn-${b}`);
      if (el) el.classList.add('active');
    });
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space' || e.code === 'Shift') {
    if (emulator) {
      emulatorPress('pressUp', 'select');
      const btn = document.querySelector('.sys-btn[data-key="Shift"]');
      if (btn) btn.classList.remove('active');
    }
    return;
  }

  if (!emulator) return;

  const action = keyboardMap[e.code];
  if (!action) return;

  e.preventDefault();

  // Note: Gameplay keys (WASD, J K L I, Enter) are now handled natively inside 
  // RetroArch's WebAssembly core via retroarchConfig. This ensures 100% fluid, 
  // smooth movement and simultaneous combinations. We only toggle virtual gamepad 
  // UI states here for visual feedback.
  const selector = actionSelectors[action];
  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) btn.classList.remove('active');
  }

  // Handle custom combo logic programmatically
  if (action.startsWith('combo-') && emulator && emulator.pressUp) {
    const comboButtons = action === 'combo-ab' ? ['a', 'b'] : ['y', 'a', 'b'];
    comboButtons.forEach(b => {
      emulatorPress('pressUp', b);
      const el = document.querySelector(`.btn-${b}`);
      if (el) el.classList.remove('active');
    });
  }
});

window.addEventListener('beforeunload', () => {
  if (emulator) emulator.exit().catch(() => { });
});

['contextmenu', 'selectstart', 'dragstart'].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    if (!document.body.classList.contains('playing')) return;
    if (e.target.closest('input, textarea, select, .custom-control-modal')) return;
    e.preventDefault();
  }, { capture: true });
});

document.addEventListener('touchmove', (e) => {
  if (!document.body.classList.contains('playing')) return;
  if (e.target.closest('input, textarea, select, .custom-control-modal')) return;
  if (e.touches && e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false, capture: true });

['gesturestart', 'gesturechange', 'gestureend'].forEach(eventName => {
  document.addEventListener(eventName, (e) => {
    if (!document.body.classList.contains('playing')) return;
    e.preventDefault();
  }, { passive: false });
});

// --- VIRTUAL GAMEPAD LOGIC ---
const CONTROL_LAYOUT_KEY = 'retro.controlLayout.v4';
const CUSTOM_CONTROLS_KEY = 'retro.customControls.v1';
const MIN_CONTROL_SCALE = 0.65;
const MAX_CONTROL_SCALE = 1.65;
let controlEditMode = false;
let isDraggingControl = false;
let isScalingControl = false;
let editingCustomControlId = null;
let userPausedGame = false;
let autoPausedForControls = false;

const controlElements = Array.from(document.querySelectorAll('.virtual-gamepad [data-control-id]'));
const originalControlPlacements = new Map(controlElements.map(el => [
  el,
  { parent: el.parentElement, nextSibling: el.nextSibling }
]));

const customActionButtonMap = {
  left: 'left',
  right: 'right',
  down: 'down',
  up: 'up',
  X: 'x',
  Y: 'y',
  A: 'a',
  B: 'b'
};

function readCustomControls() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_CONTROLS_KEY) || '[]');
  } catch (err) {
    console.warn('Không đọc được nút custom đã lưu', err);
    return [];
  }
}

function writeCustomControls(controls) {
  localStorage.setItem(CUSTOM_CONTROLS_KEY, JSON.stringify(controls));
}

function getDefaultControlLayout() {
  const isLandscape = window.innerWidth > window.innerHeight;

  if (isLandscape) {
    return {
      'joystick': { x: 16, y: 74 },
      'macro-slide-l': { x: 9, y: 52 },
      'macro-slide-r': { x: 24, y: 52 },
      'select': { x: 6, y: 8 },
      'start': { x: 6, y: 19 },
      'macro-lr': { x: 42, y: 86 },
      'macro-rl': { x: 49, y: 86 },
      'macro-ud': { x: 56, y: 86 },
      'macro-du': { x: 63, y: 86 },
      'macro-skill-l': { x: 72, y: 56 },
      'macro-skill-r': { x: 72, y: 70 },
      'macro-unti': { x: 72, y: 84 },
      'btn-x': { x: 86, y: 59 },
      'btn-y': { x: 80, y: 70 },
      'btn-b': { x: 92, y: 70 },
      'btn-a': { x: 86, y: 81 },
      'combo-yab': { x: 96, y: 56 },
      'combo-ab': { x: 96, y: 84 }
    };
  }

  return {
    'joystick': { x: 22, y: 78 },
    'macro-slide-l': { x: 12, y: 63 },
    'macro-slide-r': { x: 32, y: 63 },
    'select': { x: 12, y: 8 },
    'start': { x: 12, y: 18 },
    'macro-lr': { x: 30, y: 91 },
    'macro-rl': { x: 41, y: 91 },
    'macro-ud': { x: 52, y: 91 },
    'macro-du': { x: 63, y: 91 },
    'macro-skill-l': { x: 52, y: 62 },
    'macro-skill-r': { x: 52, y: 73 },
    'macro-unti': { x: 52, y: 84 },
    'btn-x': { x: 76, y: 64 },
    'btn-y': { x: 67, y: 73 },
    'btn-b': { x: 85, y: 73 },
    'btn-a': { x: 76, y: 82 },
    'combo-yab': { x: 91, y: 62 },
    'combo-ab': { x: 91, y: 85 }
  };
}

function readControlLayout() {
  try {
    return JSON.parse(localStorage.getItem(CONTROL_LAYOUT_KEY) || '{}');
  } catch (err) {
    console.warn('Không đọc được layout nút đã lưu', err);
    return {};
  }
}

function writeControlLayout(layout) {
  localStorage.setItem(CONTROL_LAYOUT_KEY, JSON.stringify(layout));
}

function buildRestoredControlLayout() {
  const defaultLayout = getDefaultControlLayout();
  return Object.fromEntries(controlElements.map(el => {
    const id = el.dataset.controlId;
    return [id, { ...(defaultLayout[id] || { x: 50, y: 50 }), scale: 1, hidden: false }];
  }).filter(([id]) => Boolean(id)));
}

function restoreDefaultControls() {
  writeControlLayout(buildRestoredControlLayout());
  controlElements.forEach(el => {
    el.classList.remove('control-hidden', 'active', 'is-dragging-control', 'is-scaling-control');
    el.style.setProperty('--control-scale', '1');
  });
  applySavedControlLayout();
  setStatus(controlEditMode ? 'Đã khôi phục nút' : (emulator ? 'Đang chạy' : 'Đang chờ...'));
}

function clampControlScale(scale) {
  return Math.min(MAX_CONTROL_SCALE, Math.max(MIN_CONTROL_SCALE, scale));
}

function hasOverlappingControlLayout(layout) {
  const positions = Object.values(layout).filter(item => !item.hidden);
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      if (Math.hypot(dx, dy) < 3) return true;
    }
  }
  return false;
}

function ensureControlLayout() {
  const savedLayout = readControlLayout();
  const defaultLayout = getDefaultControlLayout();
  let changed = false;

  if (hasOverlappingControlLayout(savedLayout)) {
    writeControlLayout(defaultLayout);
    return defaultLayout;
  }

  controlElements.forEach(el => {
    const id = el.dataset.controlId;
    if (!id || savedLayout[id]) return;
    savedLayout[id] = { ...(defaultLayout[id] || { x: 50, y: 50 }), scale: 1, hidden: false };
    changed = true;
  });

  if (changed) {
    writeControlLayout(savedLayout);
  }

  return savedLayout;
}

function positionControlElement(el, controlConfig) {
  el.classList.add('custom-control-positioned');
  const boundedConfig = getBoundedControlConfig(el, controlConfig);
  el.style.left = `${boundedConfig.x}%`;
  el.style.top = `${boundedConfig.y}%`;
  el.style.right = 'auto';
  el.style.bottom = 'auto';
  el.style.setProperty('--control-scale', clampControlScale(boundedConfig.scale || 1));
  el.classList.toggle('control-hidden', Boolean(boundedConfig.hidden));
}

function getControlBounds(el) {
  const id = el.dataset.controlId;
  const isPortrait = window.innerHeight >= window.innerWidth;
  const marginX = isPortrait ? 8 : 4;
  const baseBounds = {
    minX: marginX,
    maxX: 100 - marginX,
    minY: isPortrait ? 52 : 5,
    maxY: isPortrait ? 94 : 95
  };

  if (id === 'select' || id === 'start') {
    return {
      minX: 4,
      maxX: isPortrait ? 28 : 18,
      minY: 5,
      maxY: isPortrait ? 28 : 34
    };
  }

  if (id === 'joystick' || id === 'macro-slide-l' || id === 'macro-slide-r') {
    return {
      ...baseBounds,
      minX: 6,
      maxX: isPortrait ? 44 : 36
    };
  }

  return baseBounds;
}

function getBoundedControlConfig(el, config) {
  const bounds = getControlBounds(el);
  return {
    ...config,
    x: Math.min(bounds.maxX, Math.max(bounds.minX, config.x ?? 50)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, config.y ?? 50))
  };
}

function moveControlsToOverlayRoot() {
  if (!virtualGamepad) return;
  controlElements.forEach(el => {
    if (el.parentElement !== virtualGamepad) {
      virtualGamepad.appendChild(el);
    }
  });
}

function restoreControlParents() {
  controlElements.forEach(el => {
    const placement = originalControlPlacements.get(el);
    if (!placement?.parent || el.parentElement === placement.parent) return;

    if (placement.nextSibling && placement.nextSibling.parentElement === placement.parent) {
      placement.parent.insertBefore(el, placement.nextSibling);
    } else {
      placement.parent.appendChild(el);
    }
  });
}

function saveControlPosition(el) {
  const id = el.dataset.controlId;
  if (!id) return;

  const rect = el.getBoundingClientRect();
  const layout = readControlLayout();
  layout[id] = {
    ...(layout[id] || {}),
    x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
    y: ((rect.top + rect.height / 2) / window.innerHeight) * 100
  };
  writeControlLayout(layout);
}

function saveControlScale(el, scale) {
  const id = el.dataset.controlId;
  if (!id) return;

  const layout = readControlLayout();
  layout[id] = {
    ...(layout[id] || {}),
    scale: clampControlScale(scale)
  };
  writeControlLayout(layout);
  el.style.setProperty('--control-scale', layout[id].scale);
}

function hideControl(el) {
  const id = el.dataset.controlId;
  if (!id) return;

  const layout = readControlLayout();
  layout[id] = {
    ...(layout[id] || {}),
    hidden: true
  };
  writeControlLayout(layout);
  el.classList.add('control-hidden');
}

function applySavedControlLayout() {
  if (!document.body.classList.contains('playing') && !controlEditMode) return;
  moveControlsToOverlayRoot();
  const layout = ensureControlLayout();
  controlElements.forEach(el => {
    const saved = layout[el.dataset.controlId];
    if (!saved) return;
    positionControlElement(el, saved);
  });
}

function clearControlLayoutStyles(force = false) {
  if (controlEditMode) return;

  const layout = readControlLayout();
  controlElements.forEach(el => {
    if (!force && layout[el.dataset.controlId]) return;
    el.classList.remove('custom-control-positioned');
    el.style.left = '';
    el.style.top = '';
    el.style.right = '';
    el.style.bottom = '';
  });
}

function startControlDrag(e, el) {
  if (!controlEditMode || isScalingControl || e.target.closest('.control-edit-handle')) return;
  e.preventDefault();
  e.stopPropagation();

  isDraggingControl = true;
  const rect = el.getBoundingClientRect();
  const shiftX = e.clientX - rect.left;
  const shiftY = e.clientY - rect.top;
  el.classList.add('is-dragging-control');
  el.setPointerCapture?.(e.pointerId);

  const moveControl = (moveEvent) => {
    moveEvent.preventDefault();
    const layout = readControlLayout();
    const currentConfig = layout[el.dataset.controlId] || {};
    const bounds = getControlBounds(el);
    const rawX = ((moveEvent.clientX - shiftX + rect.width / 2) / window.innerWidth) * 100;
    const rawY = ((moveEvent.clientY - shiftY + rect.height / 2) / window.innerHeight) * 100;
    const nextConfig = getBoundedControlConfig(el, {
      ...currentConfig,
      x: rawX,
      y: rawY
    });
    positionControlElement(el, {
      ...nextConfig,
      x: Math.min(bounds.maxX, Math.max(bounds.minX, nextConfig.x)),
      y: Math.min(bounds.maxY, Math.max(bounds.minY, nextConfig.y))
    });
  };

  const stopControlDrag = (upEvent) => {
    upEvent.preventDefault();
    upEvent.stopPropagation();
    saveControlPosition(el);
    el.classList.remove('is-dragging-control');
    el.releasePointerCapture?.(e.pointerId);
    el.removeEventListener('pointermove', moveControl);
    el.removeEventListener('pointerup', stopControlDrag);
    el.removeEventListener('pointercancel', stopControlDrag);
    setTimeout(() => {
      isDraggingControl = false;
    }, 0);
  };

  el.addEventListener('pointermove', moveControl);
  el.addEventListener('pointerup', stopControlDrag);
  el.addEventListener('pointercancel', stopControlDrag);
}

controlElements.forEach(el => {
  el.addEventListener('pointerdown', (e) => startControlDrag(e, el));
});

function createControlHandle(className, text, title) {
  const handle = document.createElement('span');
  handle.className = `control-edit-handle ${className}`;
  handle.textContent = text;
  handle.title = title;
  handle.setAttribute('aria-label', title);
  return handle;
}

function createCustomActionRow(action = '', delay = 60) {
  const idx = customActionList?.querySelectorAll('.custom-action-row').length || 0;
  const row = document.createElement('div');
  row.className = 'custom-action-row';
  row.innerHTML = `
    <select class="input custom-action-select" data-index="${idx}">
      <option value="">Bỏ qua</option>
      <option value="left">left</option>
      <option value="right">right</option>
      <option value="down">down</option>
      <option value="up">up</option>
      <option value="X">X</option>
      <option value="Y">Y</option>
      <option value="A">A</option>
      <option value="B">B</option>
    </select>
    <input class="input custom-delay-input" data-index="${idx}" type="text" inputmode="numeric" pattern="[0-9]*" value="${delay}" />
    <button type="button" class="custom-remove-action-btn" title="Xoá action">×</button>
  `;
  row.querySelector('.custom-action-select').value = action;
  return row;
}

function resetCustomControlForm(control = null) {
  editingCustomControlId = control?.id || null;
  if (customControlName) {
    customControlName.value = control?.label || 'Combo';
  }
  if (customActionList) {
    customActionList.innerHTML = '';
    const steps = control?.steps?.length ? control.steps : [
      { action: '', delay: 0 },
      { action: '', delay: 60 },
      { action: '', delay: 60 }
    ];
    steps.forEach(step => {
      customActionList.appendChild(createCustomActionRow(step.action, step.delay));
    });
  }
  customControlForm?.querySelector('button[type="submit"]')?.replaceChildren(document.createTextNode(control ? 'Lưu nút' : 'Tạo nút'));
}

function openCustomControlModal(control = null) {
  pauseForControlEditing();
  resetCustomControlForm(control);
  document.body.classList.add('custom-control-modal-open');
  customControlModal?.classList.remove('hidden');
  customControlModal?.setAttribute('aria-hidden', 'false');
}

function closeCustomControlModal() {
  customControlModal?.classList.add('hidden');
  customControlModal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('custom-control-modal-open');
  editingCustomControlId = null;
  resumeAfterControlEditing();
  focusGame();
}

function pressVirtualAction(action, pressed) {
  const button = customActionButtonMap[action];
  if (!button || !emulator) return;

  const method = pressed ? 'pressDown' : 'pressUp';
  emulatorPress(method, button);
}

function executeCustomControl(control, el) {
  if (controlEditMode || isDraggingControl || isScalingControl || !control?.steps?.length) return;

  el.classList.add('active');
  let elapsed = 0;
  control.steps.forEach((step, idx) => {
    elapsed += Math.max(0, Number(step.delay) || 0);
    setTimeout(() => {
      pressVirtualAction(step.action, true);
      setTimeout(() => {
        pressVirtualAction(step.action, false);
        if (idx === control.steps.length - 1) {
          el.classList.remove('active');
        }
      }, 45);
    }, elapsed);
  });
}

function registerControlElement(el) {
  if (!controlElements.includes(el)) {
    controlElements.push(el);
  }
  if (!originalControlPlacements.has(el)) {
    originalControlPlacements.set(el, { parent: virtualGamepad, nextSibling: null });
  }
  el.addEventListener('pointerdown', (e) => startControlDrag(e, el));
}

function createCustomControlButton(control) {
  if (!virtualGamepad || document.querySelector(`[data-control-id="${control.id}"]`)) return;

  const btn = document.createElement('div');
  btn.className = 'action-btn macro-btn custom-macro-btn';
  btn.dataset.controlId = control.id;
  btn.dataset.customControl = 'true';
  btn.textContent = control.label;
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const currentControl = readCustomControls().find(item => item.id === control.id) || control;
    executeCustomControl(currentControl, btn);
  }, { passive: false });
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const currentControl = readCustomControls().find(item => item.id === control.id) || control;
    executeCustomControl(currentControl, btn);
  });

  virtualGamepad.appendChild(btn);
  registerControlElement(btn);
}

function appendCustomActionRow() {
  if (!customActionList) return;
  customActionList.appendChild(createCustomActionRow('', 60));
}

function loadCustomControls() {
  readCustomControls().forEach(createCustomControlButton);
}

function createCustomControlFromForm() {
  const steps = Array.from(document.querySelectorAll('.custom-action-row')).map(row => {
    const action = row.querySelector('.custom-action-select')?.value;
    const delay = Number(row.querySelector('.custom-delay-input')?.value) || 0;
    return action ? { action, delay } : null;
  }).filter(Boolean);

  if (steps.length === 0) {
    setStatus('Chưa chọn action cho nút mới');
    return;
  }

  const controls = readCustomControls();
  const label = (customControlName?.value || 'Combo').trim().slice(0, 12) || 'Combo';
  const existingIndex = controls.findIndex(item => item.id === editingCustomControlId);

  if (existingIndex >= 0) {
    const control = { ...controls[existingIndex], label, steps };
    controls[existingIndex] = control;
    writeCustomControls(controls);
    const btn = document.querySelector(`[data-control-id="${control.id}"]`);
    if (btn) {
      btn.textContent = control.label;
      attachControlEditHandles();
    }
    closeCustomControlModal();
    setStatus('Đã cập nhật nút combo');
    return;
  }

  const id = `custom-${Date.now()}`;
  const control = { id, label, steps };
  controls.push(control);
  writeCustomControls(controls);
  createCustomControlButton(control);

  const layout = readControlLayout();
  const isPortrait = window.innerHeight >= window.innerWidth;
  layout[id] = { x: isPortrait ? 50 : 58, y: isPortrait ? 78 : 74, scale: 1, hidden: false };
  writeControlLayout(layout);
  applySavedControlLayout();
  attachControlEditHandles();
  closeCustomControlModal();
  setStatus('Đã thêm nút combo');
}

function attachControlEditHandles() {
  controlElements.forEach(el => {
    if (el.dataset.customControl === 'true' && !el.querySelector(':scope > .control-edit-combo-handle')) {
      const editHandle = createControlHandle('control-edit-combo-handle', '✎', 'Sửa combo');
      editHandle.addEventListener('pointerdown', (e) => {
        if (!controlEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        const control = readCustomControls().find(item => item.id === el.dataset.controlId);
        if (control) {
          openCustomControlModal(control);
        }
      });
      el.appendChild(editHandle);
    }

    if (!el.querySelector(':scope > .control-scale-handle')) {
      const scaleHandle = createControlHandle('control-scale-handle', '↘', 'Phóng to/thu nhỏ nút');
      scaleHandle.addEventListener('pointerdown', (e) => {
        if (!controlEditMode) return;
        e.preventDefault();
        e.stopPropagation();

        isScalingControl = true;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startDistance = Math.max(12, Math.hypot(e.clientX - centerX, e.clientY - centerY));
        const currentScale = Number(el.style.getPropertyValue('--control-scale')) || 1;
        scaleHandle.setPointerCapture?.(e.pointerId);
        el.classList.add('is-scaling-control');

        const moveScale = (moveEvent) => {
          moveEvent.preventDefault();
          const nextDistance = Math.max(12, Math.hypot(moveEvent.clientX - centerX, moveEvent.clientY - centerY));
          saveControlScale(el, currentScale * (nextDistance / startDistance));
        };

        const stopScale = (upEvent) => {
          upEvent.preventDefault();
          upEvent.stopPropagation();
          scaleHandle.releasePointerCapture?.(e.pointerId);
          scaleHandle.removeEventListener('pointermove', moveScale);
          scaleHandle.removeEventListener('pointerup', stopScale);
          scaleHandle.removeEventListener('pointercancel', stopScale);
          el.classList.remove('is-scaling-control');
          setTimeout(() => {
            isScalingControl = false;
          }, 0);
        };

        scaleHandle.addEventListener('pointermove', moveScale);
        scaleHandle.addEventListener('pointerup', stopScale);
        scaleHandle.addEventListener('pointercancel', stopScale);
      });
      el.appendChild(scaleHandle);
    }

    if (el.dataset.controlId !== 'joystick' && !el.querySelector(':scope > .control-delete-handle')) {
      const deleteHandle = createControlHandle('control-delete-handle', '×', 'Ẩn nút này');
      deleteHandle.addEventListener('pointerdown', (e) => {
        if (!controlEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        hideControl(el);
      });
      el.appendChild(deleteHandle);
    }
  });
}

function setControlEditMode(enabled) {
  controlEditMode = enabled;
  document.body.classList.toggle('control-editing', enabled);
  if (settingsBtn) {
    settingsBtn.textContent = enabled ? 'Lưu nút' : 'Cài Đặt';
    settingsBtn.classList.toggle('primary', enabled);
    settingsBtn.classList.toggle('secondary', !enabled);
  }
  if (customizeControlsBtn) {
    customizeControlsBtn.textContent = enabled ? 'Lưu nút' : 'Cài đặt nút';
    customizeControlsBtn.classList.toggle('primary', enabled);
    customizeControlsBtn.classList.toggle('secondary', !enabled);
  }

  if (enabled) {
    pauseForControlEditing();
    applySavedControlLayout();
    attachControlEditHandles();
    setStatus('Đang cài đặt nút');
  } else {
    setStatus(emulator ? 'Đang chạy' : 'Đang chờ...');
    resumeAfterControlEditing();
    focusGame();
  }
}

customizeControlsBtn?.addEventListener('click', () => {
  setControlEditMode(!controlEditMode);
});

const flashToggleBtn = document.querySelector('#flashToggleBtn');
const flashHideAllToggle = document.querySelector('#flashHideAllToggle');

function updateFlashToggleBtn() {
  if (flashToggleBtn) flashToggleBtn.textContent = flashButtonsHidden ? 'Hiện nút' : 'Ẩn nút';
  if (flashHideAllToggle) flashHideAllToggle.checked = flashButtonsHidden;
}

function setFlashButtonsHidden(hidden) {
  flashButtonsHidden = hidden;
  localStorage.setItem('flash_buttons_hidden', flashButtonsHidden);
  document.body.classList.toggle('flash-no-buttons', flashButtonsHidden);
  updateFlashToggleBtn();
}

flashToggleBtn?.addEventListener('click', () => setFlashButtonsHidden(!flashButtonsHidden));
flashHideAllToggle?.addEventListener('change', () => setFlashButtonsHidden(flashHideAllToggle.checked));
updateFlashToggleBtn();

// --- FLASH BUTTON DRAGGABLE SYSTEM ---
const FLASH_BTN_DEFAULTS = {
  'flash-up': { x: 13, y: 63, scale: 1.25, key: 'w', code: 'KeyW', name: '↑' },
  'flash-left': { x: 5, y: 73, scale: 1.25, key: 'a', code: 'KeyA', name: '←' },
  'flash-right': { x: 21, y: 73, scale: 1.25, key: 'd', code: 'KeyD', name: '→' },
  'flash-down': { x: 13, y: 81, scale: 1.25, key: 's', code: 'KeyS', name: '↓' },
  'flash-jump': { x: 50, y: 50, scale: 1.25, key: ' ', code: 'Space', name: '😊', hidden: true },
  'flash-continue': { x: 50, y: 50, scale: 1.25, key: 'Enter', code: 'Enter', name: '▶', hidden: true },
};

const flashBtnElements = Array.from(document.querySelectorAll('[data-flash-control-id]'));
let flashEditMode = false;
let isDraggingFlashBtn = false;

function flashLayoutStorageKey(gameId) {
  return `flash_btn_layout_${gameId}`;
}

function readFlashLayout(gameId) {
  if (!gameId) return null;
  try {
    const raw = localStorage.getItem(flashLayoutStorageKey(gameId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeFlashLayout(gameId, layout) {
  if (!gameId) return;
  localStorage.setItem(flashLayoutStorageKey(gameId), JSON.stringify(layout));
}

function formatKeyLabel(key) {
  if (key === ' ') return 'Space';
  if (key === 'ArrowUp') return '↑';
  if (key === 'ArrowDown') return '↓';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  if (key === 'Enter') return 'Enter';
  if (key === 'Escape') return 'Esc';
  if (key === 'Backspace') return '⌫';
  if (key === 'Tab') return 'Tab';
  if (key === 'Shift') return 'Shift';
  if (key === 'Control') return 'Ctrl';
  if (key === 'Alt') return 'Alt';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function applyFlashBtnConfig(el, config) {
  el.style.left = `${config.x}%`;
  el.style.top = `${config.y}%`;
  el.style.setProperty('--flash-btn-scale', config.scale || 1);
  el.classList.toggle('flash-btn-hidden', Boolean(config.hidden));
  el.dataset.flashKey = config.key;
  el.dataset.flashCode = config.code;
  el.dataset.flashName = config.name || '';
  const iconEl = el.querySelector('.flash-btn-icon');
  if (iconEl) iconEl.textContent = config.name || formatKeyLabel(config.key);
  const keyLabelEl = el.querySelector('.flash-btn-keylabel');
  if (keyLabelEl) keyLabelEl.textContent = formatKeyLabel(config.key);
}

function buildCurrentFlashLayout() {
  const layout = {};
  flashBtnElements.forEach(el => {
    const id = el.dataset.flashControlId;
    const rect = el.getBoundingClientRect();
    const defaults = FLASH_BTN_DEFAULTS[id] || {};
    layout[id] = {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      scale: Number(el.style.getPropertyValue('--flash-btn-scale')) || 1,
      hidden: el.classList.contains('flash-btn-hidden'),
      key: el.dataset.flashKey || defaults.key,
      code: el.dataset.flashCode || defaults.code,
      name: el.dataset.flashName || '',
    };
  });
  return layout;
}

function loadAndApplyFlashLayout(gameId) {
  const saved = readFlashLayout(gameId);
  flashBtnElements.forEach(el => {
    const id = el.dataset.flashControlId;
    const config = (saved && saved[id]) ? saved[id] : (FLASH_BTN_DEFAULTS[id] || { x: 50, y: 50, scale: 1, key: '', code: '' });
    applyFlashBtnConfig(el, config);
  });
}

function resetFlashButtonLayout() {
  flashBtnElements.forEach(el => {
    const id = el.dataset.flashControlId;
    const defaults = FLASH_BTN_DEFAULTS[id] || { x: 50, y: 50, scale: 1, key: '', code: '' };
    applyFlashBtnConfig(el, defaults);
  });
}

function startFlashBtnDrag(e, el) {
  if (!flashEditMode || isDraggingFlashBtn || flashKeyPopoverTarget) return;
  if (e.target.closest('.flash-edit-handle')) return;
  e.preventDefault();
  e.stopPropagation();
  isDraggingFlashBtn = true;
  const rect = el.getBoundingClientRect();
  const shiftX = e.clientX - rect.left;
  const shiftY = e.clientY - rect.top;
  el.classList.add('is-dragging-flash');
  el.setPointerCapture?.(e.pointerId);

  const onMove = (me) => {
    me.preventDefault();
    const rawX = ((me.clientX - shiftX + rect.width / 2) / window.innerWidth) * 100;
    const rawY = ((me.clientY - shiftY + rect.height / 2) / window.innerHeight) * 100;
    el.style.left = `${Math.min(96, Math.max(2, rawX))}%`;
    el.style.top = `${Math.min(95, Math.max(2, rawY))}%`;
  };

  const onUp = (ue) => {
    ue.preventDefault();
    el.classList.remove('is-dragging-flash');
    el.releasePointerCapture?.(e.pointerId);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    setTimeout(() => { isDraggingFlashBtn = false; }, 0);
  };

  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}

const FLASH_KEY_GROUPS = [
  {
    id: 'arrows', label: 'Mũi tên', keys: [
      { key: 'ArrowUp', code: 'ArrowUp', label: '↑' },
      { key: 'ArrowDown', code: 'ArrowDown', label: '↓' },
      { key: 'ArrowLeft', code: 'ArrowLeft', label: '←' },
      { key: 'ArrowRight', code: 'ArrowRight', label: '→' },
    ]
  },
  {
    id: 'common', label: 'Phổ biến', keys: [
      { key: ' ', code: 'Space', label: 'Space' },
      { key: 'Enter', code: 'Enter', label: 'Enter' },
      { key: 'Escape', code: 'Escape', label: 'Esc' },
      { key: 'Backspace', code: 'Backspace', label: '⌫' },
      { key: 'Tab', code: 'Tab', label: 'Tab' },
      { key: 'Shift', code: 'ShiftLeft', label: 'Shift' },
      { key: 'Control', code: 'ControlLeft', label: 'Ctrl' },
      { key: 'Alt', code: 'AltLeft', label: 'Alt' },
    ]
  },
  {
    id: 'letters', label: 'WASD / Chữ cái', keys:
      ['W', 'A', 'S', 'D', 'X', 'Z', 'C', 'V', 'Q', 'E', 'R', 'F', 'G', 'H', 'J', 'K', 'L', 'B', 'N', 'M', 'Y', 'U', 'I', 'O', 'P', 'T']
        .map(l => ({ key: l.toLowerCase(), code: `Key${l}`, label: l }))
  },
  {
    id: 'digits', label: 'Số', keys:
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        .map(n => ({ key: n, code: `Digit${n}`, label: n }))
  },
  {
    id: 'fn', label: 'Hàm / Khác', keys: [
      { key: 'F1', code: 'F1', label: 'F1' },
      { key: 'F2', code: 'F2', label: 'F2' },
      { key: 'F3', code: 'F3', label: 'F3' },
      { key: 'F4', code: 'F4', label: 'F4' },
      { key: 'F5', code: 'F5', label: 'F5' },
      { key: 'F6', code: 'F6', label: 'F6' },
      { key: 'Insert', code: 'Insert', label: 'Ins' },
      { key: 'Delete', code: 'Delete', label: 'Del' },
      { key: 'Home', code: 'Home', label: 'Home' },
      { key: 'End', code: 'End', label: 'End' },
      { key: 'PageUp', code: 'PageUp', label: 'PgUp' },
      { key: 'PageDown', code: 'PageDown', label: 'PgDn' },
    ]
  },
];

let flashKeyPopoverTarget = null;
let flashKeyPopoverSelectedKey = null;
let flashKeyPopoverSelectedCode = null;
let flashKeyPopoverIsNew = false; // true when adding a brand-new (hidden) button

function openFlashKeyPopover(el, isNew = false) {
  flashKeyPopoverTarget = el;
  flashKeyPopoverIsNew = isNew;
  flashKeyPopoverSelectedKey = el.dataset.flashKey || '';
  flashKeyPopoverSelectedCode = el.dataset.flashCode || '';

  const popover = document.getElementById('flashKeyPopover');
  const nameInput = document.getElementById('flashKeyPopoverName');
  const selectedLabel = document.getElementById('flashKeyPopoverSelectedLabel');
  const headTitle = popover?.querySelector('.flash-key-popover-head strong');
  const saveBtn = document.getElementById('flashKeyPopoverSave');
  if (!popover || !nameInput || !selectedLabel) return;

  if (headTitle) headTitle.textContent = isNew ? 'Thêm nút mới' : 'Cài đặt nút';
  if (saveBtn) saveBtn.textContent = isNew ? 'Thêm' : 'Lưu';

  nameInput.value = isNew ? '' : (el.dataset.flashName || '');
  selectedLabel.textContent = formatKeyLabel(flashKeyPopoverSelectedKey);

  FLASH_KEY_GROUPS.forEach(group => {
    const grid = document.getElementById(`flashKeyGrid-${group.id}`);
    if (!grid) return;
    grid.innerHTML = '';
    group.keys.forEach(({ key, code, label }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flash-key-btn';
      btn.textContent = label;
      if (key === flashKeyPopoverSelectedKey) btn.classList.add('selected');
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        grid.querySelectorAll('.flash-key-btn').forEach(b => b.classList.remove('selected'));
        document.querySelectorAll('.flash-key-btn.selected').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        flashKeyPopoverSelectedKey = key;
        flashKeyPopoverSelectedCode = code;
        selectedLabel.textContent = label;
      });
      grid.appendChild(btn);
    });
  });

  popover.classList.remove('hidden');
  popover.setAttribute('aria-hidden', 'false');
  try { document.activeElement?.blur(); } catch (_) { }
}

function focusGame() {
  const canvas = document.getElementById('game');
  const isTouchOnly = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  try { document.activeElement?.blur(); } catch (_) { }
  if (canvas) {
    if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '-1');
    if (!isTouchOnly) {
      canvas.focus({ preventScroll: true });
    } else {
      showToast('Nhấn vào game để tiếp tục!', 'info');
    }
  }
}

function closeFlashKeyPopover(save) {
  const popover = document.getElementById('flashKeyPopover');
  if (popover) {
    popover.classList.add('hidden');
    popover.setAttribute('aria-hidden', 'true');
  }
  const headTitle = popover?.querySelector('.flash-key-popover-head strong');
  const saveBtn = document.getElementById('flashKeyPopoverSave');
  if (headTitle) headTitle.textContent = 'Cài đặt nút';
  if (saveBtn) saveBtn.textContent = 'Lưu';

  focusGame();

  if (save && flashKeyPopoverTarget) {
    const el = flashKeyPopoverTarget;
    const nameInput = document.getElementById('flashKeyPopoverName');
    const customName = nameInput ? nameInput.value.trim() : '';
    el.dataset.flashKey = flashKeyPopoverSelectedKey;
    el.dataset.flashCode = flashKeyPopoverSelectedCode;
    el.dataset.flashName = customName;
    const iconEl = el.querySelector('.flash-btn-icon');
    if (iconEl) iconEl.textContent = customName || formatKeyLabel(flashKeyPopoverSelectedKey);
    const keyLabelEl = el.querySelector('.flash-btn-keylabel');
    if (keyLabelEl) keyLabelEl.textContent = formatKeyLabel(flashKeyPopoverSelectedKey);

    if (flashKeyPopoverIsNew) {
      // Un-hide and center the new button
      applyFlashBtnConfig(el, {
        x: 50, y: 50,
        scale: Number(el.style.getPropertyValue('--flash-btn-scale')) || 1.25,
        key: flashKeyPopoverSelectedKey,
        code: flashKeyPopoverSelectedCode,
        name: customName || formatKeyLabel(flashKeyPopoverSelectedKey),
        hidden: false,
      });
      showToast('Đã thêm nút — kéo để đặt vị trí!', 'success');
    }
  }
  flashKeyPopoverTarget = null;
  flashKeyPopoverIsNew = false;
}

function cancelFlashKeyCapture() {
  closeFlashKeyPopover(false);
}

function onFlashKeyCapture(e) {
  const popover = document.getElementById('flashKeyPopover');
  if (!popover || popover.classList.contains('hidden')) return;
  if (!flashKeyPopoverTarget) return;
  e.preventDefault();
  e.stopPropagation();
  const selectedLabel = document.getElementById('flashKeyPopoverSelectedLabel');
  flashKeyPopoverSelectedKey = e.key;
  flashKeyPopoverSelectedCode = e.code;
  if (selectedLabel) selectedLabel.textContent = formatKeyLabel(e.key);
  document.querySelectorAll('.flash-key-btn').forEach(b => {
    b.classList.toggle('selected', b.textContent === formatKeyLabel(e.key));
  });
}

document.addEventListener('keydown', onFlashKeyCapture, { capture: true });

document.getElementById('flashKeyPopoverSave')?.addEventListener('click', () => closeFlashKeyPopover(true));
document.getElementById('flashKeyPopoverCancel')?.addEventListener('click', () => closeFlashKeyPopover(false));
document.getElementById('flashKeyPopoverClose')?.addEventListener('click', () => closeFlashKeyPopover(false));

function attachFlashEditHandles() {
  flashBtnElements.forEach(el => {
    if (el.querySelector('.flash-edit-handle-key')) return;

    const keyHandle = document.createElement('span');
    keyHandle.className = 'flash-edit-handle flash-edit-handle-key';
    keyHandle.textContent = '⌨';
    keyHandle.title = 'Gán phím';
    keyHandle.addEventListener('pointerdown', (e) => {
      if (!flashEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      openFlashKeyPopover(el);
    });
    el.appendChild(keyHandle);

    const scaleHandle = document.createElement('span');
    scaleHandle.className = 'flash-edit-handle flash-edit-handle-scale';
    scaleHandle.textContent = '↘';
    scaleHandle.title = 'Phóng to/thu nhỏ';
    scaleHandle.addEventListener('pointerdown', (e) => {
      if (!flashEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const startDist = Math.max(12, Math.hypot(e.clientX - cx, e.clientY - cy));
      const startScale = Number(el.style.getPropertyValue('--flash-btn-scale')) || 1;
      scaleHandle.setPointerCapture?.(e.pointerId);
      const onScale = (me) => {
        me.preventDefault();
        const d = Math.max(12, Math.hypot(me.clientX - cx, me.clientY - cy));
        const newScale = Math.min(2.5, Math.max(0.4, startScale * (d / startDist)));
        el.style.setProperty('--flash-btn-scale', newScale);
      };
      const offScale = (ue) => {
        ue.preventDefault();
        scaleHandle.releasePointerCapture?.(e.pointerId);
        scaleHandle.removeEventListener('pointermove', onScale);
        scaleHandle.removeEventListener('pointerup', offScale);
        scaleHandle.removeEventListener('pointercancel', offScale);
      };
      scaleHandle.addEventListener('pointermove', onScale);
      scaleHandle.addEventListener('pointerup', offScale);
      scaleHandle.addEventListener('pointercancel', offScale);
    });
    el.appendChild(scaleHandle);

    const hideHandle = document.createElement('span');
    hideHandle.className = 'flash-edit-handle flash-edit-handle-hide';
    hideHandle.textContent = '×';
    hideHandle.title = 'Ẩn nút';
    hideHandle.addEventListener('pointerdown', (e) => {
      if (!flashEditMode) return;
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('flash-btn-hidden');
    });
    el.appendChild(hideHandle);
  });
}

function setFlashEditMode(enabled) {
  flashEditMode = enabled;
  document.body.classList.toggle('flash-control-editing', enabled);
  const btn = document.getElementById('flashKeyConfigBtn');
  if (btn) {
    btn.textContent = enabled ? '💾' : '⚙️';
    btn.classList.toggle('primary', enabled);
    btn.classList.toggle('secondary', !enabled);
  }
  if (enabled) {
    attachFlashEditHandles();
    if (emulator) emulator.pause().catch(() => { });
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.style.pointerEvents = 'none';
  } else {
    cancelFlashKeyCapture();
    if (activeFlashGameId) {
      writeFlashLayout(activeFlashGameId, buildCurrentFlashLayout());
      showToast('Đã lưu bố cục phím Flash!', 'success');
    }
    if (emulator) emulator.resume().catch(() => { });
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.style.pointerEvents = '';
  }
}

document.getElementById('flashKeyConfigBtn')?.addEventListener('click', () => {
  if (!activeFlashGameId) {
    showToast('Cần chạy game Flash trước để cài phím!', 'warning');
    return;
  }
  setFlashEditMode(!flashEditMode);
});

document.getElementById('addFlashBtn')?.addEventListener('click', () => {
  if (!activeFlashGameId) {
    showToast('Cần chạy game Flash trước!', 'warning');
    return;
  }
  // Find next hidden flash button and place it at screen center
  const hiddenBtn = flashBtnElements.find(el => el.classList.contains('flash-btn-hidden'));
  if (!hiddenBtn) {
    showToast('Tất cả nút đã được hiện. Dùng ⚙️ để ẩn bớt.', 'warning');
    return;
  }
  const id = hiddenBtn.dataset.flashControlId;
  const defaults = FLASH_BTN_DEFAULTS[id] || {};
  applyFlashBtnConfig(hiddenBtn, { ...defaults, hidden: false, x: 50, y: 50 });
  if (!flashEditMode) setFlashEditMode(true);
  showToast('Đã thêm nút — kéo để đặt vị trí!', 'success');
});

document.getElementById('addFlashBtnOverlay')?.addEventListener('click', () => {
  if (!activeFlashGameId) {
    showToast('Cần chạy game Flash trước!', 'warning');
    return;
  }
  const hiddenBtn = flashBtnElements.find(el => el.classList.contains('flash-btn-hidden'));
  if (!hiddenBtn) {
    showToast('Tất cả nút đã được hiện. Dùng ⚙️ để ẩn bớt.', 'warning');
    return;
  }
  // Pre-fill element with defaults so the popover has something to show
  const id = hiddenBtn.dataset.flashControlId;
  const defaults = FLASH_BTN_DEFAULTS[id] || {};
  if (defaults.key) {
    hiddenBtn.dataset.flashKey = defaults.key;
    hiddenBtn.dataset.flashCode = defaults.code || defaults.key;
  }
  hiddenBtn.dataset.flashName = '';
  openFlashKeyPopover(hiddenBtn, true);
});

flashBtnElements.forEach(el => {
  el.addEventListener('pointerdown', (e) => startFlashBtnDrag(e, el));
});


settingsBtn?.addEventListener('click', () => {
  setControlEditMode(!controlEditMode);
});

restoreControlsBtn?.addEventListener('click', () => {
  restoreDefaultControls();
});

// --- FLASH CONFIG EXPORT / IMPORT ---

function buildFlashConfigPayload() {
  const PREFIX = 'flash_btn_layout_';
  const titleMap = {};
  ALL_FLASH_GAMES.forEach(g => { titleMap[g.url] = g.title; });

  const configs = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(PREFIX)) continue;
    const gameId = key.slice(PREFIX.length);
    try {
      const layout = JSON.parse(localStorage.getItem(key));
      configs.push({ gameId, title: titleMap[gameId] || gameId, layout });
    } catch { /* skip corrupted */ }
  }
  return configs;
}

function applyFlashConfigPayload(jsonText) {
  const data = JSON.parse(jsonText);
  const configs = Array.isArray(data.configs) ? data.configs : (Array.isArray(data) ? data : null);
  if (!configs) throw new Error('Định dạng không hợp lệ');
  let count = 0;
  configs.forEach(({ gameId, layout }) => {
    if (!gameId || !layout) return;
    writeFlashLayout(gameId, layout);
    count++;
  });
  if (activeFlashGameId) loadAndApplyFlashLayout(activeFlashGameId);
  return count;
}

function exportFlashConfigs() {
  const configs = buildFlashConfigPayload();
  if (configs.length === 0) {
    showToast('Chưa có game Flash nào được cài đặt phím!', 'warning');
    return;
  }
  const payload = { version: 1, exported_at: new Date().toISOString(), total: configs.length, configs };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flash-config-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Đã xuất config của ${configs.length} game Flash!`, 'success');
}

function copyFlashConfigsToClipboard() {
  const configs = buildFlashConfigPayload();
  if (configs.length === 0) {
    showToast('Chưa có game Flash nào được cài đặt phím!', 'warning');
    return;
  }
  const payload = { version: 1, exported_at: new Date().toISOString(), total: configs.length, configs };
  const text = JSON.stringify(payload);
  navigator.clipboard.writeText(text).then(() => {
    showToast(`Đã copy config ${configs.length} game vào clipboard!`, 'success');
  }).catch(() => {
    // fallback for WebView without clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`Đã copy config ${configs.length} game vào clipboard!`, 'success');
  });
}

function pasteFlashConfigsFromClipboard() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      try {
        const count = applyFlashConfigPayload(text);
        showToast(`Đã nhập config ${count} game từ clipboard!`, 'success');
      } catch (err) {
        showToast('Clipboard không chứa config hợp lệ: ' + err.message, 'error');
      }
    }).catch(() => {
      showToast('Không đọc được clipboard. Dùng nút 📥 để nhập từ file.', 'warning');
    });
  } else {
    showToast('Trình duyệt này không hỗ trợ đọc clipboard tự động. Dùng nút 📥 để nhập từ file.', 'warning');
  }
}

function importFlashConfigs(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const count = applyFlashConfigPayload(e.target.result);
      showToast(`Đã nhập config của ${count} game Flash!`, 'success');
    } catch (err) {
      showToast('Lỗi khi đọc file: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

document.getElementById('exportFlashConfigBtn')?.addEventListener('click', exportFlashConfigs);
document.getElementById('copyFlashConfigBtn')?.addEventListener('click', copyFlashConfigsToClipboard);
document.getElementById('pasteFlashConfigBtn')?.addEventListener('click', pasteFlashConfigsFromClipboard);

document.getElementById('importFlashConfigBtn')?.addEventListener('click', () => {
  document.getElementById('importFlashConfigFile')?.click();
});

document.getElementById('importFlashConfigFile')?.addEventListener('change', (e) => {
  importFlashConfigs(e.target.files[0]);
  e.target.value = '';
});

const controlsToggleBtn = document.getElementById('controlsToggleBtn');
const controlsBarWrapper = document.getElementById('controlsBar');
if (controlsToggleBtn && controlsBarWrapper) {
  controlsToggleBtn.addEventListener('click', () => {
    controlsBarWrapper.classList.toggle('collapsed');
    controlsToggleBtn.textContent = controlsBarWrapper.classList.contains('collapsed') ? '⚙ Menu' : '✕ Đóng';
  });
}

addCustomControlBtn?.addEventListener('click', () => {
  openCustomControlModal();
  if (!controlEditMode) {
    setControlEditMode(true);
  }
});

closeCustomControlModalBtn?.addEventListener('click', () => {
  closeCustomControlModal();
});

customControlModal?.addEventListener('focusin', (e) => {
  const field = e.target.closest('input, select, textarea');
  if (!field) return;
  setTimeout(() => {
    field.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, 80);
});

customControlForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  createCustomControlFromForm();
});

addCustomActionRowBtn?.addEventListener('click', () => {
  appendCustomActionRow();
});

customActionList?.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.custom-remove-action-btn');
  if (!removeBtn) return;
  e.preventDefault();
  const row = removeBtn.closest('.custom-action-row');
  if (row && customActionList.querySelectorAll('.custom-action-row').length > 1) {
    row.remove();
  } else if (row) {
    row.querySelector('.custom-action-select').value = '';
    row.querySelector('.custom-delay-input').value = '0';
  }
});

window.addEventListener('resize', () => {
  if (document.body.classList.contains('playing') || controlEditMode) {
    applySavedControlLayout();
  }
});

loadCustomControls();

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
    e.stopPropagation();
    if (controlEditMode || isDraggingControl) return;
    if (!btn.classList.contains('active')) {
      btn.classList.add('active');

      if (btnName === 'Shift') {
        const continueOverlay = document.getElementById('continueOverlay');
        if (continueOverlay && !continueOverlay.classList.contains('hidden')) {
          handleInsertCoinContinue();
          return;
        } else {
          handleExtendPlayTime();
        }
      }

      if (emulator && emulator.pressDown) {
        if (btnName.startsWith('combo-')) {
          const keys = btnName.replace('combo-', '').split('');
          keys.forEach(k => {
            const pb = nostalgistMap[k];
            if (pb) {
              emulatorPress('pressDown', pb);
              const el = document.querySelector(`.btn-${pb}`);
              if (el) el.classList.add('active');
            }
          });
        } else if (btnName.startsWith('macro-')) {
          // Rapid sequential direction presses
          const macroMap = {
            'macro-ud': ['up', 'down'],
            'macro-du': ['down', 'up'],
            'macro-lr': ['left', 'right'],
            'macro-rl': ['right', 'left'],
            'macro-skill-r': ['right', 'left', 'right', 'b'],
            'macro-skill-l': ['left', 'right', 'left', 'b'],
            'macro-unti': ['down', 'up', 'b'],
            'macro-slide-l': ['left', 'left', 'left'],
            'macro-slide-r': ['right', 'right', 'right']
          };
          const dirs = macroMap[btnName];
          if (dirs) {
            dirs.forEach((btnKey, idx) => {
              setTimeout(() => {
                emulatorPress('pressDown', btnKey);
                // Visual highlight
                if (['up', 'down', 'left', 'right'].includes(btnKey)) {
                  const knob = document.getElementById('joystickKnob');
                  const offsets = { 'up': [0, -35], 'down': [0, 35], 'left': [-35, 0], 'right': [35, 0] };
                  if (knob) knob.style.transform = `translate(${offsets[btnKey][0]}px, ${offsets[btnKey][1]}px)`;
                } else {
                  const btnElem = document.querySelector(`.btn-${btnKey}`);
                  if (btnElem) btnElem.classList.add('active');
                }
              }, idx * 100);

              setTimeout(() => {
                emulatorPress('pressUp', btnKey);
                // Remove visual highlight
                if (['up', 'down', 'left', 'right'].includes(btnKey)) {
                  const knob = document.getElementById('joystickKnob');
                  if (knob) knob.style.transform = `translate(0px, 0px)`;
                } else {
                  const btnElem = document.querySelector(`.btn-${btnKey}`);
                  if (btnElem) btnElem.classList.remove('active');
                }

                if (idx === dirs.length - 1) {
                  btn.classList.remove('active');
                }
              }, idx * 100 + 70);
            });
          }
        } else if (padBtn) {
          emulatorPress('pressDown', padBtn);
        }
      }
    }
  };

  const upHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (controlEditMode || isDraggingControl) return;
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      if (emulator && emulator.pressUp) {
        if (btnName.startsWith('combo-')) {
          const keys = btnName.replace('combo-', '').split('');
          keys.forEach(k => {
            const pb = nostalgistMap[k];
            if (pb) {
              emulatorPress('pressUp', pb);
              const el = document.querySelector(`.btn-${pb}`);
              if (el) el.classList.remove('active');
            }
          });
        } else if (padBtn) {
          emulatorPress('pressUp', padBtn);
        }
      }
    }
  };

  btn.addEventListener('touchstart', downHandler, { passive: false });
  btn.addEventListener('touchend', upHandler, { passive: false });
  btn.addEventListener('touchcancel', upHandler, { passive: false });

  btn.addEventListener('mousedown', downHandler);
  btn.addEventListener('mouseup', upHandler);
  btn.addEventListener('mouseleave', upHandler);
});

// Joystick Logic
const joystickTouchZone = document.querySelector('.joystick-wrapper');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

let isDragging = false;
let activeJoystickPointerId = null;
let activeJoystickCenter = null;
let joystickWasFloating = false;
let currentDirs = { up: false, down: false, left: false, right: false };
let joystickRunDir = null;
let joystickLastRunAt = 0;
let joystickRunTimers = [];
let joystickRunCandidateDir = null;
let joystickRunCandidateAt = 0;

function getPointFromEvent(e) {
  if (typeof e.pointerId === 'number' && activeJoystickPointerId !== null && e.pointerId !== activeJoystickPointerId) {
    return null;
  }

  if (e.changedTouches && activeJoystickPointerId !== null) {
    const matchingTouch = Array.from(e.changedTouches).find(t => t.identifier === activeJoystickPointerId);
    return matchingTouch ? { clientX: matchingTouch.clientX, clientY: matchingTouch.clientY } : null;
  }

  if (e.touches && e.touches.length > 0) {
    const touch = activeJoystickPointerId === null
      ? e.touches[0]
      : Array.from(e.touches).find(t => t.identifier === activeJoystickPointerId) || e.touches[0];
    return { clientX: touch.clientX, clientY: touch.clientY };
  }

  return { clientX: e.clientX, clientY: e.clientY };
}

function placeJoystickAt(clientX, clientY) {
  if (!joystickBase || !joystickTouchZone) return;
  const wrapperRect = joystickTouchZone.getBoundingClientRect();
  const baseRect = joystickBase.getBoundingClientRect();

  joystickWasFloating = true;
  joystickBase.classList.add('joystick-floating');
  if (joystickBase.classList.contains('custom-control-positioned')) {
    joystickBase.style.left = `${(clientX / window.innerWidth) * 100}%`;
    joystickBase.style.top = `${(clientY / window.innerHeight) * 100}%`;
  } else {
    joystickBase.style.left = `${clientX - wrapperRect.left - baseRect.width / 2}px`;
    joystickBase.style.top = `${clientY - wrapperRect.top - baseRect.height / 2}px`;
  }
  joystickBase.style.right = 'auto';
  joystickBase.style.bottom = 'auto';
  activeJoystickCenter = { x: clientX, y: clientY };
}

function restoreJoystickPosition() {
  if (!joystickBase || !joystickWasFloating) return;

  joystickBase.classList.remove('joystick-floating');
  if (joystickBase.classList.contains('custom-control-positioned')) {
    applySavedControlLayout();
  } else {
    joystickBase.style.left = '';
    joystickBase.style.top = '';
    joystickBase.style.right = '';
    joystickBase.style.bottom = '';
  }
  joystickWasFloating = false;
}

function clearJoystickRunTimers() {
  joystickRunTimers.forEach((timer) => clearTimeout(timer));
  joystickRunTimers = [];
  joystickRunDir = null;
  joystickRunCandidateDir = null;
  joystickRunCandidateAt = 0;
}

function triggerJoystickRun(dir) {
  if (!emulator?.pressDown || !emulator?.pressUp) return;
  if (dir !== 'left' && dir !== 'right') return;

  const now = performance.now();
  if (joystickRunDir === dir || now - joystickLastRunAt < 420) return;

  clearJoystickRunTimers();
  joystickRunDir = dir;
  joystickLastRunAt = now;

  emulatorPress('pressUp', dir);
  joystickRunTimers.push(setTimeout(() => {
    emulatorPress('pressDown', dir);
  }, 20));
  joystickRunTimers.push(setTimeout(() => {
    emulatorPress('pressUp', dir);
  }, 70));
  joystickRunTimers.push(setTimeout(() => {
    emulatorPress('pressDown', dir);
    currentDirs[dir] = true;
  }, 120));
}

function handleJoystickEvent(e) {
  if (!isDragging || controlEditMode || isDraggingControl) return;

  const point = getPointFromEvent(e);
  if (!point) return;
  e.preventDefault();

  const { clientX, clientY } = point;

  const rect = joystickBase.getBoundingClientRect();
  const radius = rect.width / 2;
  const centerX = activeJoystickCenter?.x ?? rect.left + radius;
  const centerY = activeJoystickCenter?.y ?? rect.top + radius;

  let dx = clientX - centerX;
  let dy = clientY - centerY;
  let distance = Math.hypot(dx, dy);

  if (distance > radius) {
    const angle = Math.atan2(dy, dx);
    dx = Math.cos(angle) * radius;
    dy = Math.sin(angle) * radius;
    distance = radius;
  }

  joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;

  const threshold = radius * 0.3;
  const runThreshold = radius * 0.86;
  const newDirs = {
    up: dy < -threshold,
    down: dy > threshold,
    left: dx < -threshold,
    right: dx > threshold
  };

  for (const dir in newDirs) {
    if (newDirs[dir] !== currentDirs[dir]) {
      if (newDirs[dir]) {
        emulatorPress('pressDown', dir);
      } else {
        emulatorPress('pressUp', dir);
      }
      currentDirs[dir] = newDirs[dir];
    }
  }

  const horizontalRunDir = Math.abs(dx) > Math.abs(dy) && distance > runThreshold
    ? (dx < 0 ? 'left' : 'right')
    : null;
  joystickBase.classList.toggle('joystick-running', Boolean(horizontalRunDir));
  if (horizontalRunDir && newDirs[horizontalRunDir]) {
    const now = performance.now();
    if (joystickRunCandidateDir !== horizontalRunDir) {
      joystickRunCandidateDir = horizontalRunDir;
      joystickRunCandidateAt = now;
    }
    if (now - joystickRunCandidateAt > 130) {
      triggerJoystickRun(horizontalRunDir);
    }
  } else if (!horizontalRunDir) {
    joystickRunDir = null;
    joystickRunCandidateDir = null;
    joystickRunCandidateAt = 0;
  }
}

function resetJoystick(e) {
  if (e) {
    const point = getPointFromEvent(e);
    if (!point && activeJoystickPointerId !== null) return;
    e.preventDefault();
  }
  isDragging = false;
  activeJoystickPointerId = null;
  activeJoystickCenter = null;
  joystickKnob.style.transform = `translate(0px, 0px)`;
  joystickBase.classList.remove('joystick-running');
  clearJoystickRunTimers();
  for (const dir in currentDirs) {
    if (currentDirs[dir]) {
      emulatorPress('pressUp', dir);
      currentDirs[dir] = false;
    }
  }
  restoreJoystickPosition();
}

function shouldStartJoystickFromPoint(e) {
  if (e.target.closest('[data-key], button, .control-edit-handle')) return false;
  return e.clientX <= window.innerWidth * 0.48;
}

function startJoystick(e, allowWideZone = false) {
  if (controlEditMode || isDraggingControl) return;
  if (isDragging) return;
  if (e.target.closest('[data-key]') && e.target !== joystickBase) return;
  if (allowWideZone && !shouldStartJoystickFromPoint(e)) return;
  e.preventDefault();
  isDragging = true;
  activeJoystickPointerId = e.pointerId ?? null;
  placeJoystickAt(e.clientX, e.clientY);
  e.currentTarget?.setPointerCapture?.(e.pointerId);
  handleJoystickEvent(e);
}

joystickTouchZone?.addEventListener('pointerdown', (e) => startJoystick(e));
joystickTouchZone?.addEventListener('pointermove', handleJoystickEvent);
joystickTouchZone?.addEventListener('pointerup', resetJoystick);
joystickTouchZone?.addEventListener('pointercancel', resetJoystick);
virtualGamepad?.addEventListener('pointerdown', (e) => startJoystick(e, true));
virtualGamepad?.addEventListener('pointermove', handleJoystickEvent);
virtualGamepad?.addEventListener('pointerup', resetJoystick);
virtualGamepad?.addEventListener('pointercancel', resetJoystick);

joystickTouchZone?.addEventListener('touchstart', (e) => {
  if (controlEditMode || isDraggingControl) return;
  if (isDragging) return;
  if (e.target.closest('[data-key]') && e.target !== joystickBase) return;
  isDragging = true;
  activeJoystickPointerId = e.changedTouches?.[0]?.identifier ?? null;
  const point = getPointFromEvent(e);
  placeJoystickAt(point.clientX, point.clientY);
  handleJoystickEvent(e);
}, { passive: false });
joystickTouchZone?.addEventListener('touchmove', handleJoystickEvent, { passive: false });
joystickTouchZone?.addEventListener('touchend', resetJoystick);
joystickTouchZone?.addEventListener('touchcancel', resetJoystick);

// Flash D-pad: dispatch real keyboard events to Ruffle player
function dispatchFlashKey(key, code, type) {
  const rufflePlayer = document.querySelector('ruffle-player');
  const event = new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true, composed: true });
  if (rufflePlayer) rufflePlayer.dispatchEvent(event);
  window.dispatchEvent(new KeyboardEvent(type, { key, code, bubbles: true, cancelable: true }));
}

const activeFlashKeys = new Set();

document.querySelectorAll('.flash-btn').forEach(btn => {
  const pressDown = (e) => {
    if (flashEditMode || isDraggingFlashBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.dataset.flashKey;
    const code = btn.dataset.flashCode;
    if (activeFlashKeys.has(code)) return;
    activeFlashKeys.add(code);
    btn.classList.add('active');
    dispatchFlashKey(key, code, 'keydown');
  };

  const pressUp = (e) => {
    if (flashEditMode || isDraggingFlashBtn) return;
    e.preventDefault();
    e.stopPropagation();
    const key = btn.dataset.flashKey;
    const code = btn.dataset.flashCode;
    if (!activeFlashKeys.has(code)) return;
    activeFlashKeys.delete(code);
    btn.classList.remove('active');
    dispatchFlashKey(key, code, 'keyup');
  };

  btn.addEventListener('touchstart', pressDown, { passive: false });
  btn.addEventListener('touchend', pressUp, { passive: false });
  btn.addEventListener('touchcancel', pressUp, { passive: false });
  btn.addEventListener('mousedown', pressDown);
  btn.addEventListener('mouseup', pressUp);
  btn.addEventListener('mouseleave', pressUp);
});

// ---- VIRTUAL MOUSE JOYSTICK ----
(function initVMouseJoystick() {
  const base = document.getElementById('vmouseBase');
  const knob = document.getElementById('vmouseKnob');
  if (!base || !knob) return;

  const MAX_TRAVEL = 38;
  let pressing = false;
  let baseRect = null;
  let lastPos = null;

  // Pierce Ruffle's shadow DOM to get the actual canvas it listens on
  function getRuffleCanvas() {
    const player = document.querySelector('ruffle-player');
    if (player?.shadowRoot) {
      const canvas = player.shadowRoot.querySelector('canvas');
      if (canvas) return canvas;
    }
    return player || document.querySelector('#game');
  }

  function getGameRect() {
    return getRuffleCanvas()?.getBoundingClientRect() ?? null;
  }

  function fireEvent(target, type, x, y, buttons) {
    const isUp = type.includes('up') || type.includes('leave');
    const btns = buttons !== undefined ? buttons : (isUp ? 0 : 1);
    const base = {
      bubbles: true, cancelable: true, composed: true,
      view: window,
      clientX: x, clientY: y,
      screenX: x + window.screenX, screenY: y + window.screenY,
      button: 0, buttons: btns,
      movementX: 0, movementY: 0,
    };
    // PointerEvent first — this is what Ruffle's canvas actually handles
    try {
      target.dispatchEvent(new PointerEvent(type.replace('mouse', 'pointer'), {
        ...base,
        pointerId: 1, pointerType: 'mouse',
        isPrimary: true,
        pressure: btns ? 0.5 : 0,
        width: 1, height: 1,
        tiltX: 0, tiltY: 0, twist: 0,
      }));
    } catch (_) { }
    // MouseEvent fallback
    try { target.dispatchEvent(new MouseEvent(type, base)); } catch (_) { }
  }

  function getGamePos(ndx, ndy) {
    const rect = getGameRect();
    if (!rect) return null;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = Math.min(rect.width, rect.height) * 0.4;
    return { x: cx + ndx * r, y: cy + ndy * r };
  }

  function moveKnob(clientX, clientY) {
    const cx = baseRect.left + baseRect.width / 2;
    const cy = baseRect.top + baseRect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_TRAVEL);
    const ndx = dist > 1 ? dx / dist : 0;
    const ndy = dist > 1 ? dy / dist : 0;
    knob.style.transform = `translate(calc(-50% + ${ndx * clamped}px), calc(-50% + ${ndy * clamped}px))`;
    return { ndx, ndy };
  }

  base.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressing = true;
    baseRect = base.getBoundingClientRect();
    base.setPointerCapture(e.pointerId);
    base.classList.add('active');

    const { ndx, ndy } = moveKnob(e.clientX, e.clientY);
    const pos = getGamePos(ndx, ndy);
    if (!pos) return;
    lastPos = pos;
    const canvas = getRuffleCanvas();
    if (!canvas) return;
    fireEvent(canvas, 'mousemove', pos.x, pos.y, 0);
    fireEvent(canvas, 'mousedown', pos.x, pos.y, 1);
  });

  base.addEventListener('pointermove', (e) => {
    if (!pressing) return;
    e.preventDefault();
    const { ndx, ndy } = moveKnob(e.clientX, e.clientY);
    const pos = getGamePos(ndx, ndy);
    if (!pos) return;
    lastPos = pos;
    const canvas = getRuffleCanvas();
    if (canvas) fireEvent(canvas, 'mousemove', pos.x, pos.y, 1); // buttons:1 = left held = drag
  });

  function release(e) {
    if (!pressing) return;
    pressing = false;
    e.preventDefault();
    knob.style.transform = 'translate(-50%, -50%)';
    base.classList.remove('active');
    const canvas = getRuffleCanvas();
    if (canvas && lastPos) fireEvent(canvas, 'mouseup', lastPos.x, lastPos.y, 0);
    lastPos = null;
  }

  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);

  // ---- D-PAD mode ----
  document.querySelectorAll('#vmouseDpadGrid .vmouse-btn').forEach(btn => {
    const dx = parseFloat(btn.dataset.dx);
    const dy = parseFloat(btn.dataset.dy);
    let active = false;

    const onDown = (e) => {
      e.preventDefault(); e.stopPropagation();
      active = true;
      btn.classList.add('active');
      const rect = getGameRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const r = Math.min(rect.width, rect.height) * 0.4;
      const x = cx + dx * r, y = cy + dy * r;
      const canvas = getRuffleCanvas();
      if (!canvas) return;
      fireEvent(canvas, 'mousemove', x, y, 0);
      fireEvent(canvas, 'mousedown', x, y, 1);
    };
    const onUp = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!active) return;
      active = false;
      btn.classList.remove('active');
      const rect = getGameRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const r = Math.min(rect.width, rect.height) * 0.4;
      const x = cx + dx * r, y = cy + dy * r;
      const canvas = getRuffleCanvas();
      if (canvas) fireEvent(canvas, 'mouseup', x, y, 0);
    };

    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointercancel', onUp);
    btn.addEventListener('pointerleave', onUp);
  });

  // ---- Mode tab switcher ----
  const VMOUSE_MODE_KEY = 'vmouseMode';
  const joystickWrap = document.getElementById('vmouseJoystickWrap');
  const dpadGrid = document.getElementById('vmouseDpadGrid');

  function setVMouseMode(mode) {
    const isJoy = mode !== 'dpad';
    joystickWrap.style.display = isJoy ? '' : 'none';
    dpadGrid.style.display = isJoy ? 'none' : 'grid';
    document.querySelectorAll('.vmouse-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === (isJoy ? 'joystick' : 'dpad'));
    });
    localStorage.setItem(VMOUSE_MODE_KEY, isJoy ? 'joystick' : 'dpad');
  }

  document.querySelectorAll('.vmouse-tab').forEach(tab => {
    tab.addEventListener('click', () => setVMouseMode(tab.dataset.mode));
  });

  // Restore saved mode (default: joystick)
  setVMouseMode(localStorage.getItem(VMOUSE_MODE_KEY) || 'joystick');

  // ---- Main toggle ----
  document.getElementById('vmouseToggle')?.addEventListener('change', (e) => {
    document.body.classList.toggle('mouse-mode', e.target.checked);
  });
})();

// ---- PARENT / ZALO MINI APP BRIDGE (postMessage) ----
const ParentBridge = {
  post(event, data = {}) {
    if (window.parent === window) {
      console.log('[ParentBridge] not in iframe, skip:', event, data);
      return;
    }
    const payload = { source: 'retro-game', event, ...data };
    console.log('[ParentBridge] →', event, payload);
    try {
      window.parent.postMessage(payload, '*');
    } catch (err) {
      console.error('[ParentBridge] postMessage failed:', err);
    }
  },

  listen() {
    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (!msg || msg.source !== 'zalo-mini-app') return;

      if (msg.event === 'retro:launch') {
        const { type, id } = msg;
        if (!id) return;
        const lib = window._retroLib;
        if (!lib) return;
        const idLower = id.toLowerCase();
        const typeLower = (type || '').toLowerCase();

        let game = lib.allGames.find(g => {
          if (typeLower && g.system !== typeLower) return false;
          return g.rom.toLowerCase() === idLower || g.title.toLowerCase() === idLower;
        });
        if (!game) {
          game = lib.allGames.find(g => {
            if (typeLower && g.system !== typeLower) return false;
            return g.rom.toLowerCase().includes(idLower);
          });
        }
        if (game) {
          lib.selectGame(game, false);
          setTimeout(() => {
            const btn = document.getElementById('launchBtn');
            if (btn && !btn.disabled) btn.click();
          }, 300);
        }
      }
    });
  }
};
ParentBridge.listen();

// Auto-launch game from URL parameter if present
(function autoLaunchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const typeParam = (params.get('type') || '').toLowerCase();   // 'arcade' | 'flash'
  const idParam = params.get('id') || params.get('slug');        // rom name / slug
  const gameParam = params.get('game');                          // legacy ?game=

  if (!idParam && !gameParam) return;

  // initGameLibraryGrid runs at 100ms; wait 1500ms for grid + UI to settle
  setTimeout(() => {
    if (idParam && window._retroLib) {
      const { allGames, selectGame } = window._retroLib;
      const idLower = idParam.toLowerCase();

      let game = allGames.find(g => {
        if (typeParam && g.system !== typeParam) return false;
        return g.rom.toLowerCase() === idLower || g.title.toLowerCase() === idLower;
      });

      if (!game) {
        game = allGames.find(g => {
          if (typeParam && g.system !== typeParam) return false;
          return g.rom.toLowerCase().includes(idLower) || idLower.includes(g.rom.toLowerCase());
        });
      }

      if (game) {
        selectGame(game, false);
        setTimeout(() => {
          const btn = document.getElementById('launchBtn');
          if (btn && !btn.disabled) btn.click();
        }, 300);
        return;
      }
    }

    // Legacy: ?game=<slug> — arcade lookup via <select> element
    const legacyId = gameParam || idParam;
    if (legacyId) {
      const selectEl = document.getElementById('romUrl');
      if (selectEl) {
        const option = Array.from(selectEl.options).find(opt => {
          const filename = opt.value.toLowerCase().split('/').pop().replace('.zip', '');
          return filename === legacyId.toLowerCase();
        }) || Array.from(selectEl.options).find(opt =>
          opt.value.toLowerCase().includes(legacyId.toLowerCase())
        );
        if (option) {
          selectEl.value = option.value;
          selectEl.dispatchEvent(new Event('change'));
          setTimeout(() => {
            const btn = document.getElementById('launchBtn');
            if (btn && !btn.disabled) btn.click();
          }, 300);
        }
      }
    }
  }, 1500);
})();

// --- NETPLAY: 2 MÁY CHƠI CÙNG QUA LAN ---
// Máy chủ phòng chạy `npm run dev:lan` (vite --host), máy kia mở link mời
// hiện trong sidebar (vd http://192.168.1.5:5173/?room=abc). Vào phòng
// trước = player 1, vào sau = player 2. Luồng chơi: 2 máy vào phòng →
// Player 1 bấm Tải Game → cả 2 máy cùng bắt đầu, mỗi người tự chọn nhân
// vật và điều khiển player của mình; input được relay 2 chiều.
const netplayRoomInput = document.getElementById('netplayRoom');
const netplayJoinBtn = document.getElementById('netplayJoinBtn');
const netplayStatusEl = document.getElementById('netplayStatus');
const netplayShareEl = document.getElementById('netplayShare');
const netplayShareLinkEl = document.getElementById('netplayShareLink');
const netplayCopyLinkBtn = document.getElementById('netplayCopyLinkBtn');

function setNetplayStatus(text) {
  if (netplayStatusEl) netplayStatusEl.textContent = text;
}

// Hiện link mời máy 2 (chỉ máy chủ phòng / player 1 cần)
async function updateNetplayShare() {
  const show = NetPlay.connected && NetPlay.role === 1;
  if (!netplayShareEl) return;
  if (!show) {
    netplayShareEl.style.display = 'none';
    return;
  }

  // Chơi online (public broadcast/Supabase): máy 2 mở đúng trang này kèm ?room là vào
  if (NetPlay.transport === 'public' || NetPlay.transport === 'supabase') {
    const link = `${location.origin}${location.pathname}?room=${encodeURIComponent(NetPlay.room)}`;
    netplayCopyLinkBtn.style.display = '';
    netplayCopyLinkBtn.dataset.link = link;
    netplayShareEl.style.display = 'flex';
    return;
  }

  // Chơi LAN qua relay của dev server: link dùng IP LAN của máy chủ phòng
  try {
    const info = await fetch('/netplay-info').then((r) => r.json());
    if (!NetPlay.connected) return;
    if (!info.exposed) {
      netplayShareLinkEl.textContent = '⚠ Server chưa mở ra mạng LAN. Tắt server và chạy lại bằng: npm run dev:lan';
      netplayCopyLinkBtn.style.display = 'none';
    } else if (info.addresses.length === 0) {
      netplayShareLinkEl.textContent = '⚠ Không tìm thấy IP LAN — kiểm tra máy đã nối Wi-Fi/mạng chưa.';
      netplayCopyLinkBtn.style.display = 'none';
    } else {
      const link = `http://${info.addresses[0]}:${location.port || 80}/?room=${encodeURIComponent(NetPlay.room)}`;
      netplayCopyLinkBtn.style.display = '';
      netplayCopyLinkBtn.dataset.link = link;
    }
    netplayShareEl.style.display = 'flex';
  } catch {
    netplayShareEl.style.display = 'none';
  }
}

netplayCopyLinkBtn?.addEventListener('click', async () => {
  const link = netplayCopyLinkBtn.dataset.link;
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    showToast('Đã copy link — gửi cho máy 2 mở là vào phòng.', 'success');
  } catch {
    // Clipboard API cần HTTPS/localhost; mở link qua IP LAN (http) thì bị chặn
    showToast('Không copy tự động được — chép tay link bên dưới nhé.', 'error');
  }
});

function syncNetplayState() {
  localPlayers = NetPlay.connected && NetPlay.role > 0 ? [NetPlay.role] : [1, 2];
  updateNetplayShare();
  if (!NetPlay.connected) {
    setNetplayStatus('Chưa kết nối');
    if (netplayJoinBtn) netplayJoinBtn.textContent = 'Vào phòng';
    return;
  }
  if (netplayJoinBtn) netplayJoinBtn.textContent = 'Rời phòng';
  const roleLabel = `bạn là Player ${NetPlay.role}`;
  const viaLabel = NetPlay.transport === 'ws' ? 'LAN' : 'online';
  let activeHint;
  if (!NetPlay.active) {
    activeHint = `${roleLabel}, đang chờ máy thứ 2...`;
  } else if (NetPlay.role === 1) {
    activeHint = `đủ 2 máy — ${roleLabel} (host). Cứ chơi bình thường, máy 2 sẽ tự theo.`;
  } else {
    activeHint = `đủ 2 máy — ${roleLabel}. Game tự tải theo host, sau đó nhét xu + bắt đầu để vào chơi.`;
  }
  setNetplayStatus(`Phòng "${NetPlay.room}" (${viaLabel}): ${activeHint}`);
}

NetPlay.handlers.role = () => {
  syncNetplayState();
  netplayLastStateTs = 0;
  netplaySyncedToastShown = false;
  // Máy 2 vào phòng khi đang chơi dở: dọn game cũ (keybind sai vai),
  // chờ Player 1 chọn game để cả 2 bắt đầu cùng lúc
  if (NetPlay.role === 2 && emulator) {
    destroyRunningGame().then(() => {
      setLog('Đã vào phòng 2 máy. Chờ Player 1 chọn game để bắt đầu cùng nhau.');
    });
  }
};

NetPlay.handlers.peers = (count) => {
  syncNetplayState();
  if (count >= 2) {
    showToast(`Máy thứ 2 đã vào phòng — bạn là Player ${NetPlay.role}!`, 'success');
    // Host đang chơi thì KHÔNG khởi động lại: mở stream WebRTC cho máy 2
    // xem trực tiếp (1 giả lập duy nhất). Máy không hỗ trợ WebRTC thì quay
    // về cách cũ — gửi game cho máy 2 tự tải rồi đồng bộ savestate.
    if (NetPlay.role === 1 && emulator) {
      if (netplayStartStream()) {
        showToast('Đang mở stream màn hình cho máy 2 — cứ chơi tiếp.', 'success');
      } else if (netplayLastLaunch) {
        NetPlay.send({ type: 'launch', ...netplayLastLaunch });
        showToast('Đã gửi game cho máy 2 tải theo — cứ chơi tiếp, không cần chờ.', 'success');
      }
    }
  } else {
    NetStream.stop();
    showToast('Máy kia đã rời phòng.', 'error');
  }
};

// Chuyển savestate qua WebSocket (JSON) nên phải mã hoá base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'application/octet-stream' });
}

// Savestate nén gzip trước khi gửi: nhỏ hơn nhiều lần → ít chunk hơn,
// truyền nhanh hơn → state đến máy 2 "tươi" hơn → cú nhảy khi nạp nhỏ hơn.
// CompressionStream có sẵn trong mọi browser hiện đại; msg đánh dấu enc:'gz'
// để bên nhận biết cần giải nén (phòng khi 2 máy chạy bản app khác nhau).
function gzipBlob(blob) {
  return new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();
}

function gunzipBlob(blob) {
  return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).blob();
}

// Host là NGUỒN SỰ THẬT của trận đấu: chỉ relay input thì 2 giả lập chạy
// độc lập sẽ lệch dần (input đến trễ, áp vào frame khác nhau) → host định
// kỳ đẩy savestate sang để máy 2 luôn bám đúng trận của host.
// Chu kỳ ngắn = mỗi lần lệch ít = cú nhảy nhỏ; nhờ nén gzip nên đẩy dày
// hơn trước mà băng thông vẫn thấp hơn (supabase giữ thưa vì rate limit).
const NETPLAY_STATE_SYNC_MS = { ws: 2000, public: 3000, supabase: 5000 };
let netplayStatePushBusy = false;
let netplayLastStatePushAt = 0;

async function netplayPushState() {
  // Đang stream WebRTC thì máy 2 xem trực tiếp, không cần đồng bộ savestate
  if (NetStream.mode === 'host') return;
  if (netplayStatePushBusy || NetPlay.role !== 1 || !NetPlay.active || !emulator) return;
  netplayStatePushBusy = true;
  try {
    const saved = await emulator.saveState();
    let blob = saved?.state || saved;
    if (blob instanceof Blob) {
      let enc = '';
      if (typeof CompressionStream === 'function') {
        blob = await gzipBlob(blob);
        enc = 'gz';
      }
      await NetPlay.send({ type: 'state', ts: Date.now(), enc, data: await blobToBase64(blob) });
    }
  } catch (err) {
    // Game không hỗ trợ savestate (vd Flash) hoặc đang chuyển cảnh — bỏ qua lượt này
    console.warn('[Netplay] Bỏ qua một lượt đồng bộ state:', err?.message || err);
  } finally {
    netplayStatePushBusy = false;
  }
}

setInterval(() => {
  if (NetPlay.role !== 1 || !NetPlay.active || !emulator || netplayStatePushBusy) return;
  const interval = NETPLAY_STATE_SYNC_MS[NetPlay.transport] || NETPLAY_STATE_SYNC_MS.supabase;
  if (Date.now() - netplayLastStatePushAt < interval) return;
  netplayLastStatePushAt = Date.now();
  netplayPushState();
}, 1000);

// Máy 2 tải game xong sẽ xin savestate ngay (không đợi chu kỳ)
NetPlay.handlers['state-request'] = () => {
  netplayLastStatePushAt = Date.now();
  netplayPushState();
};

// Máy 2 nhận savestate của host -> nạp vào để bám đúng trận của host
let netplayLastStateTs = 0;
let netplaySyncedToastShown = false;

NetPlay.handlers.state = async ({ data, ts, enc }) => {
  if (!emulator || !data || NetPlay.role !== 2) return;
  if (ts && ts < netplayLastStateTs) return; // state cũ đến muộn, bỏ
  netplayLastStateTs = ts || Date.now();
  try {
    let blob = base64ToBlob(data);
    if (enc === 'gz') blob = await gunzipBlob(blob);
    await emulator.loadState(blob);
    if (!netplaySyncedToastShown) {
      netplaySyncedToastShown = true;
      showToast('Đã đồng bộ với máy Player 1 — nhét xu + bắt đầu để vào chơi!', 'success');
      setLog('Đã đồng bộ trạng thái game với Player 1.\nNhét xu và bấm Bắt đầu để Player 2 vào trận.\nMàn hình sẽ tự bám theo host trong suốt trận.');
    }
  } catch (err) {
    console.error('[Netplay] Không nạp được savestate:', err);
  }
};

NetPlay.handlers.close = () => {
  NetStream.stop();
  syncNetplayState();
  setNetplayStatus('Mất kết nối phòng — bấm Vào phòng để thử lại.');
  showToast('Đã mất kết nối phòng chơi 2 máy.', 'error');
};

NetPlay.handlers.error = (msg) => {
  setNetplayStatus(`Lỗi kết nối: ${msg}`);
  showToast(msg, 'error');
};

// Nhận input của người chơi bên máy kia và đưa vào giả lập ở máy này
NetPlay.handlers.input = ({ method, button, player }) => {
  if (!emulator) return;
  if ((method === 'pressDown' || method === 'pressUp') && typeof emulator[method] === 'function') {
    emulator[method]({ button, player });
  }
};

// Player 1 chọn game xong thì máy này tự tải đúng game đó
NetPlay.handlers.launch = async ({ rom, core }) => {
  if (!rom || NetPlay.role !== 2) return;
  if (emulator) await destroyRunningGame();

  if (core && coreNameEl && [...coreNameEl.options].some((o) => o.value === core)) {
    coreNameEl.value = core;
  }
  const romValue = Array.isArray(rom) ? rom.join('\n') : rom;
  if (romUrlEl) {
    if (![...romUrlEl.options].some((o) => o.value === romValue)) {
      const opt = document.createElement('option');
      opt.value = romValue;
      opt.textContent = `[Netplay] ${romValue.split('/').pop()}`;
      romUrlEl.append(opt);
    }
    romUrlEl.value = romValue;
  }
  romSource = 'list';
  netplayLastStateTs = 0;
  netplaySyncedToastShown = false;
  showToast('Player 1 đã chọn game — đang tải...', 'success');
  netplayLaunchFromHost = true;
  try {
    await launchGame();
  } finally {
    netplayLaunchFromHost = false;
  }
};

// Máy 2 bấm Tải Game khi chưa xem stream -> host thử mở stream trước,
// không được thì rơi xuống cách cũ (gửi game + đồng bộ state)
NetPlay.handlers['stream-request'] = () => {
  if (NetPlay.role !== 1) return;
  if (emulator && netplayStartStream()) return;
  NetPlay.handlers['launch-request']({});
};

// Máy 2 xin game theo cách cũ (stream WebRTC không nối được, hoặc bản app
// cũ) -> host dừng stream rồi gửi game cho máy 2 tự tải + đồng bộ state
NetPlay.handlers['launch-request'] = () => {
  if (NetPlay.role !== 1) return;
  NetStream.stop(true);
  if (emulator && netplayLastLaunch) {
    NetPlay.send({ type: 'launch', ...netplayLastLaunch });
  } else if (emulator) {
    showToast('Máy 2 không xem được stream và game này (file local) không gửi qua mạng được.', 'error');
  } else {
    showToast('Máy 2 đang chờ bạn chọn game — bấm Tải Game để bắt đầu.', 'success');
  }
};

// ==== Netplay stream (WebRTC): host chạy 1 giả lập duy nhất, máy 2 xem hình ====
let netplayVideoEl = null;
let netplayVideoWatchdog = 0;

NetStream.handlers.stream = (stream) => {
  if (!stream) {
    clearTimeout(netplayVideoWatchdog);
    netplayVideoEl?.remove();
    netplayVideoEl = null;
    // Trả máy 2 về giao diện sảnh (máy 2 xem stream không có giả lập local)
    if (!emulator) {
      document.body.classList.remove('playing');
      if (exitBtn) exitBtn.disabled = true;
      setStatus('Đang chờ...');
    }
    return;
  }
  const shell = document.querySelector('.screen-shell');
  if (!shell) return;
  if (netplayVideoEl && netplayVideoEl.srcObject === stream && shell.contains(netplayVideoEl)) return; // ontrack gọi 2 lần (video + audio)
  if (!netplayVideoEl || !shell.contains(netplayVideoEl)) {
    netplayVideoEl?.remove();
    netplayVideoEl = document.createElement('video');
    netplayVideoEl.id = 'netplayStreamVideo';
    netplayVideoEl.autoplay = true;
    netplayVideoEl.playsInline = true;
    // WKWebView (Zalo mini app trên iOS) đọc ATTRIBUTE chứ không phải
    // property — thiếu là video bị đẩy ra player fullscreen hoặc không chạy
    netplayVideoEl.setAttribute('playsinline', '');
    netplayVideoEl.setAttribute('webkit-playsinline', '');
    // image-rendering: pixelated — phóng to kiểu nearest-neighbor cho khớp
    // canvas giả lập local (style.css), không thì bilinear làm nhòe pixel art
    netplayVideoEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:5;image-rendering:pixelated;';
    shell.append(netplayVideoEl);
  }
  // Vào giao diện chơi fullscreen như khi có giả lập local: hiện gamepad
  // ảo (input relay sang host) và mở nút Thoát để rời màn hình xem
  document.body.classList.add('playing');
  if (exitBtn) exitBtn.disabled = false;
  netplayVideoEl.srcObject = stream;
  const video = netplayVideoEl;
  video.play()?.catch(async () => {
    if (netplayVideoEl !== video) return;
    // Browser chặn autoplay có tiếng khi chưa có tương tác → phát câm trước
    video.muted = true;
    try {
      await video.play();
      // Hình đã chạy (câm) — chờ người dùng chạm để bật tiếng. Nghe ở
      // document vì gamepad ảo phủ lên trên video, click không tới video.
      document.addEventListener('pointerdown', () => {
        if (netplayVideoEl === video) video.muted = false;
      }, { once: true });
      showToast('Chạm vào màn hình để bật tiếng.', 'success');
    } catch {
      // Nhúng trong iframe cross-origin không có allow="autoplay" thì đến cả
      // phát câm cũng bị chặn (Permissions Policy mặc định chỉ cho 'self')
      // → video kẹt ở màn hình đen dù stream đã đổ về. Phải chờ người dùng
      // chạm vào trang rồi mới play lại được.
      const resume = () => {
        if (netplayVideoEl !== video) return;
        video.muted = false;
        video.play().catch(() => {
          // Gesture đủ cho phát câm nhưng chưa đủ cho tiếng → ưu tiên có hình
          video.muted = true;
          video.play().catch(() => { /* hết cách, chờ gesture sau */ });
        });
      };
      document.addEventListener('pointerdown', resume, { once: true });
      showToast('Chạm vào màn hình để bắt đầu xem.', 'success');
    }
  });
  // Webview nhúng có thể nhận track nhưng không decode được frame nào
  // (video kẹt đen dù kết nối 'connected') → sau 8s chưa thấy hình thì coi
  // như xem thất bại, xin host gửi game về chơi kiểu cũ thay vì đen mãi.
  // videoWidth > 0 hoặc readyState >= 2 nghĩa là frame đã về (kể cả khi
  // đang pause chờ người dùng chạm) — trường hợp đó KHÔNG fallback.
  clearTimeout(netplayVideoWatchdog);
  netplayVideoWatchdog = setTimeout(() => {
    if (netplayVideoEl !== video) return;
    const gotFrames = video.videoWidth > 0 || video.readyState >= 2;
    ParentBridge.post('retro:streamHealth', {
      gotFrames,
      videoWidth: video.videoWidth,
      readyState: video.readyState,
      paused: video.paused,
    });
    if (gotFrames) return;
    NetStream.stop();
    NetStream.handlers.viewFailed?.();
  }, 8000);
  setStatus('Đang chơi qua stream');
  setLog('Đang chơi trực tiếp trên máy host qua stream.\nMọi phím bấm được gửi thẳng sang host — nhét xu + bắt đầu như bình thường.');
  showToast('Đã kết nối stream từ host — chơi trực tiếp, không còn trễ đồng bộ!', 'success');
};

// Input máy 2 gửi qua data channel → áp vào giả lập của host
NetStream.handlers.input = (msg) => {
  if (msg?.type === 'input') NetPlay.handlers.input(msg);
};

// Máy 2 không nối được stream (NAT chặt, không TURN) → xin đường cũ
NetStream.handlers.viewFailed = () => {
  if (!NetPlay.active) return;
  ParentBridge.post('retro:streamFailed', {});
  showToast('Không kết nối được stream — chuyển sang chế độ tải game về máy...', 'error');
  NetPlay.send({ type: 'launch-request' });
};

// Đẩy trạng thái WebRTC ra app nhúng (Zalo mini app log mọi postMessage) —
// debug được "kẹt ở bước nào" khi không mở được devtools trong webview
NetStream.handlers.rtcState = (state) => {
  ParentBridge.post('retro:rtcState', { state });
};

// Máy 2 không trả lời offer (bản app cũ?) → host gửi 'launch' như cũ
NetStream.handlers.hostNoAnswer = () => {
  if (NetPlay.active && NetPlay.role === 1 && emulator && netplayLastLaunch) {
    NetPlay.send({ type: 'launch', ...netplayLastLaunch });
    showToast('Máy 2 không hỗ trợ stream — đã gửi game cho máy 2 tải theo.', 'success');
  }
};

if (isDev) {
  window.NetPlay = NetPlay;
  window.NetStream = NetStream;
}

netplayJoinBtn?.addEventListener('click', () => {
  if (NetPlay.connected) {
    NetStream.stop(true);
    NetPlay.leave();
    syncNetplayState();
    return;
  }
  const room = (netplayRoomInput?.value || '').trim();
  if (!room) {
    showToast('Nhập tên phòng trước đã.', 'error');
    netplayRoomInput?.focus();
    return;
  }
  setNetplayStatus('Đang kết nối...');
  NetPlay.join(room);
});

// Tự vào phòng nếu URL có ?room=... (tiện gửi link cho máy thứ 2)
{
  const roomParam = new URLSearchParams(location.search).get('room');
  if (roomParam && netplayRoomInput && netplayJoinBtn) {
    netplayRoomInput.value = roomParam;
    netplayJoinBtn.click();
  }
}

// Phím vật lý được RetroArch xử lý native (không qua emulatorPress),
// nên phải bắt riêng ở đây để relay sang máy kia. Bộ phím LOCAL luôn là
// phím của người chơi trên máy này, bất kể vai là player 1 hay 2.
const NETPLAY_PHYSICAL_KEYS = {
  KeyW: 'up', KeyA: 'left', KeyS: 'down', KeyD: 'right',
  KeyI: 'x', KeyJ: 'y', KeyK: 'a', KeyL: 'b',
  Space: 'select', Enter: 'start',
};

function relayPhysicalKey(e, method) {
  if (!NetPlay.active || e.repeat) return;
  // Máy 2 xem stream không có giả lập local nhưng phím vẫn phải gửi đi
  if (!emulator && NetStream.mode !== 'view') return;
  const el = document.activeElement;
  if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) return;
  const button = NETPLAY_PHYSICAL_KEYS[e.code];
  if (button) netplayRelayInput(method, button);
}

window.addEventListener('keydown', (e) => relayPhysicalKey(e, 'pressDown'));
window.addEventListener('keyup', (e) => relayPhysicalKey(e, 'pressUp'));
