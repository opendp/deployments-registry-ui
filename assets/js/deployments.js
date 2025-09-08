/* global MathJax */
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

let deploymentsData = [];
let deploymentHints = { short_fields: [], extra_columns: {} };

// Export the initialization function for use by datatable-init.js
export function initializeDeploymentsFeatures() {
  // Load deployments data
  const dataScript = document.getElementById('deployments-data');
  if (dataScript) {
    deploymentsData = JSON.parse(dataScript.textContent).map(d => d.deployment);
  }

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
    } catch (e) {
      console.warn('Encountered error parsing deployment hints JSON: \n', e);
    }
    // Initialize short field hints after parsing
    initShortFields();
  }

  // Add click handlers to deployment rows (now that DataTable is initialized)
  const deploymentRows = document.querySelectorAll('.deployment-row');
  deploymentRows.forEach(function (row) {
    row.addEventListener('click', function () {
      const rowIndex = parseInt(row.getAttribute('data-index'), 10);
      if (!Number.isNaN(rowIndex)) {
        selectDeploymentRow(rowIndex);
      }
    });
  });

  // Render latex descriptions (assumes order of .product-description cells matches deploymentsData)
  renderLatexDescriptionWindows();

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

function renderLatexDescriptionWindows() {
  const elements = document.querySelectorAll('.description-window');
  if (!elements.length || !deploymentsData.length) return;

  elements.forEach((element) => {
    const deploymentIndex = element.dataset.index;
    const d = deploymentsData[deploymentIndex];

    // Skip if no corresponding deployment found
    if (!d) return;

    // Skip if already processed (heuristic: no child elements yet or data-md-processed flag)
    if (element.dataset.mdProcessed === 'true') return;

    if (typeof d.description === 'string' && d.description.trim().length) {
      element.innerHTML = marked.parse(String(d.description));
      element.dataset.mdProcessed = 'true';
    }
  });

  // Typeset math only for the affected elements
  try {
    MathJax.typeset?.(Array.from(document.querySelectorAll('.description-window')));
  } catch (err) {
    if (!window.__mathjaxTypesetWarned) {
      console.warn('[deployments.js] MathJax typeset failed or MathJax not loaded when rendering description windows.', err);
      window.__mathjaxTypesetWarned = true; // avoid spamming console
    }
  }
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
  const sidePanelContainer = document.querySelector('.side-panel-container');
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
    if (sidePanelContainer) {
      sidePanelContainer.classList.add('expanded');
    }
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
        <i class="material-symbols-rounded icon">info</i>
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

function downloadDeployment() {
  try {
    // Get the current deployment from the stored index
    if (window.currentDeploymentIndex === undefined || !deploymentsData[window.currentDeploymentIndex]) {
      alert('No deployment selected for download.');
      return;
    }

    const deploymentData = deploymentsData[window.currentDeploymentIndex];

    // Convert deployment data to YAML format
    const yamlContent = convertToYAML(deploymentData);

    // Create filename based on deployment name or curator
    const filename = `${(deploymentData.name || deploymentData.data_curator || 'deployment').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.yaml`;

    // Create blob and download
    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading deployment:', error);
    alert('Error downloading deployment file. Please try again.');
  }
}

// Expose function to global scope
window.downloadDeployment = downloadDeployment;

function convertToYAML(data) {
  // Simple YAML converter - handles basic data structures
  function toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (obj === null || obj === undefined) {
      return 'null';
    }

    if (typeof obj === 'string') {
      // Handle strings that need quoting or escaping
      if (obj.includes('\n')) {
        // Multi-line strings use literal block scalar
        const lines = obj.split('\n');
        yaml = '|\n';
        lines.forEach(line => {
          yaml += `${spaces}  ${line}\n`;
        });
        return yaml.slice(0, -1); // Remove last newline
      } else if (obj.includes('"') || obj.includes("'") || obj.includes(':') || obj.includes('[') || obj.includes(']') || obj.includes('{') || obj.includes('}') || obj.includes('#')) {
        // Quote strings that contain special YAML characters
        return `"${obj.replace(/"/g, '\\"')}"`;
      } else {
        // Simple strings don't need quotes
        return obj;
      }
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      yaml = '\n';
      obj.forEach(item => {
        const itemYaml = toYAML(item, indent + 1);
        if (itemYaml.includes('\n')) {
          yaml += `${spaces}- |\n${spaces}  ${itemYaml.replace(/\n/g, `\n${spaces}  `)}\n`;
        } else {
          yaml += `${spaces}- ${itemYaml}\n`;
        }
      });
      return yaml.slice(0, -1); // Remove last newline
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj).filter(key => {
        const value = obj[key];
        return value !== null && value !== undefined && value !== '';
      });

      if (keys.length === 0) return '{}';

      yaml = '\n';
      keys.forEach((key) => {
        const value = obj[key];
        const yamlValue = toYAML(value, indent + 1);

        if (yamlValue.startsWith('\n')) {
          // Object or array value
          yaml += `${spaces}${key}:${yamlValue}\n`;
        } else {
          // Simple value
          yaml += `${spaces}${key}: ${yamlValue}\n`;
        }
      });
      return yaml.slice(0, -1); // Remove last newline
    }

    return String(obj);
  }

  // Wrap the deployment in the expected structure
  const wrappedData = {
    ...data
  };

  return toYAML(wrappedData);
}

function clearSelection() {
  const sidebar = document.querySelector('.docs-sidebar');
  const sidePanel = document.querySelector('.side-panel');
  const sidePanelContainer = document.querySelector('.side-panel-container');
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
  if (sidePanelContainer) {
    sidePanelContainer.classList.remove('expanded');
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
