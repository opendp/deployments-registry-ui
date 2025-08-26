/* eslint-env browser */
/* global d3, CustomSelect */
// =============================================================================================
// HIGH-LEVEL OVERVIEW:
// ---------------------------------------------------------------------------------------------
// This file builds an interactive dual-panel visualization of "deployments" data:
//   Left chart  : Bar chart counting deployments grouped by a selected categorical variable (e.g., Flavor, Region, Tier).
//   Right chart : Stacked bar chart showing per-year counts, split by the same variable. Includes an interactive brush.
//
// User experience:
//   - A dropdown selects which variable to analyze.
//   - Left chart updates to show category distribution (counts).
//   - Right chart shows distribution over years (stacked bars).
//   - Brushing (dragging a range) on the right chart filters the left chart to that year span.
//   - A text label indicates if a year filter is active.
//   - Layout adapts on window resize.
//
// Key D3 ideas:
//   - Scales: Map data values to screen positions (e.g., categories -> x pixels; counts -> y pixels).
//   - Axes: Visual rulers generated from scales for orientation.
//   - Data binding: Attaches arrays to DOM elements so we can create/update/remove shapes based on data.
//   - Enter/Update/Exit: Pattern for managing elements when underlying data changes.
//   - Transitions: Animated changes (e.g., bar heights grow to new values).
//   - Stack layout: Prepares data so categories can be layered vertically in a stacked bar.
//   - Brush: UI component allowing a user to drag-select an x-range which we then use for filtering.
//
// =============================================================================================

/** Color palette (TABLEAU10) */
const TABLEAU10 = [
  "#4E79A7", // blue
  "#F28E2B", // orange
  "#E15759", // red
  "#76B7B2", // teal
  "#59A14F", // green
  "#EDC948", // yellow
  "#B07AA1", // purple
  "#FF9DA7", // pink
  "#9C755F", // brown
  "#BAB0AC"  // gray
];

// ---------------------------------------------------------------------------
// Configuration & constants
// ---------------------------------------------------------------------------
const VIS_CONFIG = {
  margin: { top: 24, right: 24, bottom: 24, left: 48 },   // chart padding inside SVG
  height: 350,                                            // total SVG height (before dynamic extension for wrapped labels)
  plotSpacing: 70,                                        // horizontal space between left & right charts
  dropdownHeight: 24,                                     // vertical reserve for dropdown UI
  defaultVariable: "data_product_type"                    // initial variable shown
};

// Base vertical offset from plot area bottom to x-axis label
const BASE_X_LABEL_OFFSET = 32;
// Desired gap (pixels) between the bottom of tick labels block and the x-axis label
const X_LABEL_GAP = 16;

// Dropdown options: internal 'name' = data field; 'displayName' = user-facing label
const VARIABLE_OPTIONS = [
  { name: "flavor_vis", displayName: "Flavor" },
  { name: "sector", displayName: "Sector" },
  { name: "region", displayName: "Region" },
  { name: "tier", displayName: "Tier" },
  { name: "deployment_model_vis", displayName: "Deployment model" },
  { name: "data_product_type", displayName: "Data product type" },
  { name: "is_many_release", displayName: "Release type" },
  { name: "is_interactive", displayName: "Access type" },
  { name: "is_dynamic", displayName: "Data source" }
];

// ---------------------------------------------------------------------------
// Helper: compute container width robustly (handles hidden elements)
// ---------------------------------------------------------------------------
function computeContainerWidth() {
  const reg = document.getElementById('registryDiv');
  if (!reg) return 800; // fallback if not found

  let w = reg.clientWidth;

  if (!w) {
    // If element is hidden (display:none), temporarily show to measure
    const wasHidden = reg.offsetParent === null;
    if (wasHidden) {
      reg.style.visibility = 'hidden';
      reg.style.display = 'block';
      w = reg.clientWidth;
      reg.style.removeProperty('display');
      reg.style.removeProperty('visibility');
    }
  }

  if (!w) {
    // Ultimate fallback: parent width or fraction of window width
    w = reg.parentElement?.clientWidth || (window.innerWidth ? Math.max(window.innerWidth * 0.8, 600) : 800);
  }

  return Math.max(w, 400); // guard against zero/negative
}

