/* eslint-env browser, jquery */
/* global DataTable, MathJax */

import { getColumnsConfig } from './deployments-table-config.js';
import { initializeDeploymentsFeatures } from './deployments.js';

window.addEventListener('DOMContentLoaded', () => {
	// Ensure required globals exist
	if (typeof DataTable === 'undefined') return;

	if (!window.jQuery) return; // jQuery not loaded
	const $ = window.jQuery;

	const tableEl = document.getElementById('deployments-table');
	if (!tableEl) return; // No table present on this page

	// Prevent double init
	if ($.fn.dataTable.isDataTable(tableEl)) return;

	const dataEl = document.getElementById('deployments-data');
	if (!dataEl) return; // No data script tag found

	let deploymentsData = [];
	try {
		deploymentsData = JSON.parse(dataEl.textContent || '[]');
	} catch (e) {
		// Fail silently but log for debugging
		console.error('Failed to parse deployments data JSON', e);
		return;
	}

	const columnsConfig = getColumnsConfig(deploymentsData);
	const columns = columnsConfig.map(c => c.column);

	// // Collect indices of columns where searchPane is enabled
	const automaticSearchPaneCols = [];
	const customSearchPaneCols = [];
	const columnDefs = [];
	columnsConfig.map((c, idx) => {
		if ('searchPane' in c) {
			if (typeof c.searchPane === 'boolean') {
				automaticSearchPaneCols.push(idx);
			} else if(typeof c.searchPane === 'object' && c.searchPane.show && 'config' in c.searchPane) {
				if(Array.isArray(c.searchPane.config)) {
					customSearchPaneCols.push(...c.searchPane.config);
				} else {
					customSearchPaneCols.push(c.searchPane.config);
				}
			}
		}

		if ('columnDef' in c) {
			columnDefs.push(c.columnDef);
		}
	});

	const dt = new DataTable('#deployments-table', {
		paging: false,
		order: [0],
		autoWidth: false, // stop DT from guessing widths
		info: false,
		deferRender: true,
		dom: 'Prt', // P = SearchPanes, r = processing, t = table
		data: deploymentsData,
		columns,
		searchPanes: {
			initCollapsed: true,
			collapse: false,
			orderable: false,
			columns: automaticSearchPaneCols,
			panes: customSearchPaneCols,
			dtOpts: {
				scrollY: '200px',
				// Make pane rows behave like checkbox toggles (no ctrl/cmd needed)
				select: { style: 'multi' }
			}
		},
		columnDefs: columnDefs,
		// Apply header attributes to <th> elements
		headerCallback: function(thead) {
			const $thead = $(thead);
			columnsConfig.forEach((c, index) => {
				if (c.headerAttributes) {
					const $th = $thead.find('th').eq(index);
					if ($th.length) {
						Object.entries(c.headerAttributes).forEach(([key, value]) => {
							$th.attr(key, value);
						});
					}
				}
			});
		},
		// Add data attributes to each row for easier lookup later
		createdRow: function(row, data, dataIndex) {
			$(row).addClass('deployment-row');

			$(row).attr('data-index', data.index || dataIndex);
			$(row).attr('data-file-name', data.file_name);   // correct key: file_name (not fileName)
			$(row).attr('data-anchor', data.anchor);         // this should work now
		},

		initComplete: function () {
			const searchPanes = Array.from(document.querySelectorAll('.dtsp-searchPane'));
			const headers = Array.from(tableEl.querySelectorAll('thead th'));

			function injectSearchPaneInColHeadFilter(header, searchPane) {
				if (header) {
					// get headers child with class filter-trigger
					let paneTrigger = header.querySelector('.filter-trigger');
					if (!paneTrigger) {
						paneTrigger = document.createElement('button');
						paneTrigger.type = 'button';
						paneTrigger.classList.add('filter-trigger');
						paneTrigger.innerHTML = '<i class="material-symbols-rounded icon">filter_list</i>';
						header.appendChild(paneTrigger);
					}

					// get headers child with class filters-popover
					let panePopover = header.querySelector('.filters-popover');
					if (!panePopover) {
						const panePopoverWrapper = document.createElement('div');
						panePopoverWrapper.classList.add('filters-popover-wrapper');
						header.appendChild(panePopoverWrapper);
						panePopover = document.createElement('div');
						panePopover.classList.add('filters-popover');
						panePopoverWrapper.appendChild(panePopover);
					}

					const filterLabel = searchPane.querySelector('.filter-label');
					const searchInput = searchPane.querySelector('.dtsp-search');
					let label = 'Filter';
					if (searchInput) {
						label = searchInput.attributes.placeholder.value.trim();
						searchInput.attributes.placeholder.value = 'Search...';
					}

					if (!filterLabel) {
						const subRowNo2 = searchPane.querySelector('.dtsp-subRow2');

						if(subRowNo2) {
							const labelElement = document.createElement('div');
							labelElement.classList.add('filter-label');
							labelElement.textContent = label;
							subRowNo2.appendChild(labelElement);
						}
					}

					if (searchPane) {
						panePopover.appendChild(searchPane);
					}
				}
			}

			columnsConfig.forEach((c) => {
				const {colIdx, searchPaneClassName} = c;

				const thead = headers.find(th => parseInt(th.getAttribute('data-col-idx'), 10) === colIdx);
				const thisColumnsSearchPanes = searchPanes.filter(sp => sp.classList.contains(searchPaneClassName));

				thisColumnsSearchPanes.forEach(sp => {
					injectSearchPaneInColHeadFilter(thead, sp);
				})
			});

			// Initialize deployments features now that DataTable is fully set up
			try {
				initializeDeploymentsFeatures();
			} catch (e) {
				console.warn('Failed to initialize deployments features:', e);
			}

			// Typeset math only for the affected elements
			try {
				MathJax.typeset?.(Array.from(document.querySelectorAll('.inline-markdown')));
			} catch (err) {
				if (!window.__mathjaxTypesetWarned) {
				console.warn('[deployments.js] MathJax typeset failed or MathJax not loaded when rendering datatable.', err);
				window.__mathjaxTypesetWarned = true; // avoid spamming console
				}
			}
		},
	});

	/**
	 * =================================
	 * FILTER POPOVER + GLOBAL HANDLERS
	 * =================================
	 */
	(function attachFilterHandlers() {
		const tableId = dt.table().node().id || 'deployments-table';
		const ns = '.drTableFilters-' + tableId; // unique namespace per table

		// Local (element-scoped) handlers – removed automatically when nodes go away
		try {
			const popoverWrappers = document.querySelectorAll('.filters-popover-wrapper');
			if (popoverWrappers.length > 0) {
				popoverWrappers.forEach(btn => {
					if (btn && typeof btn.addEventListener === 'function') {
						btn.addEventListener('click', function (e) {
							e.preventDefault();
							e.stopPropagation();
						});
					}
				});
			}
		} catch (e) {
			console.warn('Failed to attach popover wrapper handlers:', e);
		}

		try {
			const filterTriggers = document.querySelectorAll('.filter-trigger');
			if (filterTriggers.length > 0) {
				filterTriggers.forEach(btn => {
					if (btn && typeof btn.addEventListener === 'function') {
						btn.addEventListener('click', function (e) {
							e.preventDefault();
							e.stopPropagation();

							const $th = $(this).closest('th[data-col-idx]');
							const $trigger = $th.find('button.filter-trigger');
							const $popover = $th.find('.filters-popover-wrapper');
							const isVisible = $popover.hasClass('visible');

							// close all others
							$('.filters-popover-wrapper').removeClass('visible');
							$('button.filter-trigger').removeClass('open');

							if (isVisible) {
								$popover.removeClass('visible');
								$trigger.removeClass('open');
							} else {
								$popover.addClass('visible');
								$trigger.addClass('open');
							}
						}, { capture: true }); // capture is key
					}
				});
			}
		} catch (e) {
			console.warn('Failed to attach filter trigger handlers:', e);
		}

		// Global (document) handlers – namespaced so they can be removed on destroy
		$(document)
			.on('click' + ns, function () {
				$('.filters-popover-wrapper').removeClass('visible');
				$('button.filter-trigger').removeClass('open');
			})
			.on('click' + ns, '.filters-popover-wrapper', function (e) {
				e.stopPropagation(); // keep popover open
			});

		// Cleanup when DataTable is destroyed to avoid leaking handlers
		dt.on('destroy.dt', function () {
			$(document).off(ns);
		});
	})();

	// helper: get pane DataTables from the thead
	function getPaneDTsFromThead(theadEl) {
		try {
			if (!theadEl || typeof theadEl.querySelectorAll !== 'function') {
				console.warn('Invalid theadEl provided to getPaneDTsFromThead');
				return [];
			}
			return Array.from(theadEl.querySelectorAll('.dtsp-searchPane table'))
				.map(tbl => {
					try {
						return $.fn.dataTable.isDataTable(tbl) ? $(tbl).DataTable() : null;
					} catch (e) {
						console.warn('Failed to get DataTable instance:', e);
						return null;
					}
				})
				.filter(Boolean);
		} catch (e) {
			console.warn('Failed to get pane DataTables from thead:', e);
			return [];
		}
	}


	/**
	 * =====================
	 * ACTIVE FILTERS BADGE
	 * =====================
	 * Displays a badge on each column heads filter button.
	 * indicating the number of active filters applied to that column.
	 * Hides or displays each filters 'Clear' button and 'Clear all' button
	 * based on the active filter count.
	 */
	// Cache of header -> pane DataTables + elements to avoid repeated DOM queries in activePaneFilters
	let headerPaneCache = [];
	function rebuildHeaderPaneCache() {
		try {
			if (!tableEl || typeof tableEl.querySelectorAll !== 'function') {
				console.warn('Invalid tableEl for rebuildHeaderPaneCache');
				headerPaneCache = [];
				return;
			}

			headerPaneCache = Array.from(tableEl.querySelectorAll('thead th')).map(th => {
				try {
					const paneDTs = getPaneDTsFromThead(th).map(paneDT => {
						try {
							const tableElNode = paneDT.table().node();
							const paneHTMLElement = $(tableElNode)?.closest('.dtsp-searchPane');
							return {
								dt: paneDT,
								clearBtn: paneHTMLElement?.find('.dtsp-paneButton.clearButton').get(0)
							};
						} catch (e) {
							console.warn('Failed to process pane DataTable:', e);
							return null;
						}
					}).filter(Boolean);

					return {
						th,
						trigger: th.querySelector ? th.querySelector('.filter-trigger') : null,
						panes: paneDTs
					};
				} catch (e) {
					console.warn('Failed to process header element:', e);
					return null;
				}
			}).filter(entry => entry && entry.panes && entry.panes.length > 0);
		} catch (e) {
			console.warn('Failed to rebuild header pane cache:', e);
			headerPaneCache = [];
		}
	}
	// Build initial cache after filters have been injected
	rebuildHeaderPaneCache();

	// helper: how many options are selected across ALL panes
	function activePaneFilters() {
		if (!headerPaneCache.length) rebuildHeaderPaneCache();

		const totalActiveFiltersCount = headerPaneCache.reduce((count, entry) => {
			let headerActive = 0;
			entry.panes.forEach(p => {
				const selected = p.dt.rows({ selected: true, search: 'none' }).count();
				if (p.clearBtn) p.clearBtn.style.display = selected > 0 ? 'flex' : 'none';
				headerActive += selected;
			});
			if (entry.trigger) {
				if (headerActive > 0) {
					entry.trigger.classList.add('has-active-filters');
					entry.trigger.setAttribute('data-count', headerActive);
				} else {
					entry.trigger.classList.remove('has-active-filters');
					entry.trigger.removeAttribute('data-count');
				}
			}
			return count + headerActive;
		}, 0);

		const globalSearchActive = (typeof dt.search === 'function' && dt.search().length > 0) || (document.getElementById('search-filter')?.value.trim().length > 0);

		return { totalActiveFiltersCount, globalSearchActive };
	}

	// update the badge any time a pane selection changes
	$(dt.searchPanes.container())
		.on('select.dt deselect.dt', 'table.dataTable', function () {
			const { totalActiveFiltersCount, globalSearchActive } = activePaneFilters(); // also updates badges

			const clearBtn = document.getElementById('clear-filters');
			if (clearBtn) {
				clearBtn.style.display = (totalActiveFiltersCount > 0 || globalSearchActive) ? 'block' : 'none';
			}
		});

	// also update on initial load or when panes are rebuilt
	dt.on('init.dt draw.dt', function () {
		const { totalActiveFiltersCount, globalSearchActive } = activePaneFilters(); // refresh badges

		const clearBtn = document.getElementById('clear-filters');
		if (clearBtn) {
			clearBtn.style.display = (totalActiveFiltersCount > 0 || globalSearchActive) ? 'block' : 'none';
		}
	});


	/**
	 * ==============
	 * CUSTOM SEARCH
	 * ==============
	 * Custom global search over flattened deployment object keys/values
	 * We keep our own search term and use DataTables ext.search to include rows whose
	 * ANY _data item contains the search term (case-insensitive).
	 * We intentionally do NOT rely on DataTables built-in textual search (dt.search())
	 * so that rows can match even if visible cell text doesn't contain the term but
	 * deployment metadata does.
	 */
	let customSearchTerm = '';
	const customSearchFunction = function (settings, _data) {
		if (settings.nTable !== tableEl) return true; // only affect this table
		if (!customSearchTerm) return true; // empty search => no filtering
		return (_data.join(' ').toLowerCase() || '').includes(customSearchTerm.toLowerCase());
	};
	$.fn.dataTable.ext.search.push(customSearchFunction);

	// Hook search input to custom search term + redraw
	const searchInput = document.getElementById('search-filter');
	if (searchInput) {
		searchInput.addEventListener('input', () => {
			customSearchTerm = searchInput.value.trim().toLowerCase();
			// Clear DataTables own search so it doesn't AND-filter out metadata matches
			dt.search('');
			dt.draw();

			// update clear button visibility on search typing
			const { totalActiveFiltersCount, globalSearchActive } = activePaneFilters();
			const clearBtn = document.getElementById('clear-filters');
			if (clearBtn) {
				clearBtn.style.display = (totalActiveFiltersCount > 0 || globalSearchActive) ? 'block' : 'none';
			}

			const clearSearchInputBtn = document.getElementById('clear-search-btn');
			if (clearSearchInputBtn) {
				clearSearchInputBtn.style.display = (searchInput.value.trim().length > 0) ? 'flex' : 'none';
			}
		});
	}

	// Hook search input to DataTables global search
	const clearSearchBtn = document.getElementById('clear-search-btn');
	if (clearSearchBtn) {
		clearSearchBtn.addEventListener('click', () => {
			if (searchInput) searchInput.value = '';
			customSearchTerm = '';
			dt.search('');
			dt.draw();
		});
	}

	// Clear button: clear global search + panes selections
	const clearBtn = document.getElementById('clear-filters');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			if (searchInput) searchInput.value = '';
			customSearchTerm = '';
			dt.search('');

			if (dt.searchPanes && dt.searchPanes.clearSelections) {
				dt.searchPanes.clearSelections();
			}

			dt.draw();
		});
	}

	// Cleanup custom search function when DataTable is destroyed to prevent memory leaks
	dt.on('destroy.dt', function () {
		const searchIndex = $.fn.dataTable.ext.search.indexOf(customSearchFunction);
		if (searchIndex > -1) {
			$.fn.dataTable.ext.search.splice(searchIndex, 1);
		}
	});
});
