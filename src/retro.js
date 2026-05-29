import './style.css';
import { Nostalgist } from 'nostalgist';
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
  <header class="header">
    <div class="header-content">
      <div class="brand">
        <h1>Hệ Thống Arcade Cổ Điển</h1>
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
        <button id="settingsBtn" class="secondary">Cài Đặt</button>
        <button id="restoreControlsBtn" class="secondary" type="button">Khôi phục</button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <section class="game-area">
      <div class="screen-shell" style="position: relative;">
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
      <div class="controls-bar">
        <button id="launchBtn" class="primary">Tải Game</button>
        <button id="pauseBtn" disabled>Tạm Dừng</button>
        <button id="resumeBtn" disabled>Tiếp Tục</button>
        <button id="customizeControlsBtn" class="secondary" type="button">Cài đặt nút</button>
        <button id="addCustomControlBtn" class="secondary" type="button">Thêm nút</button>
        <div class="exit-actions" style="display: flex; flex-direction: column; gap: 10px;">
          <button id="exitBtn" disabled>Thoát</button>
          <button id="saveBtn" disabled>Save Game</button>
          <button id="loadBtn" disabled>Chơi Tiếp</button>
        </div>
      </div>

      <!-- VIRTUAL GAMEPAD -->
      <div class="virtual-gamepad">
        <div class="joystick-wrapper">
          <div class="action-btn macro-btn macro-slide-l" data-key="macro-slide-l" data-control-id="macro-slide-l">⬅️⬅️B</div>
          <div class="action-btn macro-btn macro-slide-r" data-key="macro-slide-r" data-control-id="macro-slide-r">➡️➡️B</div>
          <div class="joystick-base" id="joystickBase" data-control-id="joystick">
            <div class="joystick-knob" id="joystickKnob"></div>
          </div>
        </div>
        
        <div class="skill-buttons">
          <div class="skill-macro-row">
            <div class="action-btn macro-btn macro-ud" data-key="macro-ud" data-control-id="macro-ud">⬇️⬆️</div>
            <div class="action-btn macro-btn macro-du" data-key="macro-du" data-control-id="macro-du">⬆️⬇️</div>
          </div>
          <div class="skill-macro-row">
            <div class="action-btn macro-btn macro-lr" data-key="macro-lr" data-control-id="macro-lr">⬅️➡️</div>
            <div class="action-btn macro-btn macro-rl" data-key="macro-rl" data-control-id="macro-rl">➡️⬅️</div>
          </div>
          <div class="action-btn macro-btn macro-skill-l" data-key="macro-skill-l" data-control-id="macro-skill-l">➡️⬅️B</div>
          <div class="action-btn macro-btn macro-skill-r" data-key="macro-skill-r" data-control-id="macro-skill-r">⬅️➡️B</div>
          <div class="action-btn macro-btn macro-unti" data-key="macro-unti" data-control-id="macro-unti">⬇️⬆️B</div>
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
                <input class="input custom-delay-input" data-index="${idx}" type="number" min="0" max="3000" step="10" value="${idx === 0 ? 0 : 60}" />
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
          <button type="button" class="category-btn" data-system="nes">🔴 NES</button>
          <button type="button" class="category-btn" data-system="snes">🟣 SNES</button>
          <button type="button" class="category-btn" data-system="gameboy">🟢 Game Boy</button>
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
  const parent = img.parentNode;
  if (parent) {
    parent.innerHTML = `
      <div class="card-fallback">
        🎮
        <div class="card-fallback-text">${title.slice(0, 12)}</div>
      </div>
    `;
  }
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

  const allGames = [...arcadeGames, ...consoleGames];
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
          <span class="card-system-badge">${game.system}</span>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        RetroSynth.playHover();
      });

      let lastClick = 0;
      card.addEventListener('click', () => {
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
  if (running) {
    userPausedGame = false;
    autoPausedForControls = false;
    document.body.classList.add('playing');
    if (settingsBtn && controlsBar && settingsBtn.parentElement !== controlsBar) {
      controlsBar.insertBefore(settingsBtn, controlsBar.firstElementChild);
    }
    if (restoreControlsBtn && controlsBar && restoreControlsBtn.parentElement !== controlsBar) {
      settingsBtn?.after(restoreControlsBtn);
    }
    if (addCustomControlBtn && controlsBar && addCustomControlBtn.parentElement !== controlsBar) {
      restoreControlsBtn?.after(addCustomControlBtn);
    }
    if (exitBtn && controlsBar && exitBtn.parentElement !== controlsBar) {
      controlsBar.appendChild(exitBtn);
    }
    applySavedControlLayout();
  } else {
    userPausedGame = false;
    autoPausedForControls = false;
    document.body.classList.remove('playing');
    setControlEditMode(false);
    if (settingsBtn && headerControls && settingsBtn.parentElement !== headerControls) {
      headerControls.appendChild(settingsBtn);
    }
    if (restoreControlsBtn && headerControls && restoreControlsBtn.parentElement !== headerControls) {
      headerControls.appendChild(restoreControlsBtn);
    }
    if (addCustomControlBtn && controlsBar && addCustomControlBtn.parentElement !== controlsBar) {
      controlsBar.insertBefore(addCustomControlBtn, document.querySelector('.exit-actions'));
    }
    const exitActions = document.querySelector('.exit-actions');
    if (exitBtn && exitActions && exitBtn.parentElement !== exitActions) {
      exitActions.insertBefore(exitBtn, exitActions.firstElementChild);
    }
    clearControlLayoutStyles(true);
    restoreControlParents();
  }
}

async function destroyRunningGame() {
  stopPlayTimer();
  stopContinueCountdown();

  if (!emulator) {
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
  if (!CoinSystem.isInfinite() && CoinSystem.coins <= 0) {
    AudioSynth.playWarning();
    showToast('Tài khoản của bạn đã hết xu! Hãy nạp thêm xu để chơi game.', 'error');
    openShopModal();
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

        // Native keyboard mappings for maximum performance and fluid combinations
        input_player1_up: 'w',
        input_player1_left: 'a',
        input_player1_down: 's',
        input_player1_right: 'd',
        input_player1_x: 'i',
        input_player1_y: 'j',
        input_player1_a: 'k',
        input_player1_b: 'l',
        input_player1_select: 'space',
        input_player1_start: 'enter',


        input_player2_up: 'up',
        input_player2_left: 'left',
        input_player2_down: 'down',
        input_player2_right: 'right',
        input_player2_x: 'num1',
        input_player2_y: 'num2',
        input_player2_a: 'num3',
        input_player2_b: 'num4',
        input_player2_select: 'num5',
        input_player2_start: 'num6',
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

      if (emulator.pressDown) {
        emulator.pressDown({ button: 'select', player: 1 });
      }
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
      emulator.pressDown({ button: b, player: 1 });
      const el = document.querySelector(`.btn-${b}`);
      if (el) el.classList.add('active');
    });
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space' || e.code === 'Shift') {
    if (emulator) {
      if (emulator.pressUp) {
        emulator.pressUp({ button: 'select', player: 1 });
      }
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
      emulator.pressUp({ button: b, player: 1 });
      const el = document.querySelector(`.btn-${b}`);
      if (el) el.classList.remove('active');
    });
  }
});

