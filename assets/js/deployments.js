/* global MathJax */
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let deploymentsData = [];
let deploymentHints = { short_fields: [], extra_columns: {} };

// Export the initialization function for use by datatable-init.js
export function initializeDeploymentsFeatures(filteredData) {
  // Use pre-filtered data from datatable-init.js (already parsed & status-filtered)
  deploymentsData = (filteredData).map(d => d.deployment);

  // Load deployment hints
  const hintsScript = document.getElementById('deployment-hints');
  if (hintsScript) {
    try {
      deploymentHints = JSON.parse(hintsScript.textContent);

      if (!deploymentHints.short_fields) {
        throw new Error('Missing short_fields in deployment hints');
      }
      if (!deploymentHints.extra_columns) {
        throw new Error('Missing extra_columns in deployment hints');
      }
      if (!deploymentHints.tile_names) {
        throw new Error('Missing tile_names in deployment hints');
      }
    } catch (e) {
      console.warn('Encountered error parsing deployment hints JSON: \n', e);
    }
    // Initialize short field hints after parsing
    initShortFields();
  }

  // Add click handlers to deployment rows (now that DataTable is initialized)
  const deploymentRows = document.querySelectorAll('.deployment-row');
  deploymentRows.forEach(function (row) {
    const rowIndex = parseInt(row.getAttribute('data-index'), 10);

    row.addEventListener('click', function () {
      if (!Number.isNaN(rowIndex)) {
        selectDeploymentRow(rowIndex);
      }
    });

    const descriptionText = row.querySelector('.description-text');
    const showMoreButton = row.querySelector('.show-more-btn');
    if(descriptionText && showMoreButton) {
      showMoreButton.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent row click event
        if (!Number.isNaN(rowIndex)) {
          descriptionText.classList.toggle('truncate');
        }
      });
    }
  });

  // Create modal overlay for mobile
  createModalOverlay();

  // Auto-select deployment if URL has #deployment_anchor
  // Runs only once on load
  (function readAndAutoSelectDeploymentFromURLAnchor() {
    if (window.__selectDeploymentFromAnchorRan) return; // defensive guard
    window.__selectDeploymentFromAnchorRan = true;

    const rawHash = window.location.hash;
    if (!rawHash || rawHash.length <= 1) return;

    const anchor = decodeURIComponent(rawHash.substring(1));

    // Use CSS.escape if available to safely query
    const esc = window.CSS && CSS.escape ? CSS.escape(anchor) : anchor.replace(/"/g, '\\"');

    const targetRow = document.querySelector(`.deployment-row[data-anchor="${esc}"]`);
    if (!targetRow) return;

    const idx = parseInt(targetRow.getAttribute('data-index'), 10);
    if (Number.isNaN(idx)) return;

    // Defer selection slightly to ensure MathJax / layout stable
    requestAnimationFrame(() => {
      selectDeploymentRow(idx);
      try {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        console.error('Failed to scroll into view: ', e);
      }
    });
  })();
}

function createModalOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.addEventListener('click', function () {
    clearSelection();
  });
  document.body.appendChild(overlay);
}

function selectDeploymentRow(index) {
  const sidebar = document.querySelector('.docs-sidebar');
  const sidePanel = document.querySelector('.side-panel');
  const sidePanelContainers = document.querySelectorAll('.side-panel-container');
  const deploymentDetailsDiv = document.getElementById('deployment-details');
  const modalOverlay = document.querySelector('.modal-overlay');

  // Check if the clicked row is already selected
  const selectedRow = document.querySelector(`.deployment-row[data-index="${index}"]`);
  const isAlreadySelected = selectedRow && selectedRow.classList.contains('selected');

  if (isAlreadySelected) {
    // If the same row is clicked again, close the side panel
    clearSelection();
    return;
  }

  // Remove selected class from all rows
  const allRows = document.querySelectorAll('.deployment-row');
  allRows.forEach(function (row) {
    row.classList.remove('selected');
  });

  // Append deployments anchor as hash to current url
  const anchor = selectedRow?.dataset?.anchor;
  if (anchor) {
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = anchor;
    window.history.pushState({}, '', currentUrl);
  }

  // Add selected class to clicked row
  if (selectedRow) {
    selectedRow.classList.add('selected');
  }

  // Get deployment data
  const deployment = deploymentsData[index];
  if (deployment) {
    // Store current deployment index globally for download function
    window.currentDeploymentIndex = index;

    // Collapse sidebar and expand side panel container
    if (sidebar && window.innerWidth < 1920) {
      sidebar.classList.add('collapsed');
    }

    // Expand side panel container and panel
    sidePanelContainers.forEach(container => {
      container.classList.add('expanded');
    });
    if (sidePanel) {
      sidePanel.classList.add('expanded');
    }

    // Show modal overlay [CSS configured to only be visible on mobile UI]
    if (modalOverlay) {
      modalOverlay.classList.add('active');
    }

    const fileName = selectedRow.dataset.fileName;
    // Generate details HTML
    const detailsHTML = generateDeploymentDetailsHTML(deployment, fileName);
    deploymentDetailsDiv.innerHTML = detailsHTML;
  }

  try {
    MathJax.typeset();
  } catch (err) {
    if (!window.__mathjaxTypesetWarned) {
      console.warn('[deployments.js] MathJax typeset failed or MathJax not loaded after selecting deployment.', err);
      window.__mathjaxTypesetWarned = true;
    }
  }

  // Trigger resize to adjust visualizations width
  if (typeof window.triggerResize === 'function') {
    window.triggerResize();
  }
}

