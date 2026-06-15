import { createClient } from '@supabase/supabase-js';
import './vlog.css';

// Supabase environment configs (safely read from .env in Vite build)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse Zalo Mini App integration params (passed via iframe URL or remember via localStorage)
const urlParams = new URLSearchParams(window.location.search);
const zaloUid = urlParams.get('zalo_user_id') || urlParams.get('zalo_uid') || urlParams.get('uid');
const zaloUsername = urlParams.get('zalo_username') || urlParams.get('username') || urlParams.get('name');
const zaloAvatar = urlParams.get('zalo_avatar') || urlParams.get('avatar') || urlParams.get('avatar_url');

if (zaloUid) localStorage.setItem('vlog_zalo_uid', zaloUid);
if (zaloUsername) localStorage.setItem('vlog_zalo_username', zaloUsername);
if (zaloAvatar) localStorage.setItem('vlog_zalo_avatar', zaloAvatar);

// Global state for Vlog Feature
let videoList = [];
let activeVideoIndex = 0;
let isMuted = true; // Autoplay safety first
let autoPlayNext = true;

let vlogConfig = {
  can_upload_vlog: true,
  can_like: true,
  show_spots: true,
  show_hotels: true,
  show_viewer: true,
  show_member_badge: true
};

async function fetchVlogConfig() {
  try {
    const { data, error } = await supabase.from('zalo_mini_app_section_setting').select('key, value');
    if (!error && data) {
      data.forEach(row => {
        const val = row.value === 'true' || row.value === true;
        if (row.key in vlogConfig) {
          vlogConfig[row.key] = val;
        }
      });
      console.log('Loaded vlog config:', vlogConfig);
    }
  } catch (err) {
    console.warn('Could not fetch vlog configs:', err);
  }
}

// High-performance dynamic sliding window for video elements
function updateVideoSources(activeIndex) {
  const slides = document.querySelectorAll('.vlog-slide');
  slides.forEach((slide) => {
    const index = parseInt(slide.dataset.index, 10);
    const videoEl = slide.querySelector('.vlog-video');
    if (!videoEl) return;

    // Explicitly pause non-active videos to prevent audio overlap
    if (index !== activeIndex) {
      try {
        videoEl.pause();
      } catch (e) { }
    }

    const videoData = videoList[index];
    if (!videoData) return;

    // Sliding window bounds: Active video, previous one, and next two (index range [activeIndex - 1, activeIndex + 2])
    const isWithinWindow = index >= activeIndex - 1 && index <= activeIndex + 2;

    if (isWithinWindow) {
      if (videoEl.dataset.videoId !== String(videoData.id)) {
        videoEl.dataset.videoId = videoData.id;
        videoEl.removeAttribute('src');
        videoEl.innerHTML = '';

        if (videoData.hls_url) {
          const sourceHls = document.createElement('source');
          sourceHls.src = videoData.hls_url;
          sourceHls.type = 'application/x-mpegURL';
          videoEl.appendChild(sourceHls);
        }

        if (videoData.url) {
          const sourceMp4 = document.createElement('source');
          sourceMp4.src = videoData.url;
          sourceMp4.type = 'video/mp4';
          videoEl.appendChild(sourceMp4);
        }

        videoEl.load();
      }
    } else {
      if (videoEl.dataset.videoId) {
        delete videoEl.dataset.videoId;
        videoEl.src = '';
        videoEl.removeAttribute('src');
        videoEl.innerHTML = '';
        videoEl.load(); // Immediately releases browser decoder buffers and memory
      }
    }
  });
}