window.addEventListener('beforeunload', () => {
  if (emulator) emulator.exit().catch(() => { });
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
    <input class="input custom-delay-input" data-index="${idx}" type="number" min="0" max="3000" step="10" value="${delay}" />
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
  customControlModal?.classList.remove('hidden');
  customControlModal?.setAttribute('aria-hidden', 'false');
}

function closeCustomControlModal() {
  customControlModal?.classList.add('hidden');
  customControlModal?.setAttribute('aria-hidden', 'true');
  editingCustomControlId = null;
  resumeAfterControlEditing();
}

function pressVirtualAction(action, pressed) {
  const button = customActionButtonMap[action];
  if (!button || !emulator) return;

  const method = pressed ? 'pressDown' : 'pressUp';
  if (emulator[method]) {
    emulator[method]({ button, player: 1 });
  }
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
  }
}

customizeControlsBtn?.addEventListener('click', () => {
  setControlEditMode(!controlEditMode);
});

settingsBtn?.addEventListener('click', () => {
  setControlEditMode(!controlEditMode);
});

restoreControlsBtn?.addEventListener('click', () => {
  restoreDefaultControls();
});

addCustomControlBtn?.addEventListener('click', () => {
  openCustomControlModal();
  if (!controlEditMode) {
    setControlEditMode(true);
  }
});

