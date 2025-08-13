// In the spirit of transparency and attribution (to the extent possible, and without formal guidance on how to do so in this context), this code was written
// with assistance from code generation tools, like ChatGPT and Copilot. The code was not written through "vibe coding." Rather, I referenced these tools for solutions 
// to intermediate problems along the way.

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

// Set up dimensions for the plots
const vis_container_width = document.getElementById('registryDiv').clientWidth;

const margin = { top: 50, right: 50, bottom: 50, left: 90 },
      width = vis_container_width, // Set width according to parent div width
      height = 350,
      plot_spacing = 70,
      dropdown_height = 50; // Space between left and right plots

//Set up SVG container for the plots
const svg = d3.select("#vis-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height + dropdown_height)
  .attr("id", "vis-svg");

const DROPDOWN_VARIABLE_MAPPING = [
  {name: "flavor_vis", displayName: "Flavor"},
  {name: "sector", displayName: "Sector"},
  {name: "region", displayName: "Region"},
  {name: "tier", displayName: "Tier" },
  {name: "deployment_model_vis", displayName: "Deployment model"},
  {name: "data_product_type", displayName: "Data product type"},
  {name: "is_many_release", displayName: "Release type"},
  {name: "is_interactive", displayName: "Access type"},
  {name: "is_dynamic", displayName: "Data source"}
]

const DROPDOWN_LABEL = d3.select("#vis-container")
    .append("label")
    .attr("for", "dropdown")
    .text("Select a variable to visualize:")
    .style("font-weight", "bold")
    .style("position", "absolute")
    .style("left", margin.right + "px")
    .style("top", 20 + "px")

const DEFAULT_VARIABLE = "data_product_type";

const PLOT_WIDTH = (width - plot_spacing - margin.left - margin.right)/2,
      PLOT_HEIGHT = height - margin.top - margin.bottom;


d3.csv("data.csv").then(data => {

  data.forEach(d => {
    d.tier = d.tier.toString();
  });

  // SET UP RIGHT PLOT DROPDOWN
  const DROPDOWN = d3.select("#vis-container")
    .append("select")
    .attr("id", "dropdown")
    .style("position", "absolute")
    .style("left", margin.left + 160 + "px")
    .style("top", 20 + "px")
    .on("change", function () {
        var selected_variable = d3.select(this).property("value");
        filter_text.text("Not filtered");
        update_plots_fn(selected_variable);
    });

  DROPDOWN.selectAll("option")
      .data(DROPDOWN_VARIABLE_MAPPING) // Add variable options to right plot dropdown
      .enter()
      .append("option")
      .attr("value", d => d.name)
      .text(d => d.displayName);

  DROPDOWN.property("value", DEFAULT_VARIABLE);

  var left_plot = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top + 25})`);

  var x_scale_left = d3.scaleBand().padding(0.2).range([0, PLOT_WIDTH]),
      y_scale_left = d3.scaleLinear().range([PLOT_HEIGHT, 0]);

  var x_axis_group_left = left_plot.append("g")
    .attr("transform", `translate(0, ${PLOT_HEIGHT})`);

  var y_axis_group_left = left_plot.append("g");

  var x_label_left = left_plot.append("text")
    .attr("text-anchor", "middle")
    .attr("x", PLOT_WIDTH/2)
    .attr("y", PLOT_HEIGHT + 40)
    .text("Flavor");
  
  left_plot.append("text")
        .attr("transform", `rotate(-90)`)
        // .attr("class", "visText")
        .attr("x", -(PLOT_HEIGHT / 2))
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .text("Number of deployments");

  filter_text = left_plot
      .append("text")
      .attr("class", "filterText visText")
      .attr("x", 0)
      .attr("y", -10)
      .text("Not filtered")
      .style("fill", "gray")
      .style("position", "absolute");

  // Prepare scales for the right plot

  var right_plot = svg.append("g")
    .attr("transform", `translate(${margin.left + plot_spacing + PLOT_WIDTH}, ${margin.top + 25})`);

  x_scale_right = d3.scaleBand().padding(0.2).range([0, PLOT_WIDTH]); // Make this a global variable so we can access it later.
  var y_scale_right = d3.scaleLinear().range([PLOT_HEIGHT, 0]);

  var x_axis_group_right = right_plot.append("g")
    .attr("transform", `translate(0, ${PLOT_HEIGHT})`);

  var y_axis_group_right = right_plot.append("g");

  right_plot.append("text")
    .attr("text-anchor", "middle")
    .attr("x", PLOT_WIDTH/2)
    .attr("y", PLOT_HEIGHT + 40)
    .text("Year");
  
  function update_plots_fn(selected_variable){
    d3.selectAll(".gridLine").remove();
    d3.selectAll(".gridLineLeft").remove();
    d3.selectAll(".brush").remove();
    d3.selectAll(".legend").remove();

    var keys = Array.from(new Set(data.map(d => d[selected_variable])));
  
    var color = d3.scaleOrdinal()
      .domain(keys)
      .range(TABLEAU10);

    // Left plot (bar chart) BEGIN

    var counts_left = d3.rollup(data,
      v => v.length,
      d => d[selected_variable]);

    var counts_left = Array.from(counts_left, ([key, value]) => ({ category: key, count: value }));

    x_scale_left.domain(counts_left.map(d => d.category));
    y_scale_left.domain([0, d3.max(counts_left, d => d.count)]);

    x_axis_group_left
      .transition()
      .duration(500)
      .call(d3.axisBottom(x_scale_left));
    
    var whole_ticks_left = y_scale_left.ticks().filter(d => Number.isInteger(d));
    
    y_axis_group_left
      .transition()
      .duration(500)
      .call(
        d3.axisLeft(y_scale_left)
          .tickValues(whole_ticks_left) // Only show whole-number ticks
          .tickFormat(d => d)
      );

    whole_ticks_left.forEach(tick => {
        left_plot.append("line")
              .attr("class", `gridLineLeft`)
              .attr("x1", 0)
              .attr("x2", PLOT_WIDTH)
              .attr("y1", y_scale_left(tick))
              .attr("y2", y_scale_left(tick))
              .attr("stroke", "lightgray")
              .attr("stroke-width", 1)
              .attr("opacity", 0.5)
      })

    var bars = left_plot.selectAll(".bar").data(counts_left, d => d.category);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x_scale_left(d.category))
        .attr("y", y_scale_left(0))
        .attr("width", x_scale_left.bandwidth())
        .attr("height", 0)
        .style("fill", d => color(d.category))
        .style("opacity", 0.8)
      .merge(bars)
        .transition()
        .duration(500)
        .attr("x", d => x_scale_left(d.category))
        .attr("y", d => y_scale_left(d.count))
        .attr("width", x_scale_left.bandwidth())
        .attr("height", d => PLOT_HEIGHT - y_scale_left(d.count));

    d3.selectAll(".bar").raise();

    bars.exit()
        .transition()
        .duration(500)
        .attr("y", y_scale_left(0))
        .attr("height", 0)
        .remove();

    var temp = DROPDOWN_VARIABLE_MAPPING.find(
      item => item.name === selected_variable
    )?.displayName;
    
    x_label_left.text(temp);

    // Left plot (bar chart) END

    // Right plot (stacked bar chart) BEGIN
    var keys = Array.from(new Set(data.map(d => d[selected_variable])));

    // Group and count entries by year, selected var
    var countsMap = d3.rollup(
      data,
      v => v.length,
      d => d.year,
      d => d[selected_variable]
    );

    var years = Array.from(countsMap.keys()).sort();
    var counts_right = years.map(year => {
      var selectedVariableMap = countsMap.get(year);
      const entry = { year };
      keys.forEach(selected_variable => {
        entry[selected_variable] = selectedVariableMap?.get(selected_variable) || 0;
      });
      return entry;
    });

    var years = counts_right.map(d => d.year);
    var year_start = d3.min(years);
    var year_end = d3.max(years);

    var all_years = [];
    for (let y = year_start; y <= year_end; y++) {
      all_years.push(y);
    }

    x_scale_right.domain(all_years.map(String));
    y_scale_right.domain([0, d3.max(counts_right, d => d3.sum(keys, k => d[k]))]);

    x_axis_group_right
      .transition()
      .duration(500)
      .call(d3.axisBottom(x_scale_right));

    var whole_ticks_right = y_scale_right.ticks().filter(d => Number.isInteger(d));

    whole_ticks_right.forEach(tick => {
        right_plot.append("line")
              .attr("class", `gridLine`)
              .attr("x1", 0)
              .attr("x2", PLOT_WIDTH)
              .attr("y1", y_scale_right(tick))
              .attr("y2", y_scale_right(tick))
              .attr("stroke", "lightgray")
              .attr("stroke-width", 1)
              .attr("opacity", 0.5)
      })
    
    y_axis_group_right
      .transition()
      .duration(500)
      .call(
        d3.axisLeft(y_scale_right)
          .tickValues(whole_ticks_right) // Only show whole-number ticks
          .tickFormat(d => d)
      );

    // Stack the data
    var stacked_data = d3.stack().keys(keys)(counts_right);

    d3.selectAll(".rightBar").remove();

    right_plot.append("g")
      .selectAll("g")
      .data(stacked_data)
      .join("g")
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.8)
      .selectAll("rect")
      .data(d => d)
      .join("rect")
        .attr("x", d => x_scale_right(d.data.year))
        .attr("y", d => y_scale_right(d[1]))
        .attr("height", d => y_scale_right(d[0]) - y_scale_right(d[1]))
        .attr("width", x_scale_right.bandwidth())
        .attr("class", "rightBar");

    var legend = right_plot.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${PLOT_WIDTH - 80}, ${0})`);

    var legendItems = legend.selectAll("g")
      .data(stacked_data.map(d => d.key))
      .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 15})`);

    legendItems.append("rect")
      .attr("x", 0)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", d => color(d));

    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 8)
      .text(d => d)
      .style("font-size", "10px");

    // Right plot (stacked bar chart) END

    // Add brushing behavior on right plot

    var brush = d3.brushX()
      .extent([[0, 0], [PLOT_WIDTH, PLOT_HEIGHT]])
      .on("brush end", brushed);

    right_plot.append("g")
          .attr("class", "brush")
          .call(brush);

    function brushed({selection}) {

      if (!selection) {
        // If no years are selected, reset plots.
        update_plots_fn(selected_variable);
        filter_text.text("Not filtered");
        return;
      }

      d3.selectAll(".gridLineLeft").remove();

      var [x0, x1] = selection;

      const domain = x_scale_right.domain();

      // Get all domain values whose bands intersect the brush extent
      const brushed_values = domain.filter(d => {
          const bandStart = x_scale_right(d);
          const bandEnd = bandStart + x_scale_right.bandwidth();
          return bandEnd >= x0 && bandStart <= x1;
      });

      
      brushed_values_numeric = brushed_values.map(d => +d);
     
      filter_text.text(`Filtered by: ${brushed_values_numeric.slice(0,1)} - ${brushed_values_numeric.slice(-1)}`);

      var brushed_data = data.filter(d => d.year >= brushed_values_numeric.slice(0,1) && d.year <= brushed_values_numeric.slice(-1));

      var counts_left = d3.rollup(brushed_data,
      v => v.length,
      d => d[selected_variable]);

      var counts_left = Array.from(counts_left, ([key, value]) => ({ category: key, count: value }));

      x_scale_left.domain(counts_left.map(d => d.category));
      y_scale_left.domain([0, d3.max(counts_left, d => d.count)]);

      x_axis_group_left
        .transition()
        .duration(500)
        .call(d3.axisBottom(x_scale_left));
    
      var whole_ticks_left = y_scale_left.ticks().filter(d => Number.isInteger(d));
    
      y_axis_group_left
        .transition()
        .duration(500)
        .call(
          d3.axisLeft(y_scale_left)
            .tickValues(whole_ticks_left) // Only show whole-number ticks
            .tickFormat(d => d)
        );

      whole_ticks_left.forEach(tick => {
          left_plot.append("line")
                .attr("class", `gridLineLeft`)
                .attr("x1", 0)
                .attr("x2", PLOT_WIDTH)
                .attr("y1", y_scale_left(tick))
                .attr("y2", y_scale_left(tick))
                .attr("stroke", "lightgray")
                .attr("stroke-width", 1)
                .attr("opacity", 0.5)
        })

      var bars = left_plot.selectAll(".bar").data(counts_left, d => d.category);

      bars.enter().append("rect")
          .attr("class", "bar")
          .attr("x", d => x_scale_left(d.category))
          .attr("y", y_scale_left(0))
          .attr("width", x_scale_left.bandwidth())
          .attr("height", 0)
          .style("fill", d => color(d.category))
          .style("opacity", 0.9)
        .merge(bars)
          .transition()
          .duration(500)
          .attr("x", d => x_scale_left(d.category))
          .attr("y", d => y_scale_left(d.count))
          .attr("width", x_scale_left.bandwidth())
          .attr("height", d => PLOT_HEIGHT - y_scale_left(d.count));

      d3.selectAll(".bar").raise();

      bars.exit()
          .transition()
          .duration(500)
          .attr("height", 0)
          .remove();

    }
    

  };

  update_plots_fn(DEFAULT_VARIABLE);
  


});
