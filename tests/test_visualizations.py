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

def test_visualizations(page: Page):
    # Page load?
    page.goto(f"http://localhost:4000/deployments-registry/")
    expect(
        page.get_by_role("heading", name="Deployments Registry")
    ).to_be_visible()


    # =========
    # Elements
    # =========
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_container = page.locator("div#visualizations-container")
    visualizations_svg = page.locator("svg#vis-svg")

    # left plot
    left_plot = visualizations_svg.locator("g#left-plot-group")
    left_plot_x_axis = left_plot.locator("g#left-plot-x-axis")
    left_plot_x_axis_label = visualizations_svg.locator("text#left-plot-x-axis-label")
    left_plot_y_axis_label = visualizations_svg.locator("text#left-plot-y-axis-label")

    # right plot
    right_plot = visualizations_svg.locator("g#right-plot-group")
    right_plot_x_axis_label = visualizations_svg.locator("text#right-plot-x-axis-label")
    right_plot_y_axis_label = visualizations_svg.locator("text#right-plot-y-axis-label")

    # tooltip
    tooltip = page.locator("div#vis-tooltip")

    # ==========================================================
    # registry page loads correctly with visualizations button
    # ==========================================================
    # visualizations button should be visible
    expect(visualizations_button).to_be_visible()

    # visualizations should be hidden on load
    expect(visualizations_container).not_to_be_visible()
    expect(visualizations_svg).not_to_be_visible()


    # ===========================================
    # visualizations components render correctly
    # ===========================================
    # open visualizations
    visualizations_button.click()

    # ----------------------
    # svg should be visible
    # ----------------------
    expect(
        visualizations_svg
    ).to_be_visible()

    # --------------------------------------------
    # check default x & y-axis labels are present
    # --------------------------------------------
    # left plot
    expect(left_plot_x_axis_label).to_be_visible()
    expect(left_plot_x_axis_label).to_have_text("data product type", ignore_case=True)
    expect(left_plot_y_axis_label).to_be_visible()
    expect(left_plot_y_axis_label).to_have_text("number of deployments", ignore_case=True)

    # right plot
    expect(right_plot_x_axis_label).to_be_visible()
    expect(right_plot_x_axis_label).to_have_text("year", ignore_case=True)
    expect(right_plot_y_axis_label).to_be_visible()
    expect(right_plot_y_axis_label).to_have_text("number of deployments", ignore_case=True)

    # --------------------------------------------------
    # check both right & left plots should not be empty
    # --------------------------------------------------
    # left plot
    left_plot_bars = left_plot.locator("rect.bar").filter(visible=True)
    expect(left_plot_bars).not_to_have_count(0)

    # right plot
    right_plot_bars = right_plot.locator("rect.rightBar").filter(visible=True)
    expect(right_plot_bars).not_to_have_count(0)

    # ------------------------------------
    # check right plots legend is present
    # ------------------------------------
    right_plot_legend = visualizations_container.locator("div#right-plot-legend-container")
    expect(right_plot_legend).to_be_visible()
    legend_items = right_plot_legend.locator("div.legend-item")
    expect(legend_items).not_to_have_count(0)


    # ======================================
    # left plot bars show tooltip on hover?
    # ======================================
    # first bars label
    left_plot_x_axis_ticks = left_plot_x_axis.locator("g.tick")
    first_tick = left_plot_x_axis_ticks.first

    # Get all <text> elements of the first tick and join their text
    text_elements = first_tick.locator("text")
    texts = [text_elements.nth(i).text_content().strip() for i in range(text_elements.count())]
    first_tick_label = " ".join(texts)

    # Hover over the first bar in the left plot
    first_left_bar = left_plot_bars.first
    first_left_bar.hover()

    # Check that the tooltip appears with correct content
    expect(tooltip).to_be_visible()
    # Escape special regex characters and use re.escape for the label
    expect(tooltip).to_have_text(re.compile(rf".*{re.escape(first_tick_label)}.*"))


    # ===============================================
    # variable change rerenders both plots correctly
    # ===============================================
    variable_dropdown = visualizations_container.locator("div.custom-select#variable-dropdown")

    # ---------------------
    # trigger should exist
    # ---------------------
    # get trigger
    variable_dropdown_trigger = variable_dropdown.locator("div.custom-select-trigger")
    expect(variable_dropdown_trigger).to_be_attached()

    # --------------
    # click trigger
    # --------------
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

    # check left plot x-axis label
    expect(left_plot_x_axis_label).to_have_text("region", ignore_case=True)

    # Allow additional time for any animations
    page.wait_for_timeout(1000)

    # check both right & left plots should not be empty
    # left plot
    left_plot_bars = left_plot.locator("rect.bar").filter(visible=True)
    expect(left_plot_bars).not_to_have_count(0)

    # right plot
    right_plot_bars = right_plot.locator("rect.rightBar").filter(visible=True)
    expect(right_plot_bars).not_to_have_count(0)


    # ==================
    # brush interaction
    # ==================
    left_plot_bars_before_brush = left_plot_bars.count()

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
    # Get the bounding box of the right plot to calculate drag coordinates
    right_plot_bbox = right_plot.bounding_box()

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
    left_plot_bars_after_brush = left_plot.locator("rect.bar").filter(visible=True)
    expect(left_plot_bars_after_brush).not_to_have_count(0)

    # --------------------------------
    # test brush reset functionality
    # --------------------------------
    # To clear a D3 brush, click outside the previously selected area
    # We selected from 20% to 80% of the width, so click in the unselected area (e.g., at 10%)
    clear_brush_x = right_plot_bbox["x"] + (right_plot_bbox["width"] * 0.1)  # 10% from left (outside selection)
    clear_brush_y = right_plot_bbox["y"] + (right_plot_bbox["height"] / 2)   # Middle of chart
    page.mouse.click(clear_brush_x, clear_brush_y)

    # Allow time for the brush interaction & any animations to complete
    page.wait_for_timeout(1000)

    # Verify the filtered-by element is hidden again after clearing the brush
    expect(filtered_by_element).not_to_have_class(re.compile(r".*visible.*"))

    # Verify left chart still has data (should show all data again)
    left_plot_bars_after_brush_reset = left_plot.locator("rect.bar").filter(visible=True)
    expect(left_plot_bars_after_brush_reset).not_to_have_count(0)
    expect(left_plot_bars_after_brush_reset).to_have_count(left_plot_bars_before_brush)
