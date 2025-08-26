// Initialize sidebar state
document.addEventListener('DOMContentLoaded', function () {
  // Initialize link prefetching for sidebar links
  initializeLinkPrefetching();

  // Add window resize event listener
  window.addEventListener('resize', function () {
    const sidebar = document.querySelector('.docs-sidebar');
    if (window.innerWidth > 1920 && sidebar && sidebar.classList.contains('collapsed')) {
      sidebar.classList.remove('collapsed');
    }
  });
});

function toggleSidebar() {
  const sidebar = document.querySelector('.docs-sidebar');
  if (sidebar.classList.contains('collapsed')) {
    sidebar.classList.remove('collapsed');
    if (typeof window.clearSelection === 'function') {
      window.clearSelection();
    }
  } else {
    sidebar.classList.add('collapsed');
  }
}

// Expose function to global scope
window.toggleSidebar = toggleSidebar;

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.docs-sidebar');
  const body = document.body;
  body.classList.toggle('sidebar-open');
  sidebar.classList.toggle('visible');
}

window.toggleMobileSidebar = toggleMobileSidebar;

function initializeLinkPrefetching() {
  const prefetchedLinks = new Set();
  let prefetchTimeout;

  // Select all sidebar navigation links
  const sidebarLinks = document.querySelectorAll('.sidebar-link[href], .sidebar-toggle[href]');

  sidebarLinks.forEach(link => {
    link.addEventListener('mouseenter', function () {
      // Clear any existing timeout
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
      }

      // Add a small delay to avoid prefetching on quick mouse movements
      prefetchTimeout = setTimeout(() => {
        const href = this.getAttribute('href');

        // Skip if already prefetched, not a valid URL, or is an anchor link
        if (!href ||
          href.startsWith('#') ||
          href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          prefetchedLinks.has(href)) {
          return;
        }

        // Create prefetch link element
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = href;
        prefetchLink.as = 'document';

        // Add error handling to prevent console errors
        prefetchLink.addEventListener('error', function () {
          // Silently handle prefetch errors
        });

        // Add to head
        document.head.appendChild(prefetchLink);
        prefetchedLinks.add(href);

        // Optional: Remove prefetch link after a delay to keep DOM clean
        setTimeout(() => {
          if (prefetchLink.parentNode) {
            prefetchLink.parentNode.removeChild(prefetchLink);
          }
        }, 60000); // Remove after 60 seconds

      }, 150); // 150ms delay to avoid excessive prefetching
    });

    // Clear timeout on mouse leave to prevent unnecessary prefetching
    link.addEventListener('mouseleave', function () {
      if (prefetchTimeout) {
        clearTimeout(prefetchTimeout);
        prefetchTimeout = null;
      }
    });
  });
}
