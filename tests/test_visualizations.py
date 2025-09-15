from playwright.sync_api import Page, expect
from pathlib import Path
import re


bp = "BREAKPOINT()".lower()
if bp in Path(__file__).read_text(encoding='utf-8'):
    raise Exception(
        f"Instead of `{bp}`, use `page.pause()` in playwright tests. "
        "See https://playwright.dev/python/docs/debug"
        "#run-a-test-from-a-specific-breakpoint"
    )

def setup_page(page: Page):
    """Navigate to the deployments registry page before each test."""
    # Navigate to deployments registry page
    page.goto("http://localhost:4000/deployments-registry/")

    # Wait for page to be ready
    expect(
        page.get_by_role("heading", name="Deployments Registry")
    ).to_be_visible()


# ===========================================================
# registry page loads correctly with visualizations button
# ===========================================================
def test_registry_page_loads_correctly(page: Page):
    setup_page(page)

    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_container = page.locator("div#visualizations-container")
    visualizations_svg = page.locator("svg#vis-svg")

    # ----------------------------------------
    # visualizations button should be visible
    # ----------------------------------------
    expect(
        visualizations_button
    ).to_be_visible()

    # ----------------------------------------
    # visualizations should be hidden on load
    # ----------------------------------------
    expect(visualizations_container).not_to_be_visible()
    expect(visualizations_svg).not_to_be_visible()


# ===========================================================
# visualizations components render correctly
# ===========================================================
def test_visualizations_components_render_correctly(page: Page):
    setup_page(page)

    # open visualizations
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_button.click()

    # Elements
    visualizations_container = page.locator("div#visualizations-container")
    visualizations_svg = page.locator("svg#vis-svg")

    # -------------
    # svg visible?
    # -------------
    expect(
        visualizations_svg
    ).to_be_visible()

    # ------------------------------------
    # check x & y-axis labels are present
    # ------------------------------------
    # left plot
    left_plot_x_axis_label = visualizations_svg.locator("text#left-plot-x-axis-label")
    left_plot_y_axis_label = visualizations_svg.locator("text#left-plot-y-axis-label")
    expect(left_plot_x_axis_label).to_be_visible()
    expect(left_plot_x_axis_label).to_have_text("data product type", ignore_case=True)
    expect(left_plot_y_axis_label).to_be_visible()
    expect(left_plot_y_axis_label).to_have_text("number of deployments", ignore_case=True)

    # right plot
    right_plot_x_axis_label = visualizations_svg.locator("text#right-plot-x-axis-label")
    right_plot_y_axis_label = visualizations_svg.locator("text#right-plot-y-axis-label")
    expect(right_plot_x_axis_label).to_be_visible()
    expect(right_plot_x_axis_label).to_have_text("year", ignore_case=True)
    expect(right_plot_y_axis_label).to_be_visible()
    expect(right_plot_y_axis_label).to_have_text("number of deployments", ignore_case=True)

    # --------------------------------------------------
    # check both right & left plots should not be empty
    # --------------------------------------------------
    left_plot = visualizations_svg.locator("g#left-plot-group")
    left_plot_bars = left_plot.locator("rect.bar")
    expect(left_plot_bars).not_to_have_count(0)

    right_plot = visualizations_svg.locator("g#right-plot-group")
    right_plot_bars = right_plot.locator("rect.rightBar")
    expect(right_plot_bars).not_to_have_count(0)

    # --------------------------------
    # check right plots legend exists
    # --------------------------------
    right_plot_legend = visualizations_container.locator("div#right-plot-legend-container")
    expect(right_plot_legend).to_be_visible()
    legend_items = right_plot_legend.locator("div.legend-item")
    expect(legend_items).not_to_have_count(0)


