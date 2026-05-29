import './style.css';

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Không thể đăng ký service worker', err);
    });
  });
}

// Read feature URL param (default is 'retro')
const urlParams = new URLSearchParams(window.location.search);
const feature = urlParams.get('feature') || 'retro';

if (feature === 'vlog') {
  // Load beautiful vertical vlog feature
  import('./vlog.js').then(({ initVlog }) => initVlog());
} else {
  // Load classic retro arcade game engine
  import('./retro.js');
}
