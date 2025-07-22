
// Set up dimensions for the plots
const margin = { top: 45, right: 30, bottom: 40, left: 50 },
      width = 1000,
      height = 400;

//Set up SVG container for the plots
const svg = d3.select("#vis-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("id", "vis-svg");

const plotSpacing = 150; // Space between left and right plots

const leftPlotWidth = (width / 2) - plotSpacing / 2 - margin.right;
const leftPlotXStart = margin.left;

// Colors for plots. Taken from the Tableau 10 color palette
const tableau_blue = "#4e79a7",
      tableau_orange = "#f28e2b",
      tableau_gray = "#767676";

const leftDropdownVariableMapping = [
  {name: "overall", displayName: "Overall"},
  {name: "tier", displayName: "Tier" },
  {name: "curator_type", displayName: "Curator type"},
  {name: "deployment_model", displayName: "Deployment model"},
  {name: "flavor", displayName: "Flavor"},
  {name: "data_product", displayName: "Data product"}
]

const mainCarousel = document.querySelector('#mainCarousel');
const svgElement = document.getElementById('vis-svg');
var svgRect,
    svgStartX;

const leftDropdownLabel = d3.select("#vis-container")
    .append("label")
    .attr("for", "leftDropdown") // Associate the label with the dropdown (via the 'for' attribute)
    .text("Select a variable to visualize:") // Text for the label
    .style("position", "absolute") // Position it absolutely relative to the container
    .style("left", svgStartX + leftPlotXStart + "px")
    .style("top", height + "px")

let leftFilterText,
    rightFilterText;

let brushedSelection = null; // global variable for the brushed selection on the leftPlot
let clickedBars = []; // global variable for the clicked bars on the rightPlot

// Load the CSV data
d3.csv("data-for-vis.csv").then(data => {

  // Parse the date variable and extract the year
  data.forEach(d => {
    d.date = d3.timeParse("%Y")(d.date);
    d.year = d.date.getFullYear();
  });

  // Group the data by year and count the records for the left plot
  const yearCounts = d3.rollups(
    data,
    v => v.length,
    d => d.year
  );

  yearCounts.sort((a,b) => d3.ascending(a[0], b[0]));

  // Extract deployment_model and count categories for the right plot
  const categoryCounts = d3.rollups(
    data,
    v => v.length,
    d => d.deployment_model
  );

  

  const leftDropdown = d3.select("#vis-container") 
  .append("select")
  .attr("id", "leftDropdown")
  .style("position", "absolute")
  .style("left", svgStartX + leftPlotXStart + 200 + "px")
  .style("top", height + "px")
  .on("change", function () {
      leftSelectedVariable = d3.select(this).property("value"); // Get the selected variable
      updateLeftPlot(leftSelectedVariable, firstLoad=false);
  });

  leftDropdown.selectAll("option")
  .data(leftDropdownVariableMapping) // Replace with your variable names
  .enter()
  .append("option")
  .attr("value", d => d.name)
  .text(d => d.displayName);

  leftDropdown.property("value", "overall"); // Set overall as default

  window.addEventListener("resize", updateDropdownPosition);


    // Function to update the dropdown's position dynamically when screen size changes
function updateDropdownPosition() {
  var svgRect = svgElement.getBoundingClientRect();
  // Extract the starting point (top-left corner)
  var svgStartX = svgRect.left; // X-coordinate (horizontal)

  // Set the dropdown's position
  rightDropdown
    .style("left", svgStartX + rightPlotXStart + 200 + "px")
    .style("top", height + "px")
  
  rightDropdownLabel
    .style("left", svgStartX + rightPlotXStart + "px")
    .style("top", height + "px")
  
  // rightFilterText
  //   .attr("x", svgStartX + rightPlotXStart)
  //   .attr("y", 20)

  leftDropdown
    .style("left", svgStartX + leftPlotXStart + 200 + "px")
    .style("top", height + "px")

  leftDropdownLabel
    .style("left", svgStartX + leftPlotXStart + "px")
    .style("top", height + "px")

}


// NEW CODE FOR LEFT PLOT (begin)

let leftSelectedVariable = document.getElementById("leftDropdown").value;


const updateLeftPlot = (variable, firstLoad) => {
 
  d3.selectAll(".leftPlot").remove();  // Clear existing plots

  if (clickedBars.length > 0) {
    const variableToFilterOn = document.getElementById("rightDropdown").value;

    var filteredData = data.filter(d => clickedBars.includes(d[variableToFilterOn]));
    var groupedData = d3.group(filteredData, d => d[variable], d => d.year);

    // Make sure that if there are categories in variable that are not in filteredData, they are still represented in groupedData
    // This way, there will be a plot for each category even if it's empty
    var allCategories = new Set(data.map(d => d[variable]));
    allCategories.forEach(category => {
      if( !groupedData.has(category)) {
        groupedData.set(category, new Map());
      }
    });

  } else {
    var groupedData = d3.group(data, d => d[variable], d => d.year);
  }
  
  var groupsWithTotals = Array.from(groupedData.keys()).map(group => {
    const totalInstances = Array.from(groupedData.get(group))
        .reduce((sum, [year, values]) => sum + values.length, 0);
    return { group, totalInstances };
  });

  // Sort groups alphabetically so they appear on screen alphabetically
  groupsWithTotals.sort((a, b) => d3.ascending(a.group, b.group)); 

  // Calculate global x and y ranges
  const years = Array.from(new Set(data.map(d => +d.year)));
  const globalXRange = d3.extent(years); // Global year range
  
  if(clickedBars.length > 0 ){
    var globalYMax = d3.max(filteredData, d => groupedData.get(d[variable]).get(d.year).length); // Maximum count across all groups
  } else {
    var globalYMax = d3.max(data, d => groupedData.get(d[variable]).get(d.year).length); // Maximum count across all groups
  }

  // Set dimensions
  const totalHeight = height;
  const plotSpacing = 50;
  const plotHeight = (totalHeight - (groupsWithTotals.length - 1) * plotSpacing - margin.top - margin.bottom) / groupsWithTotals.length;
  //const width = 600 - margin.left - margin.right; // leftPlotWidth

  const leftPlot = svg.append("g");

  // Left plot y-axis label
  leftPlot.append("text")
          .attr("transform", `rotate(-90)`)
          .attr("class", "leftPlot visText")
          .attr("x", -(totalHeight / 2))
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .text("Number of deployments");

  // Left plot x-axis label
  leftPlot.append("text")
    .attr("x", (leftPlotWidth + margin.left + margin.right) / 2)
    .attr("y", height - margin.bottom + 30)
    .attr("text-anchor", "middle")
    .attr("class", "leftPlot visText")
    .text("Year");

    const xScaleLeft = d3.scaleLinear()
      .domain(globalXRange)
      .range([0, leftPlotWidth]);

    const yScaleLeft = d3.scaleLinear()
      .domain([0, globalYMax])
      .range([plotHeight, 0]); 
    
    const yTicksLeft = yScaleLeft.ticks();

    groupsWithTotals.forEach((groupObj, i) => {
  
      const dataArray = Array.from(groupedData.get(groupObj.group), ([year, values]) => ({
          year: +year,
          count: values.length
      })).sort((a, b) => a.year - b.year);

      const g = svg.append("g")
          .attr("id", `leftPlot_${i}`)
          .attr("class", "leftPlot")
          .attr("transform", `translate(${margin.left}, ${margin.top + i * (plotHeight + plotSpacing)})`);

      // Add y-axis with whole number ticks only (rendered first)
      g.append("g")
          .call(d3.axisLeft(yScaleLeft)
              .ticks(globalYMax)
              .tickFormat(d => Number.isInteger(d) ? d : ""))
          .attr("class","leftPlot visText leftPlotYAxis");

      yTicksLeft.forEach(tick => {
        g.append("line")
          .attr("class", `leftPlot leftPlotGridLine_${i} leftPlotGridLine`)
          .attr("x1", 0)
          .attr("x2", leftPlotWidth)
          .attr("y1", yScaleLeft(tick))
          .attr("y2", yScaleLeft(tick))
          .attr("stroke", "lightgray")
          .attr("stroke-width", 1)
          .attr("opacity", 0.5)
      })

      // Add x-axis for all plots (rendered second)
      const xAxis = g.append("g")
          .attr("transform", `translate(0,${plotHeight})`)
          .call(d3.axisBottom(xScaleLeft).ticks(5).tickFormat(d3.format("d")))
          .attr("font-size", "10px")
          .attr("class", "leftPlot visText");

      // Remove x-axis labels for all plots except the bottommost one
      if (i !== groupsWithTotals.length - 1) {
          xAxis.selectAll("text").remove();
      }

      g.append("path")
          .datum(dataArray)
          .attr("fill", "none")
          .attr("stroke", tableau_blue)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.7)
          .attr("d", d3.line()
              .x(d => xScaleLeft(d.year))
              .y(d => yScaleLeft(d.count))
          )
          .attr("class", `leftPlot leftPlotLine_${i}`);

      // Add the dots (rendered after axes)
      g.selectAll("circle")
          .data(dataArray)
          .enter()
          .append("circle")
          .attr("fill", tableau_blue)
          .attr("opacity", 0.7)
          .attr("cx", d => xScaleLeft(d.year))
          .attr("cy", d => yScaleLeft(d.count))
          .attr("r", 3)
          .attr("class", `leftPlot leftPlotCircle_${i}`);

      // Add category label
      if(variable !== "overall"){ // Only add category label when *not* showing overall counts
        g.append("text")
          .attr("x", svgStartX + leftPlotXStart)
          .attr("y", -7)
          .text(`${groupObj.group}`)
          .attr("class", "leftPlot visText");
      }

    if (firstLoad == true) {
      // Add brush to left plot upon first load
      const brush = d3.brushX()
        .extent([[margin.left, margin.top], [margin.left + leftPlotWidth, height - margin.bottom]])
        .on("brush end", brushed);

      leftPlot.append("g")
          .attr("class", "brush")
          .call(brush);

      // Add "Not filtered" text above plot
      const svgRect = svgElement.getBoundingClientRect(),
            svgStartX = svgRect.left; // X-coordinate (horizontal)

      leftFilterText = leftPlot
        .append("text")
        .attr("x", svgStartX + leftPlotXStart)
        .attr("y", 20)
        .text("Not filtered")
        .style("font-size", 12)
        .style("fill", tableau_gray);
    }

  });


}


updateLeftPlot(leftSelectedVariable, firstLoad=true);

// NEW CODE FOR LEFT PLOT (end)
    
});