// ---------------------------------------------------------------------------
// Data shaping: convert raw deployment objects into normalized array used by charts
// ---------------------------------------------------------------------------
function buildDataFromDeployments(raw) {
  if (!raw) return [];

  // Accept either array or object map
  const records = Array.isArray(raw) ? raw : Object.values(raw);

  const out = records.map(r => {
    const tier = r.tier ?? r.deployment?.tier;   // tier may live at different nesting levels
    const dep = r.deployment || r;               // unify root
    const model = dep.model || {};               // nested model details

    // Publication date may appear in multiple fields; we parse out a 4-digit year
    const publication_date = (dep.publication_date || dep.date || '').toString().trim();
    let year;
    if (publication_date) {
      let m = /^(\d{4})/.exec(publication_date);          // year at the start
      if (!m) m = /(19|20)\d{2}/.exec(publication_date);  // fallback: any plausible year
      if (m) year = parseInt(m[0]);
    }

    // Derive friendly rollups for UI
    const release_type = (model.release_type || '').toLowerCase();
    const is_many_release = release_type.includes('many') ? 'Many releases' : (release_type ? 'Single release' : 'Unknown');

    // Interpret the model's access_type string and derive a friendly label telling
    // whether the data product is interactive or not. We lowercase for robust matching
    // and treat any value containing the word 'interactive' (unless explicitly negated
    // via 'non') as Interactive; otherwise Non-interactive.
    const access_type = (model.access_type || '').toLowerCase();
    const is_interactive = access_type.includes('interactive') && !access_type.includes('non') ? 'Interactive' : 'Non-interactive';

    // Interpret the model's data_source_type string and derive a label indicating
    // whether the underlying data updates over time (Dynamic) or is static. Unknown
    // if the field is empty. This powers a dropdown category.
    const data_source_type = (model.data_source_type || '').toLowerCase();
    const is_dynamic = data_source_type.includes('dynamic') ? 'Dynamic' : (data_source_type ? 'Static' : 'Unknown');

    return {
      flavor_vis: dep.dp_flavor?.name || 'Unknown',
      sector: dep.data_product_sector || 'Unknown',
      region: dep.data_product_region || 'Unknown',
      tier: tier != null ? tier.toString() : 'Unknown',
      deployment_model_vis: model.model_name || 'Unknown',
      data_product_type: dep.data_product_type || 'Unknown',
      is_many_release,
      is_interactive,
      is_dynamic,
      year: year || null
    };
  });

  // Keep only rows with a plausible year
  const withYear = out.filter(d => d.year && d.year >= 1900 && d.year <= 2100);

  // Warn if data has too little year variation (could indicate a parsing issue)
  const uniqueYears = [...new Set(withYear.map(d => d.year))];
  if (uniqueYears.length <= 1) {
    console.warn('[deployments-vis] Year distribution suspicious:', uniqueYears, 'Sample raw years:', out.slice(0, 5).map(d => d.year));
  }

  return withYear;
}

// Map internal variable name to dropdown / axis label
function getDisplayLabel(variableName) {
  return VARIABLE_OPTIONS.find(v => v.name === variableName)?.displayName || variableName;
}

// Inclusive integer range generator (used to fill in missing years between min & max)
function rangeInclusive(start, end) {
  const arr = [];
  for (let y = start; y <= end; y++) arr.push(y);
  return arr;
}