// Mock database for scenic travel spots in Vietnam (with real seekable timestamps)
const MOCK_SPOTS_TEMPLATES = [
  [
    { name: "Phố Cổ Hội An lung linh đêm hoa đăng", time: 5, thumb: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&fit=crop" },
    { name: "Chùa Cầu Cổ Kính - Trái tim Hội An", time: 15, thumb: "https://images.unsplash.com/photo-1528127269322-539801943592?w=200&fit=crop" },
    { name: "Thả hoa đăng ước nguyện bên dòng sông Hoài", time: 30, thumb: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&fit=crop" }
  ],
  [
    { name: "Bình minh trên Vịnh Hạ Long huyền ảo", time: 3, thumb: "https://images.unsplash.com/photo-1528127269322-539801943592?w=200&fit=crop" },
    { name: "Khám phá Hang Sửng Sốt kỳ vĩ", time: 18, thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&fit=crop" },
    { name: "Chèo thuyền Kayak ngắm Đảo Ti Tốp", time: 35, thumb: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=200&fit=crop" }
  ],
  [
    { name: "Hồ Hoàn Kiếm sương mờ sáng sớm Hà Nội", time: 2, thumb: "https://images.unsplash.com/photo-1509060464153-4466739f7f40?w=200&fit=crop" },
    { name: "Cầu Thê Húc đỏ rực đón nắng ban mai", time: 12, thumb: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200&fit=crop" },
    { name: "Thưởng thức Cà phê trứng trứ danh Giảng", time: 28, thumb: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&fit=crop" }
  ],
  [
    { name: "Đỉnh đèo Hải Vân mây phủ hùng vĩ", time: 5, thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&fit=crop" },
    { name: "Làng chài Lăng Cô thanh bình yên ả", time: 16, thumb: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&fit=crop" },
    { name: "Bãi biển Mỹ Khê Đà Nẵng cát trắng mịn", time: 32, thumb: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&fit=crop" }
  ]
];

// Mock database for premium hotels near the video location
const MOCK_HOTELS_TEMPLATES = [
  [
    {
      name: "Four Seasons Resort The Nam Hai",
      rating: 4.9,
      reviews: 1420,
      price: "15.500.000đ",
      address: "Khối Hà My Đông B, Điện Bàn, Hội An, Việt Nam",
      phone: "+84 235 394 0000",
      website: "https://www.fourseasons.com/hoian",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&fit=crop"
    },
    {
      name: "La Siesta Hoi An Resort & Spa",
      rating: 4.8,
      reviews: 980,
      price: "2.800.000đ",
      address: "132 Hùng Vương, Thanh Hà, Hội An, Việt Nam",
      phone: "+84 235 391 5915",
      website: "https://www.lasiestahotels.com",
      image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&fit=crop"
    }
  ],
  [
    {
      name: "Vinpearl Resort & Spa Ha Long",
      rating: 4.7,
      reviews: 2150,
      price: "3.400.000đ",
      address: "Đảo Rều, Bãi Cháy, Hạ Long, Việt Nam",
      phone: "+84 203 355 6868",
      website: "https://www.vinpearl.com/vi/resort-spa-ha-long",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&fit=crop"
    },
    {
      name: "Paradise Suites Hotel Tuần Châu",
      rating: 4.6,
      reviews: 870,
      price: "1.950.000đ",
      address: "Đảo Tuần Châu, Hạ Long, Việt Nam",
      phone: "+84 203 318 0808",
      website: "https://www.paradisevietnam.com",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&fit=crop"
    }
  ],
  [
    {
      name: "Capella Hanoi (Siêu Khách Sạn Nghệ Thuật)",
      rating: 4.9,
      reviews: 450,
      price: "9.800.000đ",
      address: "11 Lê Phụng Hiểu, Tràng Tiền, Hoàn Kiếm, Hà Nội",
      phone: "+84 24 3987 8888",
      website: "https://www.capellahotels.com/hanoi",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&fit=crop"
    },
    {
      name: "Sofitel Legend Metropole Hanoi",
      rating: 4.8,
      reviews: 3200,
      price: "6.200.000đ",
      address: "15 Ngô Quyền, Hoàn Kiếm, Hà Nội, Việt Nam",
      phone: "+84 24 3826 6919",
      website: "https://www.sofitel-legend-metropole-hanoi.com",
      image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&fit=crop"
    }
  ]
];

// Helper to extract uploader name from filename
function extractUploaderName(fileName) {
  const parts = fileName.split('__');
  if (parts.length < 2) return 'Người dùng ẩn danh';
  try {
    const decoded = decodeURIComponent(parts[0]);
    return decoded || 'Người dùng ẩn danh';
  } catch (_) {
    return 'Người dùng ẩn danh';
  }
}

// Fetch videos from Supabase storage or database tables
async function fetchVideosFromSupabase() {
  try {
    // Attempt querying the Supabase Database vlog_videos table
    const { data: dbVideos, error } = await supabase
      .from('vlog_videos')
      .select('*, vlog_users (avatar_url)')
      .order('created_at', { ascending: false });

    if (!error && dbVideos && dbVideos.length > 0) {
      console.log("Loaded videos from Supabase database tables successfully.");
      return dbVideos.map((video, index) => {
        const spotTemplate = video.spots || MOCK_SPOTS_TEMPLATES[index % MOCK_SPOTS_TEMPLATES.length];
        const hotelTemplate = video.hotels || MOCK_HOTELS_TEMPLATES[index % MOCK_HOTELS_TEMPLATES.length];

        return {
          id: video.id,
          url: video.url,
          hls_url: video.hls_url,
          uploaderName: video.uploader_name || 'Người dùng ẩn danh',
          title: video.title || `Vlog ngắn được đăng tải bởi ${video.uploader_name || 'thành viên'}`,
          description: video.description || `Khám phá hành trình cùng with ${video.uploader_name || 'thành viên'}.`,
          isSystem: video.is_system || false,
          likes: video.likes || 0,
          views: video.views || 0,
          spots: spotTemplate,
          hotels: hotelTemplate,
          avatar: video.vlog_users?.avatar_url || null
        };
      });
    }

    if (error) {
      console.warn("Could not load from DB tables (perhaps schema not applied yet?):", error.message);
    }
  } catch (dbError) {
    console.warn("DB fetch exception:", dbError);
  }

  // FALLBACK: Original storage listing behavior
  console.log("Falling back to listing files from Supabase storage bucket...");
  const listUrl = `${SUPABASE_URL}/storage/v1/object/list/videos`;
  try {
    const response = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: '',
        limit: 100,
        offset: 0,
        sortBy: {
          column: 'name',
          order: 'desc' // Newest uploads first
        }
      })
    });

    if (response.ok) {
      const files = await response.json();
      // Map to video objects
      return files
        .filter(file => file.name.includes('.')) // skip folders if any
        .map((file, index) => {
          const uploader = extractUploaderName(file.name);
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${encodeURIComponent(file.name)}`;

          // Pick a mock template deterministically
          const spotTemplate = MOCK_SPOTS_TEMPLATES[index % MOCK_SPOTS_TEMPLATES.length];
          const hotelTemplate = MOCK_HOTELS_TEMPLATES[index % MOCK_HOTELS_TEMPLATES.length];

          return {
            id: file.id || index,
            url: publicUrl,
            uploaderName: uploader,
            title: `Vlog ngắn được đăng tải bởi ${uploader}`,
            description: `Khám phá cuộc hành trình thú vị và những địa điểm đặc sắc tuyệt vời cùng với ${uploader}. Video được lưu trữ an toàn trên nền tảng đám mây Supabase.`,
            likes: Math.floor(Math.random() * 8000) + 1999,
            views: Math.floor(Math.random() * 50000) + 12000,
            isSystem: false, // Fallback storage files are user videos
            spots: spotTemplate,
            hotels: hotelTemplate
          };
        });
    } else {
      console.error('Failed to list storage files:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching videos from Supabase:', error);
    return [];
  }
}

// Render the entire Vlog UI in the DOM
export async function initVlog() {
  const app = document.querySelector('#app');
  if (!app) return;

  // Insert base layout
  app.innerHTML = `
    <div class="vlog-root">
      <div class="vlog-container">
        <!-- GLASS AUTO PLAY NEXT SWITCH -->
        <div class="vlog-autoplay-switch-container">
          <span class="vlog-autoplay-label">Tự Chuyển</span>
          <label class="vlog-glass-switch">
            <input type="checkbox" id="vlogAutoPlayNextToggle" checked>
            <span class="vlog-glass-slider"></span>
          </label>
        </div>

        <!-- MAIN VERTICAL SNAP STREAM -->
        <div class="vlog-feed" id="vlogFeed">
          <div style="padding: 100px 20px; text-align: center; color: var(--vlog-accent);" id="vlogLoading">
            <h2 style="font-weight: 700;">Đang tải Vlog Chill Feed...</h2>
            <p style="color: var(--vlog-text-secondary); margin-top: 8px;">Đang thiết lập kết nối đám mây bảo mật</p>
          </div>
        </div>

        <!-- TIMED PROGRESS HUD FOR ACTIVE VIDEO -->
        <div class="vlog-progress-hud" id="vlogProgressHud"></div>

        <!-- TOAST MESSAGE BANNER -->
        <div class="vlog-toast" id="vlogToast"></div>

        <!-- BOTTOM SHEET BACKDROP overlay -->
        <div class="vlog-sheet-backdrop" id="vlogSheetBackdrop"></div>

        <!-- SPOTS TRAVEL BOTTOM SHEET -->
        <div class="vlog-sheet" id="vlogSpotsSheet">
          <div class="vlog-sheet-handle-bar" id="closeSpotsBar">
            <div class="vlog-sheet-handle"></div>
          </div>
          <div class="vlog-sheet-header">
            <h3 class="vlog-sheet-title">📍 Vị Trí Trong Vlog</h3>
            <button class="vlog-sheet-close" id="closeSpotsBtn">×</button>
          </div>
          <div class="vlog-sheet-content" id="vlogSpotsContent">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- HOTELS BOTTOM SHEET -->
        <div class="vlog-sheet" id="vlogHotelsSheet">
          <div class="vlog-sheet-handle-bar" id="closeHotelsBar">
            <div class="vlog-sheet-handle"></div>
          </div>
          <div class="vlog-sheet-header">
            <h3 class="vlog-sheet-title">🏨 Chỗ Ở Gần Video</h3>
            <button class="vlog-sheet-close" id="closeHotelsBtn">×</button>
          </div>
          <div class="vlog-sheet-content" id="vlogHotelsContent">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- DESCRIPTION BOTTOM SHEET -->
        <div class="vlog-sheet" id="vlogDescSheet">
          <div class="vlog-sheet-handle-bar" id="closeDescBar">
            <div class="vlog-sheet-handle"></div>
          </div>
          <div class="vlog-sheet-header">
            <h3 class="vlog-sheet-title">📝 Mô Tả Chi Tiết</h3>
            <button class="vlog-sheet-close" id="closeDescBtn">×</button>
          </div>
          <div class="vlog-sheet-content" id="vlogDescContent" style="color: var(--vlog-text-secondary); line-height: 1.6; font-size: 14px;">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- UPLOAD MODAL -->
        <div class="vlog-modal" id="vlogUploadModal" style="max-height: 85vh; overflow-y: auto; scrollbar-width: thin;">
          <div class="vlog-modal-header">
            <h3 class="vlog-modal-title">📤 THÊM VLOG CỦA BẠN</h3>
            <button class="vlog-sheet-close" id="closeUploadModalBtn">×</button>
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Tên của bạn (Nickname)</label>
            <input type="text" id="vlogUploaderInput" class="vlog-form-input" placeholder="Ví dụ: Quốc Đẹp Trai" value="${localStorage.getItem('vlog_device_nickname') || 'Quốc Khách'}" />
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Tiêu Đề Vlog</label>
            <input type="text" id="vlogTitleInput" class="vlog-form-input" placeholder="Ví dụ: Khám phá Vịnh Hạ Long" value="" />
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Mô Tả Chi Tiết</label>
            <textarea id="vlogDescInput" class="vlog-form-input" placeholder="Ví dụ: Cảnh sắc thiên nhiên hùng vĩ..." rows="2" style="font-family: inherit; resize: none;"></textarea>
          </div>
          <div class="vlog-form-group" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
            <label class="vlog-form-label" style="margin-bottom: 0;">Loại Video (System Ads)</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; color: var(--vlog-text-secondary);">Thành viên</span>
              <label class="vlog-switch">
                <input type="checkbox" id="vlogIsSystemInput">
                <span class="vlog-slider"></span>
              </label>
              <span style="font-size: 11px; color: var(--vlog-accent);">Quảng cáo</span>
            </div>
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Chọn File Video (MP4, MOV, WEBM)</label>
            <div class="vlog-file-zone" id="vlogFileZone">
              <div class="vlog-file-icon">📁</div>
              <div style="font-weight: 600; font-size: 13px;">Chọn video từ thiết bị của bạn</div>
              <div style="font-size: 11px; color: var(--vlog-text-secondary); margin-top: 4px;">Dung lượng tối đa giới hạn: 10MB</div>
              <div class="vlog-file-name" id="vlogFileNameDisplay">Chưa chọn file</div>
            </div>
            <input type="file" id="vlogFileInput" accept="video/mp4,video/quicktime,video/webm" style="display: none;" />
          </div>
          
          <!-- Live upload progress tracker -->
          <div class="vlog-upload-progress-container" id="vlogUploadProgressContainer">
            <div class="vlog-progress-bar-bg">
              <div class="vlog-progress-bar-fill" id="vlogProgressBarFill"></div>
            </div>
            <div class="vlog-progress-text">
              <span id="vlogProgressPercent">0%</span>
              <span id="vlogProgressStatus">Đang gửi gói tin...</span>
            </div>
          </div>

          <div class="vlog-modal-actions">
            <button class="vlog-btn-cancel" id="cancelUploadBtn">Hủy Bỏ</button>
            <button class="vlog-btn-confirm" id="confirmUploadBtn" disabled>Tải Lên Đám Mây</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Top navigation bindings removed

  await fetchVlogConfig();

  // Load and populate vlog slides
  videoList = await fetchVideosFromSupabase();

  // Shuffle video list for randomness
  for (let i = videoList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [videoList[i], videoList[j]] = [videoList[j], videoList[i]];
  }

  renderVlogSlides();
  updateVideoSources(0);

  // Setup auto play next toggle
  const autoPlayToggle = document.querySelector('#vlogAutoPlayNextToggle');
  if (autoPlayToggle) {
    autoPlayToggle.checked = autoPlayNext;
    autoPlayToggle.addEventListener('change', (e) => {
      autoPlayNext = e.target.checked;
      showVlogToast(autoPlayNext ? "⚡ Đã BẬT tự động chuyển video" : "⏸️ Đã TẮT tự động chuyển video");
    });
  }

  // Setup sheet actions
  setupSheetHandlers();
  setupUploadHandlers();

  // Setup 7 seconds auto hide overlay controls
  setupAutoHideControls();

  // Setup Zalo Mini App iframe touch autoplay unlocker
  setupAutoplayUnlocker();
}

// Toast notification helper
function showVlogToast(msg) {
  const toast = document.querySelector('#vlogToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

// Render slides inside vertical container
function renderVlogSlides() {
  const feed = document.querySelector('#vlogFeed');
  if (!feed) return;

  if (videoList.length === 0) {
    feed.innerHTML = `
      <div style="padding: 150px 20px; text-align: center; color: #fff;">
        <h3 style="font-weight: 700; color: var(--vlog-pink);">Không tìm thấy Vlog nào!</h3>
        ${vlogConfig.can_upload_vlog ? `
        <p style="color: var(--vlog-text-secondary); margin-top: 8px; font-size: 13px;">Hãy nhấp vào nút "Thêm Video" bên dưới để tải lên vlog đầu tiên của bạn lên Supabase!</p>
        <button class="vlog-back-btn" id="vlogEmptyUploadBtn" style="margin: 20px auto 0 auto; display: inline-flex;">
          📤 Tải Lên Ngay
        </button>
        ` : ''}
      </div>
    `;
    if (vlogConfig.can_upload_vlog) {
      const emptyBtn = document.querySelector('#vlogEmptyUploadBtn');
      if (emptyBtn) {
        emptyBtn.addEventListener('click', () => {
          openVlogModal('#vlogUploadModal');
        });
      }
    }
    return;
  }

  feed.innerHTML = '';

  videoList.forEach((video, index) => {
    const slide = document.createElement('div');
    slide.className = 'vlog-slide';
    slide.dataset.index = index;

    slide.innerHTML = `
      <div class="vlog-video-wrapper">
        <!-- Primary Video tag (muted playsinline for webview compatibility) -->
        <video class="vlog-video" style="transform: translateZ(0); will-change: transform;" preload="metadata" muted playsinline webkit-playsinline></video>

        <!-- Tap-to-toggle overlay detector -->
        <div class="vlog-play-pause-center-btn" data-video-index="${index}"></div>

        <!-- Floating scroll indicator guide for the first video only -->
        ${index === 0 ? `
        <div class="vlog-scroll-hint">
          <span class="vlog-scroll-hint-text">Cuộn Lên Xem Thêm</span>
          <span class="vlog-scroll-hint-icon">👇</span>
        </div>
        ` : ''}

        <!-- Center big pulse play/pause icon overlay indicator -->
        <div class="vlog-play-indicator" id="vlogPlayIndicator_${index}">▶</div>

        <!-- BOTTOM LEFT INFORMATION PANEL OVERLAY -->
        <div class="vlog-info-overlay">
          <div class="vlog-uploader-card">
            <div class="vlog-avatar" style="display: flex; align-items: center; justify-content: center; background: ${video.avatar ? 'none' : 'linear-gradient(135deg, var(--vlog-accent), var(--vlog-pink))'}; font-size: 18px; font-weight: 800; color: #000; overflow: hidden; border: 1px solid rgba(255,255,255,0.15);">
              ${video.avatar ? `<img src="${video.avatar}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.textContent='${video.uploaderName.charAt(0).toUpperCase()}'" />` : video.uploaderName.charAt(0).toUpperCase()}
            </div>
            <span class="vlog-username">@${video.uploaderName}</span>
            ${vlogConfig.show_member_badge ? (video.isSystem ? `
              <span class="vlog-badge vlog-badge-system">📢 Quảng Cáo</span>
            ` : `
              <span class="vlog-badge vlog-badge-user">👤 Thành Viên</span>
            `) : ''}
          </div>
          <h4 class="vlog-video-title">${video.title}</h4>
          <p class="vlog-video-desc">${video.description}</p>
        </div>

        <!-- BOTTOM RIGHT ACTION BUTTONS PANEL OVERLAY -->
        <div class="vlog-sidebar-overlay">
          <!-- Mute/Unmute Dynamic Button -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionSoundBtn_${index}">
              ${isMuted ? '🔇' : `
                <div class="vlog-soundwave">
                  <div class="vlog-soundwave-bar"></div>
                  <div class="vlog-soundwave-bar"></div>
                  <div class="vlog-soundwave-bar"></div>
                  <div class="vlog-soundwave-bar"></div>
                </div>
              `}
            </button>
            <span class="vlog-sidebar-btn-label">Âm Thanh</span>
          </div>
        </div>
      </div>
    `;

    feed.appendChild(slide);

    // Setup action listeners for this slide
    document.querySelector(`#actionSoundBtn_${index}`).addEventListener('click', toggleGlobalMute);

    // Central play pause tap click
    const tapDetector = slide.querySelector('.vlog-play-pause-center-btn');
    const videoEl = slide.querySelector('.vlog-video');
    tapDetector.addEventListener('click', () => {
      togglePlayPause(videoEl, index);
    });

    // Auto scroll next on end
    videoEl.addEventListener('ended', () => {
      if (autoPlayNext) {
        const nextSlide = slide.nextElementSibling;
        if (nextSlide && nextSlide.classList.contains('vlog-slide')) {
          nextSlide.scrollIntoView({ behavior: 'smooth' });
          showVlogToast("⚡ Tự động chuyển sang video tiếp theo...");
        } else {
          // If no next slide, loop manually
          videoEl.play().catch(e => { });
        }
      } else {
        // Loop manually if auto play next is off
        videoEl.play().catch(e => { });
      }
    });

    // Progress bar updater
    videoEl.addEventListener('timeupdate', () => {
      if (index === activeVideoIndex) {
        const pct = (videoEl.currentTime / videoEl.duration) * 100 || 0;
        const progressHud = document.querySelector('#vlogProgressHud');
        if (progressHud) progressHud.style.width = `${pct}%`;
      }
    });

    // WebView buffering: Force play active video when metadata loads
    const forcePlayActive = () => {
      if (index === activeVideoIndex) {
        videoEl.muted = isMuted;
        videoEl.play().catch(e => {
          console.log("Early autoplay blocked, waiting for user gesture.", e);
        });
      }
    };
    videoEl.addEventListener('loadedmetadata', forcePlayActive);
    videoEl.addEventListener('canplay', forcePlayActive);
  });

  // Setup observer to play active videos and pause inactive
  setupIntersectionObserver();
}

// Format numbers nicely (e.g. 15.2K)
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
}

// Handle dynamic video pause/play on vertical snap scroll
let observer = null;
function setupIntersectionObserver() {
  if (observer) observer.disconnect();

  const options = {
    root: document.querySelector('#vlogFeed'),
    threshold: 0.6
  };

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const slideIndex = parseInt(entry.target.dataset.index);
      const video = entry.target.querySelector('.vlog-video');

      if (!video) return;

      if (entry.isIntersecting) {
        activeVideoIndex = slideIndex;

        // Explicitly pause all other videos to prevent background audio leaks
        document.querySelectorAll('.vlog-video').forEach((v, idx) => {
          if (idx !== activeVideoIndex) {
            try {
              v.pause();
              v.currentTime = 0;
            } catch (e) { }
          }
        });

        // Apply sliding window updates immediately
        updateVideoSources(activeVideoIndex);

        // Mute or unmute correctly according to global status
        video.muted = isMuted;

        // Reset progress bar
        document.querySelector('#vlogProgressHud').style.width = '0%';

        // Play the active video
        video.play().then(() => {
          // Remove scroll guides if swiped past the first video
          if (slideIndex > 0) {
            const hint = document.querySelector('.vlog-scroll-hint');
            if (hint) hint.remove();
          }
        }).catch(err => {
          // Only fallback to muted play if this is still the active video and not an AbortError from pausing
          if (err.name !== 'AbortError' && activeVideoIndex === slideIndex) {
            console.warn("Autoplay blocked by browser. Fallback to muted: ", err);
            video.muted = true;
            video.play().catch(e => console.error("Video fail to play entirely:", e));
          }
        });
      } else {
        // Pause and reset all non-intersecting videos safely
        try {
          video.pause();
          video.currentTime = 0;
        } catch (_) { }
      }
    });
  }, options);

  document.querySelectorAll('.vlog-slide').forEach(slide => {
    observer.observe(slide);
  });
}

// Toggle Play/Pause on single click
function togglePlayPause(video, index) {
  const indicator = document.querySelector(`#vlogPlayIndicator_${index}`);
  if (!indicator) return;

  // Trigger pulse animation
  indicator.classList.remove('trigger');
  void indicator.offsetWidth; // force reflow/repaint
  indicator.classList.add('trigger');

  if (video.paused) {
    video.play();
    indicator.textContent = '▶';
  } else {
    video.pause();
    indicator.textContent = '❚❚';
  }
}

// Unmute / Mute global controller
function toggleGlobalMute() {
  isMuted = !isMuted;

  // Apply to all videos
  document.querySelectorAll('.vlog-video').forEach((v, index) => {
    v.muted = isMuted;

    // Update volume icon on all buttons
    const btn = document.querySelector(`#actionSoundBtn_${index}`);
    if (btn) {
      if (isMuted) {
        btn.innerHTML = '🔇';
      } else {
        btn.innerHTML = `
          <div class="vlog-soundwave">
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
          </div>
        `;
      }
    }
  });

  if (isMuted) {
    showVlogToast("🔇 Đã tắt tiếng.");
  } else {
    showVlogToast("🔊 Đã bật âm thanh.");
  }
}

// Setup Slide Up Sheet Actions
function setupSheetHandlers() {
  const backdrop = document.querySelector('#vlogSheetBackdrop');

  const closeSheets = () => {
    document.querySelectorAll('.vlog-sheet').forEach(sheet => {
      sheet.classList.remove('active');
    });
    backdrop.classList.remove('active');
  };

  backdrop.addEventListener('click', closeSheets);

  // Close buttons bindings
  ['Spots', 'Hotels', 'Desc'].forEach(name => {
    document.querySelector(`#close${name}Btn`).addEventListener('click', closeSheets);
    document.querySelector(`#close${name}Bar`).addEventListener('click', closeSheets);
  });
}

// Populate Spots List and make them seekable!
function populateSpotsSheet(video) {
  const container = document.querySelector('#vlogSpotsContent');
  if (!container) return;

  if (!video.spots || video.spots.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--vlog-text-secondary); padding: 40px 0;">Không có thông tin vị trí cho vlog này.</div>`;
    return;
  }

  container.innerHTML = '';
  video.spots.forEach(spot => {
    const item = document.createElement('div');
    item.className = 'vlog-spot-item';

    // Format timestamp nicely
    const minutes = Math.floor(spot.time / 60).toString().padStart(2, '0');
    const seconds = (spot.time % 60).toString().padStart(2, '0');

    item.innerHTML = `
      <img src="${spot.thumb}" class="vlog-spot-thumb" alt="${spot.name}" />
      <div class="vlog-spot-details">
        <div class="vlog-spot-name">${spot.name}</div>
        <div class="vlog-spot-time">⏱️ Nhảy đến phân cảnh (${minutes}:${seconds})</div>
      </div>
    `;

    // Seeking active video directly on click!
    item.addEventListener('click', () => {
      const activeVideo = document.querySelectorAll('.vlog-video')[activeVideoIndex];
      if (activeVideo) {
        activeVideo.currentTime = spot.time;
        activeVideo.play();
        showVlogToast(`📍 Đã nhảy tới: ${spot.name}`);

        // Highlight active spot item
        document.querySelectorAll('.vlog-spot-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      }
    });

    container.appendChild(item);
  });
}

// Populate Hotels List Bottom Sheet
function populateHotelsSheet(video) {
  const container = document.querySelector('#vlogHotelsContent');
  if (!container) return;

  if (!video.hotels || video.hotels.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--vlog-text-secondary); padding: 40px 0;">Không tìm thấy khách sạn lân cận.</div>`;
    return;
  }

  container.innerHTML = '';
  video.hotels.forEach(hotel => {
    const card = document.createElement('div');
    card.className = 'vlog-hotel-card';

    card.innerHTML = `
      <img src="${hotel.image}" class="vlog-hotel-image" alt="${hotel.name}" />
      <h4 class="vlog-hotel-title">${hotel.name}</h4>
      <div class="vlog-hotel-meta">
        <span class="vlog-hotel-rating">⭐ ${hotel.rating} (${hotel.reviews} đánh giá)</span>
        <span class="vlog-hotel-price">💰 ${hotel.price}/đêm</span>
      </div>
      <p class="vlog-hotel-address">📍 ${hotel.address}</p>
      <div class="vlog-hotel-actions">
        <a href="${hotel.website}" target="_blank" class="vlog-hotel-btn vlog-hotel-btn-primary">
          🔗 Truy Cập Website
        </a>
        <button class="vlog-hotel-btn vlog-hotel-btn-secondary" onclick="alert('📞 Gọi trực tiếp tới quầy lễ tân: ${hotel.phone}')">
          📞 Gọi Lễ Tân
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Helper to open sheet
function openVlogSheet(selector) {
  document.querySelectorAll('.vlog-sheet').forEach(sheet => {
    sheet.classList.remove('active');
  });
  document.querySelector(selector).classList.add('active');
  document.querySelector('#vlogSheetBackdrop').classList.add('active');
}

// Modal dialog opener
function openVlogModal(selector) {
  document.querySelector(selector).classList.add('active');
  document.querySelector('#vlogSheetBackdrop').classList.add('active');
}

function closeVlogModal(selector) {
  document.querySelector(selector).classList.remove('active');
  document.querySelector('#vlogSheetBackdrop').classList.remove('active');
}

// Helper to get Zalo nickname or local nickname
function getUploaderNickname() {
  const urlParams = new URLSearchParams(window.location.search);
  const zaloUsername = urlParams.get('zalo_username') || urlParams.get('username') || urlParams.get('name') || localStorage.getItem('vlog_zalo_username');
  if (zaloUsername) {
    return zaloUsername;
  }
  return localStorage.getItem('vlog_device_nickname') || '';
}

// Helper to get or create a persistent unique User ID for this browser device
function getOrCreateDeviceUserId() {
  const urlParams = new URLSearchParams(window.location.search);
  const zaloUid = urlParams.get('zalo_user_id') || urlParams.get('zalo_uid') || urlParams.get('uid') || localStorage.getItem('vlog_zalo_uid');
  if (zaloUid) {
    return 'zalo_' + zaloUid;
  }

  let deviceUserId = localStorage.getItem('vlog_device_user_id');
  if (!deviceUserId) {
    deviceUserId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('vlog_device_user_id', deviceUserId);
  }
  return deviceUserId;
}

// Helper to remove Vietnamese tones and non-ASCII characters for storage key safety
function removeVietnameseTones(str) {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Bả|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  str = str.replace(/[^a-zA-Z0-9]/g, "_");
  return str;
}

// Setup Upload Flow
function setupUploadHandlers() {
  const fileZone = document.querySelector('#vlogFileZone');
  const fileInput = document.querySelector('#vlogFileInput');
  const fileNameDisplay = document.querySelector('#vlogFileNameDisplay');
  const uploaderInput = document.querySelector('#vlogUploaderInput');
  const confirmBtn = document.querySelector('#confirmUploadBtn');
  const cancelBtn = document.querySelector('#cancelUploadBtn');
  const closeBtn = document.querySelector('#closeUploadModalBtn');
  const progressContainer = document.querySelector('#vlogUploadProgressContainer');
  const progressBarFill = document.querySelector('#vlogProgressBarFill');
  const progressPercent = document.querySelector('#vlogProgressPercent');
  const progressStatus = document.querySelector('#vlogProgressStatus');

  let selectedFile = null;

  const defaultNickname = getUploaderNickname();
  if (defaultNickname) {
    uploaderInput.value = defaultNickname;
    const urlParams = new URLSearchParams(window.location.search);
    const isZaloUser = !!(urlParams.get('zalo_username') || urlParams.get('username') || urlParams.get('name') || localStorage.getItem('vlog_zalo_username'));
    if (isZaloUser) {
      uploaderInput.readOnly = true;
      uploaderInput.style.opacity = '0.7';
      uploaderInput.style.cursor = 'not-allowed';
      uploaderInput.title = 'Tên tài khoản Zalo Mini App được khóa tự động';
    }
  }

  fileZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit

      if (file.size > maxSizeBytes) {
        showVlogToast("❌ Video quá lớn! Vui lòng chọn file dưới 10MB.");
        fileInput.value = '';
        selectedFile = null;
        fileNameDisplay.textContent = 'Chưa chọn file (File vượt quá 10MB)';
        confirmBtn.disabled = true;
        return;
      }

      selectedFile = file;
      fileNameDisplay.textContent = `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
      confirmBtn.disabled = false;
    }
  });

  const resetForm = () => {
    selectedFile = null;
    fileInput.value = '';
    fileNameDisplay.textContent = 'Chưa chọn file';
    document.querySelector('#vlogTitleInput').value = '';
    document.querySelector('#vlogDescInput').value = '';
    document.querySelector('#vlogIsSystemInput').checked = false;
    confirmBtn.disabled = true;
    progressContainer.style.display = 'none';
    progressBarFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressStatus.textContent = 'Đang gửi gói tin...';
  };

  const closeModal = () => {
    closeVlogModal('#vlogUploadModal');
    resetForm();
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  // XML HTTP REQUEST upload with REAL live progress bar!
  confirmBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const nickname = uploaderInput.value.trim() || 'Người dùng ẩn danh';
    const titleVal = document.querySelector('#vlogTitleInput').value.trim() || `Vlog ngắn tải lên bởi ${nickname}`;
    const descVal = document.querySelector('#vlogDescInput').value.trim() || `Khám phá cuộc hành trình thú vị và những địa điểm đặc sắc tuyệt vời cùng với ${nickname}. Tải lên thành công từ thiết bị khách!`;
    const isSystemVal = document.querySelector('#vlogIsSystemInput').checked;

    // A. SPAM PREVENTION: Client-side cool-down of 2 minutes
    const COOLDOWN_MS = 2 * 60 * 1000;
    const lastUploadTime = localStorage.getItem('last_vlog_upload_time');
    if (lastUploadTime) {
      const elapsed = Date.now() - parseInt(lastUploadTime);
      if (elapsed < COOLDOWN_MS) {
        const secondsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        showVlogToast(`❌ Vui lòng đợi ${secondsLeft} giây trước khi tải lên video tiếp theo.`);
        return;
      }
    }

    // B. AUTHENTICATION & NICKNAME OWNERSHIP PROTECTION
    const deviceUserId = getOrCreateDeviceUserId();

    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressStatus.textContent = 'Đang xác thực bảo mật...';

    try {
      // Query if this nickname is already claimed by another User ID in DB
      const { data: existingUser, error: authErr } = await supabase
        .from('vlog_users')
        .select('id')
        .eq('nickname', nickname)
        .maybeSingle();

      if (authErr) console.warn("Auth check error:", authErr.message);

      if (existingUser && existingUser.id !== deviceUserId) {
        progressContainer.style.display = 'none';
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        showVlogToast("❌ Tên này đã được sở hữu bởi thiết bị khác! Vui lòng chọn tên khác.");
        return;
      }
    } catch (e) {
      console.warn("Spam verification unexpected error:", e);
    }

    progressStatus.textContent = 'Đang chuẩn bị gói tin...';

    const ext = selectedFile.name.split('.').pop() || 'mp4';
    const timestamp = Date.now();
    const cleanNickname = removeVietnameseTones(nickname);

    // Exact file name formatting as requested
    const fileName = `${cleanNickname}__${deviceUserId}__video_${timestamp}.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/videos/${fileName}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    // Set headers
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader('Content-Type', selectedFile.type || 'video/mp4');
    xhr.setRequestHeader('x-upsert', 'false');

    // Track live progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressBarFill.style.width = `${pct}%`;
        progressPercent.textContent = `${pct}%`;
        if (pct < 100) {
          progressStatus.textContent = `Đang truyền tải dữ liệu (${(e.loaded / (1024 * 1024)).toFixed(1)}MB / ${(e.total / (1024 * 1024)).toFixed(1)}MB)...`;
        } else {
          progressStatus.textContent = 'Hoàn tất truyền dữ liệu, đang đồng bộ hóa...';
        }
      }
    });

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${encodeURIComponent(fileName)}`;

        // Save metadata on local device to remember nickname and timestamp
        localStorage.setItem('vlog_device_nickname', nickname);
        localStorage.setItem('last_vlog_upload_time', Date.now().toString());

        // Attempt to insert into database
        let newVideo = null;
        try {
          // 1. Upsert user first with Zalo avatar if present
          const currentAvatar = zaloAvatar || localStorage.getItem('vlog_zalo_avatar');
          const { error: userError } = await supabase
            .from('vlog_users')
            .upsert([{
              id: deviceUserId,
              nickname: nickname,
              avatar_url: currentAvatar || null
            }]);

          if (userError) console.warn("User upsert warning:", userError.message);

          // 2. Insert video
          const { data: dbVideo, error: videoError } = await supabase
            .from('vlog_videos')
            .insert([{
              user_id: deviceUserId,
              uploader_name: nickname,
              url: publicUrl,
              title: titleVal,
              description: descVal,
              is_system: isSystemVal,
              likes: 999,
              views: 1200,
              spots: MOCK_SPOTS_TEMPLATES[0],
              hotels: MOCK_HOTELS_TEMPLATES[0]
            }])
            .select();

          if (!videoError && dbVideo && dbVideo.length > 0) {
            console.log("Uploaded video saved to Supabase DB successfully.");
            newVideo = {
              id: dbVideo[0].id,
              url: dbVideo[0].url,
              hls_url: dbVideo[0].hls_url,
              uploaderName: dbVideo[0].uploader_name,
              title: dbVideo[0].title,
              description: dbVideo[0].description,
              isSystem: dbVideo[0].is_system,
              likes: dbVideo[0].likes,
              views: dbVideo[0].views,
              spots: dbVideo[0].spots,
              hotels: dbVideo[0].hotels,
              avatar: currentAvatar || null
            };
          } else {
            if (videoError) console.warn("DB video save fail:", videoError.message);
          }
        } catch (dbErr) {
          console.warn("DB save exception:", dbErr);
        }

        // Fallback if DB save failed or schema not configured yet
        if (!newVideo) {
          console.log("Using in-memory fallback for local render.");
          newVideo = {
            id: 'uploaded_' + timestamp,
            url: publicUrl,
            hls_url: null,
            uploaderName: nickname,
            title: titleVal,
            description: descVal,
            isSystem: isSystemVal,
            likes: 999,
            views: 1200,
            spots: MOCK_SPOTS_TEMPLATES[0],
            hotels: MOCK_HOTELS_TEMPLATES[0],
            avatar: currentAvatar || null
          };
        }

        videoList.unshift(newVideo); // insert at the beginning

        // Re-render feed
        renderVlogSlides();

        // Close modal
        closeModal();

        // Display Success Confetti
        try {
          const confettiCanvas = document.getElementById('confettiCanvas');
          if (confettiCanvas && window.Confetti) {
            window.Confetti.spawn();
          }
        } catch (_) { }

        showVlogToast("✨ TẢI LÊN THÀNH CÔNG! Đang phát vlog của bạn...");

        // Auto scroll to first item (the newly uploaded video)
        setTimeout(() => {
          const firstSlide = document.querySelector('.vlog-slide');
          if (firstSlide) firstSlide.scrollIntoView({ behavior: 'smooth' });
        }, 800);

      } else {
        console.error('Upload fail:', xhr.status, xhr.responseText);
        progressStatus.textContent = `Lỗi tải lên: RLS Policy.`;
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        showVlogToast("❌ Lỗi tải lên: Hãy đảm bảo đúng định dạng video.");
      }
    };

    xhr.onerror = () => {
      console.error('Upload error');
      progressStatus.textContent = 'Lỗi kết nối mạng.';
      confirmBtn.disabled = false;
      cancelBtn.disabled = false;
      showVlogToast("❌ Không thể kết nối với Supabase Cloud.");
    };

    // Send binary video data
    xhr.send(selectedFile);
  });
}

// --- AUTOMATIC 7-SECOND CONTROL AUTO-HIDE FLOW ---
let controlHideTimeout = null;

function showControls() {
  const overlays = document.querySelectorAll('.vlog-sidebar-overlay, .vlog-info-overlay, .vlog-autoplay-switch-container');
  overlays.forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.transition = 'opacity 0.4s ease';
  });

  // Restore cursor on desktop
  const container = document.querySelector('.vlog-container');
  if (container) {
    container.style.cursor = 'default';
  }

  if (controlHideTimeout) {
    clearTimeout(controlHideTimeout);
  }

  controlHideTimeout = setTimeout(hideControls, 7000);
}

