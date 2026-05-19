import './vlog.css';

// Supabase environment configs (safely read from .env in Vite build)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Global state for Vlog Feature
let videoList = [];
let activeVideoIndex = 0;
let isMuted = true; // Autoplay safety first
let autoPlayNext = true;

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

// Fetch videos from Supabase storage using direct public REST API
async function fetchVideosFromSupabase() {
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
        <!-- TOP NAVIGATION BAR REMOVED -->

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
        <div class="vlog-modal" id="vlogUploadModal">
          <div class="vlog-modal-header">
            <h3 class="vlog-modal-title">📤 THÊM VLOG CỦA BẠN</h3>
            <button class="vlog-sheet-close" id="closeUploadModalBtn">×</button>
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Tên của bạn (Nickname)</label>
            <input type="text" id="vlogUploaderInput" class="vlog-form-input" placeholder="Ví dụ: Quốc Đẹp Trai" value="Quốc Khách" />
          </div>
          <div class="vlog-form-group">
            <label class="vlog-form-label">Chọn File Video (MP4, MOV, WEBM)</label>
            <div class="vlog-file-zone" id="vlogFileZone">
              <div class="vlog-file-icon">📁</div>
              <div style="font-weight: 600; font-size: 13px;">Chọn video từ thiết bị của bạn</div>
              <div style="font-size: 11px; color: var(--vlog-text-secondary); margin-top: 4px;">Dung lượng tối đa đề xuất: 25MB</div>
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

  // Load and populate vlog slides
  videoList = await fetchVideosFromSupabase();
  renderVlogSlides();

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
        <p style="color: var(--vlog-text-secondary); margin-top: 8px; font-size: 13px;">Hãy nhấp vào nút "Thêm Video" bên dưới để tải lên vlog đầu tiên của bạn lên Supabase!</p>
        <button class="vlog-back-btn" id="vlogEmptyUploadBtn" style="margin: 20px auto 0 auto; display: inline-flex;">
          📤 Tải Lên Ngay
        </button>
      </div>
    `;
    const emptyBtn = document.querySelector('#vlogEmptyUploadBtn');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => {
        openVlogModal('#vlogUploadModal');
      });
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
        <!-- Primary Video tag (autoplay muted playsinline for webview compatibility) -->
        <video class="vlog-video" autoplay loop muted playsinline webkit-playsinline src="${video.url}"></video>

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
            <div class="vlog-avatar" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--vlog-accent), var(--vlog-pink)); font-size: 18px; font-weight: 800; color: #000;">
              ${video.uploaderName.charAt(0).toUpperCase()}
            </div>
            <span class="vlog-username">@${video.uploaderName}</span>
          </div>
          <h4 class="vlog-video-title">${video.title}</h4>
          <p class="vlog-video-desc">${video.description}</p>
        </div>

        <!-- BOTTOM RIGHT ACTION BUTTONS PANEL OVERLAY -->
        <div class="vlog-sidebar-overlay">
          <!-- Add video upload button -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionUploadBtn_${index}" style="background: linear-gradient(135deg, var(--vlog-accent), var(--vlog-pink)); border: none; color: #000;">
              📤
            </button>
            <span class="vlog-sidebar-btn-label">Thêm</span>
          </div>

          <!-- Likes -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionLikeBtn_${index}">
              ❤️
            </button>
            <span class="vlog-heart-count">${formatNumber(video.likes)}</span>
          </div>

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

          <!-- Spots sheet toggle -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionSpotsBtn_${index}">
              📍
            </button>
            <span class="vlog-sidebar-btn-label">Vị Trí</span>
          </div>

          <!-- Hotels sheet toggle -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionHotelsBtn_${index}">
              🏨
            </button>
            <span class="vlog-sidebar-btn-label">Chỗ Ở</span>
          </div>

          <!-- Detailed description toggle -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionDescBtn_${index}">
              📝
            </button>
            <span class="vlog-sidebar-btn-label">Mô Tả</span>
          </div>

          <!-- Help callback simulation -->
          <div class="vlog-sidebar-group">
            <button class="vlog-sidebar-btn" id="actionHelpBtn_${index}">
              💬
            </button>
            <span class="vlog-sidebar-btn-label">Liên Hệ</span>
          </div>
        </div>
      </div>
    `;

    feed.appendChild(slide);

    // Setup action listeners for this slide
    document.querySelector(`#actionUploadBtn_${index}`).addEventListener('click', () => {
      openVlogModal('#vlogUploadModal');
    });

    const likeBtn = document.querySelector(`#actionLikeBtn_${index}`);
    likeBtn.addEventListener('click', () => {
      likeBtn.classList.toggle('liked');
      if (likeBtn.classList.contains('liked')) {
        likeBtn.style.transform = 'scale(1.3) rotate(-15deg)';
        likeBtn.innerHTML = '💖';
        video.likes++;
        slide.querySelector('.vlog-heart-count').textContent = formatNumber(video.likes);
        showVlogToast("Đã thích Vlog này! Cảm ơn bạn!");
        setTimeout(() => likeBtn.style.transform = '', 300);
      } else {
        likeBtn.innerHTML = '❤️';
        video.likes--;
        slide.querySelector('.vlog-heart-count').textContent = formatNumber(video.likes);
      }
    });

    document.querySelector(`#actionSoundBtn_${index}`).addEventListener('click', toggleGlobalMute);

    document.querySelector(`#actionSpotsBtn_${index}`).addEventListener('click', () => {
      populateSpotsSheet(video);
      openVlogSheet('#vlogSpotsSheet');
    });

    document.querySelector(`#actionHotelsBtn_${index}`).addEventListener('click', () => {
      populateHotelsSheet(video);
      openVlogSheet('#vlogHotelsSheet');
    });

    document.querySelector(`#actionDescBtn_${index}`).addEventListener('click', () => {
      document.querySelector('#vlogDescContent').innerHTML = `
        <h4 style="color: #fff; margin-bottom: 12px; font-weight: 700;">${video.title}</h4>
        <p style="margin-bottom: 20px;">${video.description}</p>
        <div style="display: flex; justify-content: space-between; font-size: 12px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
          <span>👥 Lượt Xem: <strong>${formatNumber(video.views)}</strong></span>
          <span>❤️ Yêu Thích: <strong>${formatNumber(video.likes)}</strong></span>
        </div>
      `;
      openVlogSheet('#vlogDescSheet');
    });

    document.querySelector(`#actionHelpBtn_${index}`).addEventListener('click', () => {
      showVlogToast("📞 Đã gửi yêu cầu liên hệ hỗ trợ tới admin Quốc 67k1!");
    });

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
        }
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
          console.warn("Autoplay blocked by browser. Fallback to muted: ", err);
          video.muted = true;
          video.play().catch(e => console.error("Video fail to play entirely:", e));
        });
      } else {
        // Pause and reset all non-intersecting videos
        video.pause();
        video.currentTime = 0;
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

  fileZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      fileNameDisplay.textContent = `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`;
      confirmBtn.disabled = false;
    }
  });

  const resetForm = () => {
    selectedFile = null;
    fileInput.value = '';
    fileNameDisplay.textContent = 'Chưa chọn file';
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
  confirmBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
    progressContainer.style.display = 'block';

    const nickname = uploaderInput.value.trim() || 'Người dùng ẩn danh';
    const ext = selectedFile.name.split('.').pop() || 'mp4';
    const timestamp = Date.now();
    const encodedUploader = encodeURIComponent(nickname);
    const mockUid = 'guest_' + Math.random().toString(36).substring(2, 9);

    // Exact file name formatting as requested
    const fileName = `${encodedUploader}__${mockUid}__video_${timestamp}.${ext}`;
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

        // Add to active local list
        const newVideo = {
          id: 'uploaded_' + timestamp,
          url: publicUrl,
          uploaderName: nickname,
          title: `Vlog ngắn tải lên bởi ${nickname}`,
          description: `Khám phá cuộc hành trình thú vị và những địa điểm đặc sắc tuyệt vời cùng với ${nickname}. Tải lên thành công từ thiết bị khách!`,
          likes: 999,
          views: 1200,
          spots: MOCK_SPOTS_TEMPLATES[0],
          hotels: MOCK_HOTELS_TEMPLATES[0]
        };

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
  const overlays = document.querySelectorAll('.vlog-sidebar-overlay, .vlog-info-overlay');
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

  const overlays = document.querySelectorAll('.vlog-sidebar-overlay, .vlog-info-overlay');
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

function unlockAutoplay() {
  if (autoplayUnlocked) return;
  
  // Find current active video
  const activeVideo = document.querySelectorAll('.vlog-video')[activeVideoIndex];
  if (activeVideo && activeVideo.paused) {
    activeVideo.muted = isMuted;
    activeVideo.play().then(() => {
      autoplayUnlocked = true;
      console.log("Autoplay unlocked successfully via Zalo/iframe touch gesture!");
      removeUnlockListeners();
    }).catch(err => {
      console.warn("Touch unlock attempt blocked:", err);
    });
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
  window.addEventListener('touchstart', unlockAutoplay, { passive: true });
  window.addEventListener('click', unlockAutoplay);
  window.addEventListener('touchend', unlockAutoplay, { passive: true });
  window.addEventListener('pointerdown', unlockAutoplay);
}