// ---------------------------------------------------------------------------
// Public initializer (attached to window). Creates the visualization once.
// ---------------------------------------------------------------------------
function initDeploymentsVis() {
  // Prevent duplicate initialization
  if (document.getElementById('vis-svg')) return;

  // Layout metrics
  const { margin, height, plotSpacing, dropdownHeight, defaultVariable } = VIS_CONFIG;

  // Compute starting width & derived dimensions
  let width = computeContainerWidth();
  let PLOT_WIDTH = (width - plotSpacing - margin.left - margin.right) / 2;
  if (PLOT_WIDTH <= 0) {
    width = Math.max(width, 800);
    PLOT_WIDTH = (width - plotSpacing - margin.left - margin.right) / 2;
  }
  const PLOT_HEIGHT = height - margin.top - margin.bottom;

  // Root container references
  const container = d3.select('#vis-container');

  // Variable dropdown reference
  const controls = d3.select('#vis-controls').style('left', margin.right + 'px');

  // Filtered by label reference for left plot
  const filteredByElement = document.getElementById('filtered-by');
  const filteredBy = d3.select('#filtered-by-value');
  // Right plot legend reference
  const rightPlotLegendContainer = d3.select('#right-plot-legend-container');

  // SVG root (height may grow later if x tick labels wrap)
  const svg = container.append('svg')
    .attr('id', 'vis-svg')
    .attr('width', width)
    .attr('height', height + dropdownHeight);
  const baseSvgHeight = height + dropdownHeight;
  let extraBottomSpace = 0; // dynamic extension tracked


  // -----------------------------------------------------------------------
  // DATA: Load & prepare deployments data
  // -----------------------------------------------------------------------
  // Attempt sources in order:
  // 1. window.deployments (if previously cached)
  // 2. <script id="deployments-data" type="application/json"> embedded in page
  let rawDeployments = (typeof window !== 'undefined' && window.deployments) ? window.deployments : null;
  if (!rawDeployments) {
    const dataEl = document.getElementById('deployments-data');
    if (dataEl) {
      try {
        rawDeployments = JSON.parse(dataEl.textContent.trim());
        // Cache globally to avoid reparsing if visualization re-inits
        window.deployments = rawDeployments;
      } catch (e) {
        console.warn('[deployments-vis] Failed to parse deployments-data JSON:', e);
      }
    }
  }
  const data = buildDataFromDeployments(rawDeployments);
  if (!data.length) console.warn('[deployments-vis] No deployment records found for visualization.');
  data.forEach(d => { d.tier = d.tier.toString(); }); // normalize tier to string

  // -----------------------------------------------------------------------
  // LEFT CHART scaffolding (categorical counts)
  // -----------------------------------------------------------------------
  const left_plot = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
  const x_scale_left = d3.scaleBand().padding(0.2).range([0, PLOT_WIDTH]);                            // Ordinal band scale: maps each category to a horizontal band
  const y_scale_left = d3.scaleLinear().range([PLOT_HEIGHT, 0]);                                      // Linear scale: maps counts (0..max) to vertical pixel positions
  const x_axis_group_left = left_plot.append('g').attr('transform', `translate(0, ${PLOT_HEIGHT})`);  // <g> container where the left x-axis (categories) will be drawn
  const y_axis_group_left = left_plot.append('g');                                                    // <g> container for the left y-axis (deployment counts)

  // Axis labels
  const x_label_left = left_plot.append('text')
    .attr('class', 'axis-label axis-label-x')
    .attr('text-anchor', 'middle')
    .attr('x', PLOT_WIDTH / 2)
    .attr('y', PLOT_HEIGHT + BASE_X_LABEL_OFFSET)
    .text('Data product type'); // initial placeholder (will update)

  // Add the left y‑axis label: rotated -90 degrees so it reads vertically beside the axis.
  left_plot.append('text')
    .attr('class', 'axis-label axis-label-y')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(PLOT_HEIGHT / 2))
    .attr('y', -30)
    .attr('text-anchor', 'middle')
    .text('Number of deployments');

  // Filter label
  const filter_text = filteredBy.append('text')
    .attr('class', 'filterText visText')
    .attr('x', 0)
    .attr('y', -10)
    .text('Not filtered');

  // Wrap long category labels for readability & adjust SVG height if needed
  function wrapLeftXAxisTicks() {
    const lineHeightEm = 1.05; // vertical spacing between wrapped lines

    x_axis_group_left.selectAll('text').each(function () {
      const text = d3.select(this);

      // Recover original full label (if previously wrapped into tspans)
      const existingTspans = text.selectAll('tspan');
      let original = text.text();
      if (!original && existingTspans.size()) {
        original = existingTspans.nodes().map(n => n.textContent).join(' ');
      }

      if (!original) return; // nothing to process

      const maxWidth = x_scale_left.bandwidth();
      const words = original.split(/\s+/).filter(Boolean);
      if (words.length <= 1) return; // short label fits

      // Clear & rebuild with tspans
      text.text(null);
      text.selectAll('tspan').remove();

      let line = [];
      let lineNumber = 0;
      const y = text.attr('y');
      const dy = parseFloat(text.attr('dy')) || 0;
      let tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', dy + 'em');

      // Build wrapped (multi-line) tick labels: accumulate words until they exceed
      // the allowed band width; when they do, finalize the current line and start
      // a new <tspan> so long category names stack vertically.
      words.forEach(word => {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text.append('tspan')
            .attr('x', 0)
            .attr('y', y)
            .attr('dy', ((++lineNumber * lineHeightEm) + dy) + 'em')
            .text(word);
        }
      });
    });

    // Measure total height of wrapped tick labels to reposition x-axis label below them
    let tickBlockMax = 0;
    x_axis_group_left.selectAll('text').each(function () {
      const bbox = this.getBBox();
      const bottom = bbox.y + bbox.height;
      if (bottom > tickBlockMax) tickBlockMax = bottom;
    });

    // Fallback if measurement fails
    if (!tickBlockMax || !isFinite(tickBlockMax)) tickBlockMax = BASE_X_LABEL_OFFSET - X_LABEL_GAP;

    // Position x-axis label below tick labels
    const yLabel = PLOT_HEIGHT + tickBlockMax + X_LABEL_GAP;
    x_label_left.attr('y', yLabel);
    d3.selectAll('.year-label').attr('y', yLabel); // align right chart x label vertically

    // Extend SVG height if wrapped labels exceed original spacing
    const neededExtra = Math.max(0, Math.ceil((tickBlockMax + X_LABEL_GAP) - BASE_X_LABEL_OFFSET));
    if (neededExtra !== extraBottomSpace) {
      extraBottomSpace = neededExtra;
      svg.attr('height', baseSvgHeight + extraBottomSpace);
    }
  }

  // -----------------------------------------------------------------------
  // RIGHT CHART scaffolding (stacked bars over time)
  // -----------------------------------------------------------------------
  const right_plot = svg.append('g')
    .attr('transform', `translate(${margin.left + plotSpacing + PLOT_WIDTH}, ${margin.top})`);

  // Right chart x scale
  const x_scale_right = d3.scaleBand().padding(0.2).range([0, PLOT_WIDTH]);
  const y_scale_right = d3.scaleLinear().range([PLOT_HEIGHT, 0]);

  const x_axis_group_right = right_plot.append('g').attr('transform', `translate(0, ${PLOT_HEIGHT})`);  // <g> container for right plot x‑axis (years)
  const y_axis_group_right = right_plot.append('g');                                                    // <g> container for right plot y‑axis (stacked totals)

  // Add right plot x‑axis label centered beneath the year axis.
  right_plot.append('text')
    .attr('text-anchor', 'middle')
    .attr('x', PLOT_WIDTH / 2)
    .attr('y', PLOT_HEIGHT + BASE_X_LABEL_OFFSET)
    .attr('class', 'axis-label axis-label-x year-label')
    .text('Year');

  // Add right plot y‑axis label showing what the stack height represents.
  right_plot.append('text')
    .attr('class', 'axis-label axis-label-y')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(PLOT_HEIGHT / 2))
    .attr('y', -30)
    .attr('text-anchor', 'middle')
    .text('Number of deployments');

  // -----------------------------------------------------------------------
  // DROPDOWN UI (custom select fallback to native)
  // -----------------------------------------------------------------------
  const dropdownContainer = controls.append('div').attr('id', 'variable-dropdown-container').node();
  let variableSelect;

  if (window.CustomSelect) {
    // Initialize custom select dropdown
    variableSelect = new CustomSelect(dropdownContainer);

    // Populate options from VARIABLE_OPTIONS
    variableSelect.updateOptions(VARIABLE_OPTIONS.map(o => ({ value: o.name, label: o.displayName })));

    // Set initial value and change event
    variableSelect.setValue(defaultVariable);
    variableSelect.onChange = (selected) => {
      filteredByElement.classList.remove('visible');
      updatePlots(selected || defaultVariable);
    };
  } else {
    // Fallback to native select if CustomSelect not loaded
    const fallback = d3.select(dropdownContainer).append('select').attr('id', 'dropdown');

    // Populate options from VARIABLE_OPTIONS
    fallback.selectAll('option')
      .data(VARIABLE_OPTIONS)
      .enter()
      .append('option')
      .attr('value', d => d.name)
      .text(d => d.displayName);

    // Set initial value and change event
    fallback.property('value', defaultVariable)
      .on('change', function () {
        filteredByElement.classList.remove('visible');
        updatePlots(this.value);
      });
  }

  // =======================================================================
  // MASTER UPDATE FUNCTION (renders both charts for selected variable)
  // =======================================================================
  function updatePlots(selected_variable) {
    // Clear dynamic layers to rebuild (axes & base scaffolding retained)
    d3.selectAll('.gridLine').remove();
    d3.selectAll('.gridLineLeft').remove();
    d3.selectAll('.brush').remove();
    d3.selectAll('.legend').remove();

    // ---------
    // TOOLTIP
    // ---------
    // Tooltip used to display category name and count when hovering over bars (left chart);
    // a single shared element reused across renders.
    // Ensure single tooltip instance
    let tooltip = d3.select('#vis-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div')
        .attr('id', 'vis-tooltip')
        .attr('class', 'vis-tooltip');
    }

    // -------------
    // COLOR SCALE
    // -------------
    // Color mapping for categories (domain = unique category values for variable)
    const keys = Array.from(new Set(data.map(d => d[selected_variable])));
    const color = d3.scaleOrdinal().domain(keys).range(TABLEAU10);

    // -------------------------------------------
    // LEFT CHART: aggregate counts per category
    // -------------------------------------------
    const countsRoll = d3.rollup(data, v => v.length, d => d[selected_variable]);
    const counts_left = Array.from(countsRoll, ([key, value]) => ({ category: key, count: value }));

    x_scale_left.domain(counts_left.map(d => d.category));        // Set horizontal domain to the list of categories present in current data
    y_scale_left.domain([0, d3.max(counts_left, d => d.count)]);  // Set vertical domain: 0 up to the maximum category count

    // Draw / animate the x-axis using the updated band scale, then wrap long tick labels when transition ends.
    x_axis_group_left
      .transition()
      .duration(500)
      .call(d3.axisBottom(x_scale_left))
      .on('end', wrapLeftXAxisTicks); // wrap after axis draw completes

    // Compute only whole-number ticks (fractional counts are not meaningful here).
    const whole_ticks_left = y_scale_left.ticks().filter(d => Number.isInteger(d));

    // Draw / animate the y-axis with only integer tick values (no decimals).
    y_axis_group_left.transition().duration(500)
      .call(d3.axisLeft(y_scale_left).tickValues(whole_ticks_left).tickFormat(d => d));

    // Horizontal grid lines (drawn behind bars)
    whole_ticks_left.forEach(tick => {
      left_plot.append('line')
        .attr('class', 'gridLineLeft')
        .attr('x1', 0).attr('x2', PLOT_WIDTH)
        .attr('y1', y_scale_left(tick))
        .attr('y2', y_scale_left(tick))
        .attr('stroke', 'lightgray')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
    });

    // Bind data to bars
    const bars = left_plot.selectAll('.bar').data(counts_left, d => d.category);

    // ENTER: new bars start at height 0 then animate up
    const barsEnter = bars.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x_scale_left(d.category))
      .attr('y', y_scale_left(0))
      .attr('width', x_scale_left.bandwidth())
      .attr('height', 0)
      .attr('role', 'img')
      .attr('aria-label', d => `${getDisplayLabel(selected_variable)} ${d.category}: ${d.count}`)
      .style('fill', d => color(d.category)) // opacity via CSS
      .on('mousemove', (event) => {
        // Update tooltip position
        tooltip
          .style('left', (event.pageX + 12) + 'px')
          .style('top', (event.pageY + 12) + 'px');
      })
      .on('mouseover', (event, d) => {
        // Show tooltip with category and count
        tooltip
          .html(`<strong>${d.category}</strong><br/>Count: ${d.count}`)
          .transition().duration(150).style('opacity', 1);
      })
      .on('mouseout', () => {
        // Hide tooltip
        tooltip.transition().duration(150).style('opacity', 0);
      });

    // ENTER + UPDATE merge: animate to correct size/position
    // "ENTER + UPDATE" refers to the merged selection of newly created elements (enter)
    // and existing elements being updated. We animate both to their final positions/sizes.
    barsEnter.merge(bars)
      .transition().duration(500)
      .attr('x', d => x_scale_left(d.category))
      .attr('y', d => y_scale_left(d.count))
      .attr('width', x_scale_left.bandwidth())
      .attr('height', d => PLOT_HEIGHT - y_scale_left(d.count));

    // Keep bars above grid lines / axes if needed
    d3.selectAll('.bar').raise();

    // EXIT: animate bars out
    bars.exit().transition().duration(500)
      .attr('y', y_scale_left(0))
      .attr('height', 0)
      .remove();

    // Update x-axis label text to reflect current variable
    x_label_left.text(getDisplayLabel(selected_variable));

    // -------------------------------------------
    // RIGHT CHART: build stacked data per year
    // -------------------------------------------
    const countsMap = d3.rollup(
      data,
      v => v.length,
      d => d.year,
      d => d[selected_variable]
    );

    // Extract, sort the list of years available in the nested rollup map so we can iterate chronologically.
    const yearsRaw = Array.from(countsMap.keys()).sort();
    const counts_right = yearsRaw.map(year => {
      const selectedVariableMap = countsMap.get(year);
      const entry = { year };
      keys.forEach(k => { entry[k] = selectedVariableMap?.get(k) || 0; });
      return entry;
    });

    // Convert the wide (object-per-year) form into a flat array of valid years and gather min/max for filling gaps.
    const years = counts_right.map(d => d.year).filter(y => y && y >= 1900 && y <= 2100);
    const year_start = d3.min(years);
    const year_end = d3.max(years);
    const all_years = rangeInclusive(year_start, year_end);

    // Domain covers every year in continuous range (even if some have zero counts)
    x_scale_right.domain(all_years);
    y_scale_right.domain([0, d3.max(counts_right, d => d3.sum(keys, k => d[k]))]);

    // Animate the bottom (year) axis to reflect the possibly updated set of years.
    x_axis_group_right.transition().duration(500).call(d3.axisBottom(x_scale_right));

    // Compute integer y ticks for right chart and draw faint horizontal grid lines at those levels.
    const whole_ticks_right = y_scale_right.ticks().filter(d => Number.isInteger(d));
    whole_ticks_right.forEach(tick => {
      right_plot.append('line')
        .attr('class', 'gridLine')
        .attr('x1', 0).attr('x2', PLOT_WIDTH)
        .attr('y1', y_scale_right(tick))
        .attr('y2', y_scale_right(tick))
        .attr('stroke', 'lightgray')
        .attr('stroke-width', 1)
        .attr('opacity', 0.5);
    });

    // Animate the right y-axis to reflect new stacked totals scale.
    y_axis_group_right.transition().duration(500)
      .call(d3.axisLeft(y_scale_right).tickValues(whole_ticks_right).tickFormat(d => d));

    // Use d3.stack to transform counts_right into layered series arrays: one per category key.
    const stacked_data = d3.stack().keys(keys)(counts_right);

    // Clear existing right bars before drawing new stack
    d3.selectAll('.rightBar').remove();

    // Bind stacked series groups, then bind each series's segment data to <rect> elements to render the stacked bars.
    right_plot.append('g')
      .selectAll('g')
      .data(stacked_data)
      .join('g')
      .attr('fill', d => color(d.key))
      .attr('class', 'stack-segment') // styling (e.g., opacity) handled in CSS
      .selectAll('rect')
      .data(d => d)
      .join('rect')
      .attr('x', d => x_scale_right(d.data.year))
      .attr('y', d => y_scale_right(d[1]))
      .attr('height', d => y_scale_right(d[0]) - y_scale_right(d[1]))
      .attr('width', x_scale_right.bandwidth())
      .attr('class', 'rightBar');


    // ----- LEGEND (HTML-based for wrapping flexibility) -----
    const legendKeys = stacked_data.map(d => d.key);

    // Clear existing legend items
    rightPlotLegendContainer.selectAll('*').remove();

    // Create a new legend container
    const legendDiv = rightPlotLegendContainer
      .attr('class', 'legend-html-container')
      .append('div')
      .attr('class', 'legend-items');

    // Join legend item placeholders (one per category/color) using HTML flex layout for wrapping.
    const legendItems = legendDiv.selectAll('div.legend-item')
      .data(legendKeys)
      .join('div')
      .attr('class', 'legend-item');

    // Append the colored square swatch for each legend item.
    legendItems.append('span')
      .attr('class', 'legend-swatch')
      .style('background-color', d => color(d));

    // Append the text label (category name) for each legend item.
    legendItems.append('span')
      .attr('class', 'legend-label')
      .text(d => d);


    // ----- BRUSH (year-range selection) -----
    const brush = d3.brushX().extent([[0, 0], [PLOT_WIDTH, PLOT_HEIGHT]]).on('brush end', brushed);

    // Create a brush interaction layer covering the right plot area and attach event handlers.
    right_plot.append('g').attr('class', 'brush').call(brush);

    // Brush handler: converts pixel selection into a list of years, filters the dataset to that year range,
    // and redraws the left (category) chart to show counts only within the brushed years.
    function brushed({ selection }) {
      // If brush cleared, reset to full dataset
      if (!selection) {
        updatePlots(selected_variable);
        filteredByElement.classList.remove('visible');
        return;
      }

      // Remove previous left grid lines (they will be recreated)
      d3.selectAll('.gridLineLeft').remove();

      // Translate the pixel selection bounds (x0,x1) into the set of year domain values whose bands intersect that range.
      const [x0, x1] = selection;
      const domain = x_scale_right.domain();
      const brushed_values = domain.filter(d => {
        const bandStart = x_scale_right(d);
        const bandEnd = bandStart + x_scale_right.bandwidth();
        return bandEnd >= x0 && bandStart <= x1;
      });

      const brushed_values_numeric = brushed_values.map(v => +v);

      // Determine first and last year inside the brush to show as an inclusive range in the UI label.
      const minYear = brushed_values_numeric[0];
      const maxYear = brushed_values_numeric[brushed_values_numeric.length - 1];

      filteredByElement.classList.add('visible');
      filter_text.text(`${minYear} - ${maxYear}`); // update filter label

      // Subset data to brushed range
      const brushed_data = data.filter(d => d.year >= minYear && d.year <= maxYear);
      const countsRollBrushed = d3.rollup(brushed_data, v => v.length, d => d[selected_variable]);
      const counts_left_b = Array.from(countsRollBrushed, ([key, value]) => ({ category: key, count: value }));

      // Update scales
      x_scale_left.domain(counts_left_b.map(d => d.category));
      y_scale_left.domain([0, d3.max(counts_left_b, d => d.count)]);

      // Redraw axes & re-wrap
      x_axis_group_left
        .transition()
        .duration(500)
        .call(d3.axisBottom(x_scale_left))
        .on('end', wrapLeftXAxisTicks);

      // Compute integer tick marks for the brushed subset y-scale.
      const whole_ticks_left_b = y_scale_left.ticks().filter(d => Number.isInteger(d));
      y_axis_group_left.transition().duration(500)
        .call(d3.axisLeft(y_scale_left).tickValues(whole_ticks_left_b).tickFormat(d => d));

      // Grid lines for brushed state
      whole_ticks_left_b.forEach(tick => {
        left_plot.append('line')
          .attr('class', 'gridLineLeft')
          .attr('x1', 0).attr('x2', PLOT_WIDTH)
          .attr('y1', y_scale_left(tick))
          .attr('y2', y_scale_left(tick))
          .attr('stroke', 'lightgray')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5);
      });

      // Data join for brushed subset bars
      const bars_b = left_plot.selectAll('.bar').data(counts_left_b, d => d.category);
      const tooltip = d3.select('#vis-tooltip');

      // Create entering bars for new categories (if any) in the brushed subset with initial zero height for animation.
      const barsBEnter = bars_b.enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x_scale_left(d.category))
        .attr('y', y_scale_left(0))
        .attr('width', x_scale_left.bandwidth())
        .attr('height', 0)
        .attr('role', 'img')
        .attr('aria-label', d => `${getDisplayLabel(selected_variable)} ${d.category}: ${d.count}`)
        .style('fill', d => color(d.category))
        .style('opacity', 0.9)
        .on('mousemove', (event) => {
          // Update tooltip position based on mouse movement
          tooltip
            .style('left', (event.pageX + 12) + 'px')
            .style('top', (event.pageY + 12) + 'px');
        })
        .on('mouseover', (event, d) => {
          // Show tooltip with category and count
          tooltip
            .html(`<strong>${d.category}</strong><br/>Count: ${d.count}`)
            .transition().duration(150).style('opacity', 1);
        })
        .on('mouseout', () => {
          // Hide tooltip on mouse out
          tooltip.transition().duration(150).style('opacity', 0);
        });

      // Merge enter and update selections
      barsBEnter.merge(bars_b)
        .transition().duration(500)
        .attr('x', d => x_scale_left(d.category))
        .attr('y', d => y_scale_left(d.count))
        .attr('width', x_scale_left.bandwidth())
        .attr('height', d => PLOT_HEIGHT - y_scale_left(d.count));

      // Raise bars above grid lines
      d3.selectAll('.bar').raise();

      // Fade out and remove exited bars
      bars_b.exit().transition().duration(500).attr('height', 0).remove();
    }
  }

  // Initial render using default variable
  updatePlots(defaultVariable);

  // Ensure wrapping logic runs (in case transition timing prevents immediate measurement)
  setTimeout(wrapLeftXAxisTicks, 600);

  // -----------------------------------------------------------------------
  // RESPONSIVE: Handle window resize with debounce
  // -----------------------------------------------------------------------
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Event handler for window resize
  const handleResize = debounce(() => {
    const newWidth = computeContainerWidth();
    if (!newWidth || newWidth === width) return; // no change

    width = newWidth;

    // Recompute plot width
    let newPlotWidth = (width - plotSpacing - margin.left - margin.right) / 2;
    if (newPlotWidth <= 0) {
      width = Math.max(width, 800);
      newPlotWidth = (width - plotSpacing - margin.left - margin.right) / 2;
    }
    PLOT_WIDTH = newPlotWidth;

    // Update SVG width & scale ranges
    d3.select('#vis-svg').attr('width', width);

    // Update ranges
    x_scale_left.range([0, PLOT_WIDTH]);
    x_scale_right.range([0, PLOT_WIDTH]);
    // Update group positions
    right_plot.attr('transform', `translate(${margin.left + plotSpacing + PLOT_WIDTH}, ${margin.top})`);

    // Recenter x-axis labels
    x_label_left.attr('x', PLOT_WIDTH / 2);
    right_plot.select('.year-label').attr('x', PLOT_WIDTH / 2);

    // Redraw with current variable selection
    const currentVar = (variableSelect && variableSelect.value) || defaultVariable;
    updatePlots(currentVar);
  }, 150);

  // Attach resize event listener
  window.addEventListener('resize', handleResize);
}

// Expose initializer globally so external scripts can trigger it
window.initDeploymentsVis = initDeploymentsVis;