// Helper to join JSON Pointer style paths
function joinPath(base, key) {
  if (!base || base === '/') return '/' + key;
  return base + '/' + key;
}

const shortFieldSet = new Set();
function initShortFields() {
  // Rebuild set from current deploymentHints
  shortFieldSet.clear();
  if (deploymentHints?.short_fields) {
    for (const p of deploymentHints.short_fields) {
      shortFieldSet.add(p);
    }
  }
}

function objectToHTML(deploymentObject, currentPath = '/deployment') {
  if (!deploymentObject || typeof deploymentObject !== 'object') return '';
  let html = [];
  for (let [key, value] of Object.entries(deploymentObject)) {
    const path = joinPath(currentPath, key);

    if (path === '/deployment/product/name'
      || path === '/deployment/product/description') {
      continue; // These are all rendered in side-panel header
    }

    if (value === null || value === undefined || value === '') continue;

    // If current JSON pointer path matches any value in extra_columns, use its display name (the map key)
    let label = key.split('_').join(' ');
    if (deploymentHints && deploymentHints.extra_columns) {
      for (const [displayName, pointer] of Object.entries(deploymentHints.extra_columns)) {
        if (pointer === path) {
          label = displayName;
          break;
        }
      }
    }

    const definitionAnchor = path.replace(/\//g, '-').substring(1); // e.g. /deployment/name -> deployment-name
    const definitionAnchorElHref = `/deployments-registry/schema#${definitionAnchor}`;
    const definitionAnchorEl = `
      <a class="definition-anchor" title="See definition in schema" href="${definitionAnchorElHref}">
        <i class="material-symbols-rounded icon">arrow_outward</i>
      </a>
    `;

    const labelEl = `${label}${definitionAnchorEl}`

    // If value is plain object
    if (typeof value === 'object' && !Array.isArray(value)) {
      const inner = objectToHTML(value, path);
      if (!inner) continue;
      html.push(`
          <div class="deployment-section-block object-field">
            <div class="deployment-section-header" style="text-transform: capitalize;">${label}</div>
            ${inner}
          </div>`
      );
      continue;
    }

    // Normalize arrays -> comma separated string
    let renderedValue;
    if (Array.isArray(value)) {
      renderedValue = value.join(', ');
    } else {
      renderedValue = String(value);
    }

    const isShort = shortFieldSet.has(path);
    if (isShort) {
      html.push(`
          <table class="short-field">
            <tr>
              <th style="text-transform: capitalize;">${labelEl}</th>
              <td>${marked.parse(renderedValue)}</td>
            </tr>
          </table>`
      );
    } else {
      html.push(`
          <div class="long-field">
            <div class="section-sub-heading" style="text-transform: capitalize;">${labelEl}</div>
            <div class="section-content">${marked.parse(renderedValue)}</div>
          </div>`
      );
    }
  }
  return html.join('');
}

function generateDeploymentDetailsHTML(deployment, fileName) {
  const data_repo_base_url = window.siteConfig.dataRepoBaseUrl;
  const { name, description } = deployment.product;

  let deploymentHeader = `
      <div class="deployment-header-container">
        <div class="deployment-header">
          <div class="info">
            <div class="title">
              ${name || 'Deployment Details'}
            </div>

            ${description ? `<div class="description">${marked.parse(description)}</div>` : ''}

            ${data_repo_base_url && fileName ? (
              `<a class="button download-btn" href="${data_repo_base_url}/${fileName}.yaml" target="_blank">
                View on GitHub
                <span class="material-symbols-rounded icon">
                  arrow_outward
                </span>
              </a>`
            ) : ''}
          </div>

          <button class="close-btn variant-ghost" onClick="clearSelection()">
            <i class="material-symbols-rounded icon">close</i>
          </button>
        </div>
        <div class="section-spacer"></div>
      </div>`;

  let deploymentSection = `
    <div class="deployment-section">
      ${objectToHTML(deployment)}
    </div>
  `;

  return deploymentHeader + deploymentSection;
}

function clearSelection() {
  const sidebar = document.querySelector('.docs-sidebar');
  const sidePanel = document.querySelector('.side-panel');
  const sidePanelContainers = document.querySelectorAll('.side-panel-container');
  const deploymentDetailsDiv = document.getElementById('deployment-details');
  const modalOverlay = document.querySelector('.modal-overlay');

  // Remove selected class from all rows
  const allRows = document.querySelectorAll('.deployment-row');
  allRows.forEach(function (row) {
    row.classList.remove('selected');
  });

  // Remove anchor to current url
  const currentUrl = new URL(window.location.href);
  currentUrl.hash = '';
  window.history.pushState({}, '', currentUrl);

  // Expand sidebar
  if (sidebar) {
    sidebar.classList.remove('collapsed');
  }

  // Collapse side panel and container
  if (sidePanel) {
    sidePanel.classList.remove('expanded');
  }
  if (sidePanelContainers) {
    sidePanelContainers.forEach(container => {
      container.classList.remove('expanded');
    });
  }

  // Hide modal overlay
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }

  // Reset side panel content
  deploymentDetailsDiv.innerHTML = '';

  // Trigger resize to adjust visualizations width
  if (typeof window.triggerResize === 'function') {
    window.triggerResize();
  }
}

// Expose clearSelection for non-module scripts (e.g., sidebar.js)
window.clearSelection = clearSelection;