closeCustomControlModalBtn?.addEventListener('click', () => {
  closeCustomControlModal();
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
              emulator.pressDown({ button: pb, player: 1 });
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
            'macro-slide-l': ['left', 'left', 'left', 'b'],
            'macro-slide-r': ['right', 'right', 'right', 'b']
          };
          const dirs = macroMap[btnName];
          if (dirs) {
            dirs.forEach((btnKey, idx) => {
              setTimeout(() => {
                emulator.pressDown({ button: btnKey, player: 1 });
                // Visual highlight
                if (['up', 'down', 'left', 'right'].includes(btnKey)) {
                  const knob = document.getElementById('joystickKnob');
                  const offsets = { 'up': [0, -35], 'down': [0, 35], 'left': [-35, 0], 'right': [35, 0] };
                  if (knob) knob.style.transform = `translate(${offsets[btnKey][0]}px, ${offsets[btnKey][1]}px)`;
                } else {
                  const btnElem = document.querySelector(`.btn-${btnKey}`);
                  if (btnElem) btnElem.classList.add('active');
                }
              }, idx * 60);

              setTimeout(() => {
                emulator.pressUp({ button: btnKey, player: 1 });
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
              }, idx * 60 + 40);
            });
          }
        } else if (padBtn) {
          emulator.pressDown({ button: padBtn, player: 1 });
        }
      }
    }
  };

  const upHandler = (e) => {
    e.preventDefault();
    if (controlEditMode || isDraggingControl) return;
    if (btn.classList.contains('active')) {
      btn.classList.remove('active');
      if (emulator && emulator.pressUp) {
        if (btnName.startsWith('combo-')) {
          const keys = btnName.replace('combo-', '').split('');
          keys.forEach(k => {
            const pb = nostalgistMap[k];
            if (pb) {
              emulator.pressUp({ button: pb, player: 1 });
              const el = document.querySelector(`.btn-${pb}`);
              if (el) el.classList.remove('active');
            }
          });
        } else if (padBtn) {
          emulator.pressUp({ button: padBtn, player: 1 });
        }
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
const joystickTouchZone = document.querySelector('.joystick-wrapper');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

let isDragging = false;
let activeJoystickPointerId = null;
let activeJoystickCenter = null;
let joystickWasFloating = false;
let currentDirs = { up: false, down: false, left: false, right: false };

function getPointFromEvent(e) {
  if (e.changedTouches && activeJoystickPointerId !== null) {
    const matchingTouch = Array.from(e.changedTouches).find(t => t.identifier === activeJoystickPointerId);
    if (matchingTouch) return { clientX: matchingTouch.clientX, clientY: matchingTouch.clientY };
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

function handleJoystickEvent(e) {
  if (!isDragging || controlEditMode || isDraggingControl) return;
  e.preventDefault();

  const { clientX, clientY } = getPointFromEvent(e);

  const rect = joystickBase.getBoundingClientRect();
  const radius = rect.width / 2;
  const centerX = activeJoystickCenter?.x ?? rect.left + radius;
  const centerY = activeJoystickCenter?.y ?? rect.top + radius;

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
  activeJoystickPointerId = null;
  activeJoystickCenter = null;
  joystickKnob.style.transform = `translate(0px, 0px)`;
  for (const dir in currentDirs) {
    if (currentDirs[dir]) {
      if (emulator && emulator.pressUp) emulator.pressUp({ button: dir, player: 1 });
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

// Auto-launch game from URL parameter if present
(function autoLaunchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const gameParam = params.get('game');
  if (gameParam) {
    const selectEl = document.getElementById('romUrl');
    if (selectEl) {
      const option = Array.from(selectEl.options).find(opt => {
        const valLower = opt.value.toLowerCase();
        const paramLower = gameParam.toLowerCase();
        const filename = valLower.split('/').pop().replace('.zip', '');
        return filename === paramLower;
      }) || Array.from(selectEl.options).find(opt =>
        opt.value.toLowerCase().includes(gameParam.toLowerCase())
      );
      if (option) {
        selectEl.value = option.value;
        selectEl.dispatchEvent(new Event('change'));

        // Wait for the UI grid/selection to register and automatically click start
        setTimeout(() => {
          const launchBtn = document.getElementById('launchBtn');
          if (launchBtn && !launchBtn.disabled) {
            launchBtn.click();
          }
        }, 1500);
      }
    }
  }
})();
