// Handles lazy initialization and toggling of the visualizations panel
// Expects elements with IDs: toggle-visualizations-btn and visualizations-container
// Dynamically loads d3 (v7), optional custom-select (if not yet loaded), and visualizations.js

document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('toggle-visualizations-btn');
  const container = document.getElementById('visualizations-container');
  let visInitialized = false;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initVisualizations() {
    if (visInitialized) return;
    try {
      if (!window.d3) {
        await loadScript('https://cdn.jsdelivr.net/npm/d3@7');
      }
      if (!window.CustomSelect) {
        try { await loadScript('/assets/js/custom-select.js'); } catch (e) { console.warn('Failed to load custom-select.js', e); }
      }
      await loadScript('/assets/js/visualizations.js');
      if (typeof window.initDeploymentsVis === 'function') {
        try { window.initDeploymentsVis(); } catch (e) { console.error('initDeploymentsVis error', e); }
      }
      visInitialized = true;
    } catch (e) {
      console.error('Failed to initialize visualizations', e);
    }
  }

  function toggleVisualizations() {
    if (!container) return;
    container.classList.toggle('visible');
    if (toggleBtn) {
      toggleBtn.classList.toggle('visible');
    }
    if (container.classList.contains('visible')) {
      initVisualizations();
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleVisualizations);
  }
});
