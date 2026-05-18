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
        <canvas id="game" style="width: 100%; height: 100%;"></canvas>
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
        <label class="label" for="romUrl">Chọn Game (ROM)</label>
        <select id="romUrl" class="input">
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
        <p class="hint">
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

const screenShellEl = document.querySelector('.screen-shell');
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
  screenShellEl.innerHTML = '<canvas id="game" style="width: 100%; height: 100%;"></canvas>';
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