function hideControls() {
  // Guard: do not hide if there is any active modal or bottom-sheet
  const activeOverlay = document.querySelector('.vlog-sheet.active, .vlog-modal.active');
  if (activeOverlay) {
    // Check again in 7 seconds
    controlHideTimeout = setTimeout(hideControls, 7000);
    return;
  }

  const overlays = document.querySelectorAll('.vlog-sidebar-overlay, .vlog-info-overlay, .vlog-autoplay-switch-container');
  overlays.forEach(el => {
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });

  // Hide cursor on desktop
  const container = document.querySelector('.vlog-container');
  if (container) {
    container.style.cursor = 'none';
  }
}

function setupAutoHideControls() {
  const container = document.querySelector('.vlog-container');
  if (container) {
    // Show panels on hover/move, touch, or click
    container.addEventListener('mousemove', showControls);
    container.addEventListener('touchstart', showControls);
    container.addEventListener('mousedown', showControls);
  }

  window.addEventListener('keydown', showControls);

  // Trigger initial show and start countdown
  showControls();
}

// --- ZALO MINI APP IFRAME / WEBVIEW AUTOPLAY TOUCH UNLOCKER ---
let autoplayUnlocked = false;

function showAutoplayOverlay() {
  const container = document.querySelector('.vlog-container');
  if (!container) return;

  let overlay = document.querySelector('#vlogAutoplayOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'vlogAutoplayOverlay';
    overlay.className = 'vlog-autoplay-overlay';
    overlay.innerHTML = `
      <div class="vlog-autoplay-card">
        <div class="vlog-autoplay-pulse-ring"></div>
        <div class="vlog-autoplay-icon">
          <span class="vlog-autoplay-emoji">👆</span>
        </div>
        <div class="vlog-autoplay-title">Nhấn Để Mở Khoá Vlog 🔊</div>
        <div class="vlog-autoplay-subtitle">Chạm bất kỳ đâu để xem video với âm thanh</div>
      </div>
    `;
    container.appendChild(overlay);
  } else {
    overlay.classList.remove('hidden');
  }
}