# ======================================
# left plot bars show tooltip on hover?
# ======================================
def test_left_plot_tooltip_functionality(page: Page):
    setup_page(page)

    # open visualizations
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_button.click()

    # Elements
    visualizations_svg = page.locator("svg#vis-svg")
    left_plot = visualizations_svg.locator("g#left-plot-group")
    left_plot_bars = left_plot.locator("rect.bar")

    # first bars label
    left_plot_x_axis = left_plot.locator("g#left-plot-x-axis")
    left_plot_x_axis_ticks = left_plot_x_axis.locator("g.tick")
    first_tick = left_plot_x_axis_ticks.first

    # Get all <text> elements of the first tick and join their text
    text_elements = first_tick.locator("text")
    first_tick_label = " ".join([text_elements.nth(i).text_content().strip() for i in range(text_elements.count())])

    # Hover over the first bar in the left plot
    first_left_bar = left_plot_bars.first
    first_left_bar.hover()

    # Check that the tooltip appears with correct content
    tooltip = page.locator("div#vis-tooltip")
    expect(tooltip).to_be_visible()
    expect(tooltip).to_have_text(re.compile(rf".*{first_tick_label}.*"))


# ===================
# on variable change
# ===================
def test_dropdown_variable_change_setup(page: Page):
    setup_page(page)

    # open visualizations
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_button.click()

    # Elements
    visualizations_container = page.locator("div#visualizations-container")
    variable_dropdown = visualizations_container.locator("div.custom-select#variable-dropdown")
    visualizations_svg = page.locator("svg#vis-svg")
    left_plot = visualizations_svg.locator("g#left-plot-group")
    right_plot = visualizations_svg.locator("g#right-plot-group")

    # ---------------------
    # trigger should exist
    # ---------------------
    # get trigger
    variable_dropdown_trigger = variable_dropdown.locator("div.custom-select-trigger")
    expect(variable_dropdown_trigger).to_be_attached()

    # click trigger
    variable_dropdown_trigger.click()

    # ----------------
    # select "region"
    # ----------------
    variable_dropdown_options_popover = page.locator("div.custom-select-options")
    expect(variable_dropdown_options_popover).to_be_visible()
    region_option = variable_dropdown_options_popover.locator("div.custom-select-option").filter(has_text="region")
    expect(region_option).to_be_visible()
    region_option.click()

    # -------------------------
    # confirm variable changed
    # -------------------------
    # check select value
    expect(
        variable_dropdown.locator("span.custom-select-value")
    ).to_have_text("region", ignore_case=True)

    # ---- check left plot x-axis label ----
    left_plot_x_axis_label = visualizations_svg.locator("text#left-plot-x-axis-label")
    expect(left_plot_x_axis_label).to_have_text("region", ignore_case=True)

    # Allow additional time for any animations
    page.wait_for_timeout(1000)

    # ---- check both right & left plots should not be empty ----
    left_plot_bars = left_plot.locator("rect.bar")
    expect(left_plot_bars).not_to_have_count(0)

    right_plot_bars = right_plot.locator("rect.rightBar")
    expect(right_plot_bars).not_to_have_count(0)


