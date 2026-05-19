import './style.css';

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