function hideAutoplayOverlay() {
  const overlay = document.querySelector('#vlogAutoplayOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => {
      if (overlay.classList.contains('hidden')) {
        overlay.remove();
      }
    }, 500);
  }
}

function unlockAutoplay() {
  if (autoplayUnlocked) return;

  // Find current active video
  const activeVideo = document.querySelectorAll('.vlog-video')[activeVideoIndex];
  if (activeVideo) {
    // Unmute to let user hear sound
    isMuted = false;
    document.querySelectorAll('.vlog-video').forEach((v, index) => {
      v.muted = isMuted;
      const btn = document.querySelector(`#actionSoundBtn_${index}`);
      if (btn) {
        btn.innerHTML = `
          <div class="vlog-soundwave">
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
            <div class="vlog-soundwave-bar"></div>
          </div>
        `;
      }
    });

    activeVideo.play().then(() => {
      autoplayUnlocked = true;
      console.log("Autoplay unlocked successfully via Zalo/iframe touch gesture!");
      removeUnlockListeners();
      hideAutoplayOverlay();
      showVlogToast("🔊 Đã mở khóa âm thanh & video!");
    }).catch(err => {
      console.warn("Touch unlock attempt blocked, playing muted:", err);
      activeVideo.muted = true;
      activeVideo.play().then(() => {
        autoplayUnlocked = true;
        removeUnlockListeners();
        hideAutoplayOverlay();
      }).catch(e => {
        console.error("Autoplay completely blocked:", e);
      });
    });
  } else {
    autoplayUnlocked = true;
    removeUnlockListeners();
    hideAutoplayOverlay();
  }
}

function removeUnlockListeners() {
  window.removeEventListener('touchstart', unlockAutoplay);
  window.removeEventListener('click', unlockAutoplay);
  window.removeEventListener('touchend', unlockAutoplay);
  window.removeEventListener('pointerdown', unlockAutoplay);
}

function setupAutoplayUnlocker() {
  autoplayUnlocked = false;
  showAutoplayOverlay();
  window.addEventListener('touchstart', unlockAutoplay, { passive: true });
  window.addEventListener('click', unlockAutoplay);
  window.addEventListener('touchend', unlockAutoplay, { passive: true });
  window.addEventListener('pointerdown', unlockAutoplay);
}