# ==================
# brush interaction
# ==================
def test_brush_interaction(page: Page):
    setup_page(page)

    # open visualizations
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_button.click()

    # Elements
    visualizations_svg = page.locator("svg#vis-svg")
    left_plot = visualizations_svg.locator("g#left-plot-group")
    right_plot = visualizations_svg.locator("g#right-plot-group")

    # Wait for SVG to be visible first
    expect(visualizations_svg).to_be_visible()

    # Wait for bars to be rendered in both plots
    left_plot_bars = left_plot.locator("rect.bar")
    right_plot_bars = right_plot.locator("rect.rightBar")

    # Wait for at least one bar to appear in left plot with timeout
    expect(left_plot_bars.first).to_be_visible(timeout=10000)  # 10 second timeout

    # # Wait for the visualization to be fully rendered
    # # This ensures all bars are loaded before counting
    # page.wait_for_function(
    #     """() => {
    #         const leftBars = document.querySelectorAll('g#left-plot-group rect.bar');
    #         const rightBars = document.querySelectorAll('g#right-plot-group rect.rightBar');
    #         return leftBars.length > 0 && rightBars.length > 0;
    #     }""",
    #     timeout=10000
    # )

    # Now count the bars
    expect(left_plot_bars).not_to_have_count(0)
    left_plot_bars_before_brush = left_plot_bars.count()

    expect(right_plot_bars).not_to_have_count(0)

    # ---------------------------
    # brush element should exist
    # ---------------------------
    brush_element = right_plot.locator("g.brush")
    expect(brush_element).to_be_attached()

    # ---------------------------------------
    # filtered-by should be hidden initially
    # ---------------------------------------
    filtered_by_element = page.locator("div#filtered-by")
    expect(filtered_by_element).not_to_have_class(re.compile(r".*visible.*"))

    # ---------------------------------
    # perform brush interaction (drag)
    # ---------------------------------
    # Get the right plot area for dragging
    right_plot_group = right_plot

    # Get the bounding box of the right plot to calculate drag coordinates
    right_plot_bbox = right_plot_group.bounding_box()

    # Calculate drag start and end positions (drag across middle portion of the chart)
    # This should select a subset of years
    start_x = right_plot_bbox["x"] + (right_plot_bbox["width"] * 0.2)  # 20% from left
    end_x = right_plot_bbox["x"] + (right_plot_bbox["width"] * 0.8)    # 80% from left
    middle_y = right_plot_bbox["y"] + (right_plot_bbox["height"] / 2)  # Middle of chart

    # Perform the drag operation to create a brush selection
    page.mouse.move(start_x, middle_y)
    page.mouse.down()
    page.mouse.move(end_x, middle_y)
    page.mouse.up()

    # Allow time for the brush interaction to complete
    page.wait_for_timeout(1000)

    # ---------------------------------
    # verify brush selection is active
    # ---------------------------------
    # Check that the filtered-by element becomes visible
    expect(filtered_by_element).to_have_class(re.compile(r".*visible.*"))

    # Check that the filtered-by value shows a year range
    filtered_by_value = page.locator("span#filtered-by-value")
    expect(filtered_by_value).to_be_visible()

    # The text should contain a year range pattern (e.g., "2020 - 2022")
    # We use a regex to match year patterns
    expect(filtered_by_value).to_have_text(re.compile(r'\d{4}\s*-\s*\d{4}'))

    # -----------------------------------------
    # verify left chart updates after brushing
    # -----------------------------------------
    # The left chart should still have bars (filtered data)
    left_plot_bars_after_brush = left_plot.locator("rect.bar")
    expect(left_plot_bars_after_brush).not_to_have_count(0)

    # --------------------------------
    # test brush reset functionality
    # --------------------------------
    # To clear a D3 brush, click outside the previously selected area
    # We selected from 20% to 80% of the width, so click in the unselected area (e.g., at 10%)
    clear_brush_x = right_plot_bbox["x"] + (right_plot_bbox["width"] * 0.1)  # 10% from left (outside selection)
    clear_brush_y = right_plot_bbox["y"] + (right_plot_bbox["height"] / 2)   # Middle of chart
    page.mouse.click(clear_brush_x, clear_brush_y)

    # Allow time for the brush interaction to complete
    page.wait_for_timeout(1000)

    # Allow additional time for any animations
    page.wait_for_timeout(1000)

    # Verify the filtered-by element is hidden again after clearing the brush
    expect(filtered_by_element).not_to_have_class(re.compile(r".*visible.*"))

    # Verify left chart still has data (should show all data again)
    left_plot_bars_after_brush_reset = left_plot.locator("rect.bar")
    expect(left_plot_bars_after_brush_reset).not_to_have_count(0)
    expect(left_plot_bars_after_brush_reset).to_have_count(left_plot_bars_before_brush)
