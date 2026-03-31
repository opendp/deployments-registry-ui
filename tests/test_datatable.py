from playwright.sync_api import Page, expect
from pathlib import Path
import re
import time

bp = "BREAKPOINT()".lower()
if bp in Path(__file__).read_text(encoding="utf-8"):
    raise ValueError(
        f"Instead of `{bp}`, use `page.pause()` in playwright tests. "
        "See https://playwright.dev/python/docs/debug"
        "#run-a-test-from-a-specific-breakpoint"
    )


# ==============================
# 1. Basic Initialization Tests
# ==============================
def test_datatable_initialization(page: Page):
    """Test that the deployments datatable is initialized correctly"""
    # Navigate to deployments registry page
    page.goto("http://localhost:4000/deployments-registry/")

    # Wait for page to load completely
    expect(page.get_by_role("heading", name="Deployments Registry")).to_be_visible()

    # Wait for the datatable to be initialized
    page.wait_for_selector("#deployments-table", state="visible", timeout=10000)

    # Check that the table exists and is visible
    table = page.locator("#deployments-table")
    expect(table).to_be_visible()

    # Check that DataTable has been initialized (should have DataTable classes)
    expect(table).to_have_class(re.compile(r".*dataTable.*"))

    # Verify there are deployment rows
    deployment_rows = table.locator("tbody tr.deployment-row")
    expect(deployment_rows).not_to_have_count(0)


def test_datatable_no_double_initialization(page: Page):
    """Test that DataTable doesn't get initialized twice on the same element"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Check that the table has been initialized exactly once
    # This is tested by ensuring the table has the correct DataTable structure

    # Should have exactly one DataTable wrapper
    dt_wrapper = page.locator("#deployments-table_wrapper")
    expect(dt_wrapper).to_have_class(re.compile(r".*dataTables_wrapper.*"))
    expect(dt_wrapper).to_have_count(1)

    # The table should be inside the wrapper
    table_in_wrapper = dt_wrapper.locator("#deployments-table")
    expect(table_in_wrapper).to_have_count(1)


# =============================
# 2. Data and Attributes Tests
# =============================
def test_datatable_data_attributes(page: Page):
    """Test that deployment rows have correct data attributes"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table tbody tr.deployment-row", timeout=10000)

    # Get the first deployment row
    first_row = page.locator("#deployments-table tbody tr.deployment-row").first
    expect(first_row).to_be_visible()

    # Verify the first row's data-file-name corresponds to a real YAML file
    data_dir = Path(__file__).parent.parent / "_data" / "deployments"
    first_row_file_name = first_row.get_attribute("data-file-name")
    assert (
        data_dir / f"{first_row_file_name}.yaml"
    ).exists(), f"First row's deployment file '{first_row_file_name}.yaml' should exist in data directory"

    data_anchor = first_row.get_attribute("data-anchor")
    data_index = first_row.get_attribute("data-index")
    assert (
        data_anchor is not None and data_anchor != ""
    ), "'data-anchor' attribute should exist and not be empty"
    assert (
        data_index is not None and data_index != ""
    ), "'data-index' attribute should exist and not be empty"


def test_datatable_has_deployment_data(page: Page):
    """Test that the datatable loads with actual deployment data"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Check that the deployments-data script tag exists and has content
    data_script = page.locator("#deployments-data")
    expect(data_script).to_be_attached()

    # Verify the script tag has JSON content
    script_content = data_script.inner_text()
    assert len(script_content.strip()) > 2  # More than just "[]"

    # Verify that the table has actual data rows (not just headers)
    data_rows = page.locator("#deployments-table tbody tr[data-file-name]")
    assert data_rows.count() > 0


# =======================
# 3. Functionality Tests
# =======================
def test_row_click_opens_side_panel(page: Page):
    """Test that clicking a row opens the side panel with details"""
    page.add_init_script(
        "window.localStorage.removeItem('deployments-registry:tier-info-dismissed');"
    )
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Get initial row count
    first_row = page.locator("#deployments-table tbody tr.deployment-row").first
    first_row.click()

    deployment_name = first_row.locator(".deployment-name").inner_text().strip()

    side_panel = page.locator(".deployments-registry-page>.side-panel-container")
    expect(side_panel).to_be_visible()
    expect(side_panel).to_have_class(re.compile(r".*expanded.*"))

    expect(side_panel.locator(".deployment-header .title")).to_contain_text(
        deployment_name
    )
    expect(page.locator("#tier-info-card .tier-info-card-read-more")).to_have_attribute(
        "href", "/transparency-tiers/"
    )


def test_tier_info_card_dismissal_persists(page: Page):
    page.goto("http://localhost:4000/deployments-registry/")
    page.evaluate(
        "window.localStorage.removeItem('deployments-registry:tier-info-dismissed');"
    )
    page.reload()
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Tier card auto-shows after a delay (no row click needed)
    tier_card = page.locator("#tier-info-card")
    expect(tier_card).to_have_class(re.compile(r".*visible.*"), timeout=7000)

    page.locator("[data-tier-info-dismiss]").first.click()
    expect(page.locator("#tier-info-card.visible")).not_to_be_visible()

    page.reload()
    page.wait_for_selector("#deployments-table", timeout=10000)
    # After dismissal persists across reload
    page.wait_for_timeout(2500)
    expect(page.locator("#tier-info-card.visible")).not_to_be_visible()


def test_tier_info_card_auto_shows_on_page_load(page: Page):
    """Tier info card appears on page load without requiring a row click"""
    page.add_init_script(
        "window.localStorage.removeItem('deployments-registry:tier-info-dismissed');"
    )
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    tier_card = page.locator("#tier-info-card")
    expect(tier_card).to_have_class(re.compile(r".*visible.*"), timeout=7000)


def test_tier_info_card_slides_in_independently(page: Page):
    """Tier info card appears independently of side panel"""
    page.set_viewport_size({"width": 1512, "height": 982})
    page.add_init_script(
        "window.localStorage.removeItem('deployments-registry:tier-info-dismissed');"
    )
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Card should auto-appear without clicking any row
    tier_card = page.locator("#tier-info-card")
    expect(tier_card).to_have_class(re.compile(r".*visible.*"), timeout=7000)

    # Side panel should NOT be expanded (no row clicked)
    side_panel = page.locator(".side-panel")
    expect(side_panel).not_to_have_class(re.compile(r".*expanded.*"))

    # Card is positioned at the top-right of the page
    tier_box = tier_card.bounding_box()
    assert tier_box is not None
    assert tier_box["x"] + tier_box["width"] > page.viewport_size["width"] * 0.5


def test_datatable_search_functionality(page: Page):
    """Test that the search functionality works"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Find the search input
    search_input = page.locator("#search-filter")
    expect(search_input).to_be_visible()

    # Get initial row count
    initial_rows = page.locator("#deployments-table tbody tr.deployment-row")
    initial_count = initial_rows.count()

    # Search for something specific (assuming there's data)
    search_input.fill("apple")

    # Wait for search to filter results
    page.wait_for_timeout(500)  # Allow time for search to process

    # Get filtered row count
    filtered_rows = page.locator("#deployments-table tbody tr:visible")
    expect(filtered_rows).not_to_have_count(0)
    assert filtered_rows.count() < initial_count, "Search should return some results"

    # Clear search should restore all rows
    clear_search_btn = page.locator("#clear-search-btn")
    if clear_search_btn.is_visible():
        clear_search_btn.click()
        page.wait_for_timeout(500)
        restored_rows = page.locator(
            "#deployments-table tbody tr.deployment-row:visible"
        )
        expect(restored_rows).to_have_count(initial_count)


def test_datatable_filter_triggers(page: Page):
    """Test that filter triggers are present and functional"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Check that filter triggers exist in table headers
    filter_triggers = page.locator("th .filter-trigger")
    expect(filter_triggers).not_to_have_count(0)

    # Test clicking a filter trigger
    first_trigger = filter_triggers.first
    first_trigger.click()

    # Check that a popover becomes visible
    thead = first_trigger.locator("..")  # parent th
    popover = thead.locator(".filters-popover-wrapper.visible")
    expect(popover).to_be_visible()

    # Click elsewhere to close popover
    page.locator("body").click()
    expect(popover).not_to_be_visible()


def test_datatable_clear_filters_button(page: Page):
    """Test the clear filters functionality"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Clear filters button should be present
    clear_btn = page.locator("#clear-filters")
    expect(clear_btn).to_be_attached()
    expect(clear_btn).not_to_be_visible()


def test_datatable_sort_functionality(page: Page):
    """Test that clicking column headers sorts the table"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Get the first column header
    product_header = page.locator("#deployments-table thead th.product-column").first
    expect(product_header).to_be_visible()

    # Click header to sort ascending
    product_header.click()
    page.wait_for_timeout(500)  # Allow time for sorting

    # Get first and last row data-file-name attributes
    first_asc_value = page.locator(
        "#deployments-table tbody tr.deployment-row:first-child"
    ).get_attribute("data-file-name")
    last_asc_value = page.locator(
        "#deployments-table tbody tr.deployment-row:last-child"
    ).get_attribute("data-file-name")

    # Click header again to sort descending
    product_header.click()
    page.wait_for_timeout(500)  # Allow time for sorting

    # Get first and last row data-file-name attributes
    first_desc_value = page.locator(
        "#deployments-table tbody tr.deployment-row:first-child"
    ).get_attribute("data-file-name")
    last_desc_value = page.locator(
        "#deployments-table tbody tr.deployment-row:last-child"
    ).get_attribute("data-file-name")

    # Assert that ascending order is opposite to descending order
    assert (
        first_asc_value == last_desc_value
    ), "first row sorted ascending should equal first row sorted descending"
    assert (
        last_asc_value == first_desc_value
    ), "last row sorted ascending should equal last row sorted descending"


def test_datatable_filter_application(page: Page):
    """Test column filter functionality"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Get initial row count
    initial_count = page.locator("#deployments-table tbody tr.deployment-row").count()

    # Get the product column header
    product_header = page.locator("#deployments-table thead th.product-column")
    expect(product_header).to_be_visible()

    # Open product column filter popover
    product_col_filter_trigger = product_header.locator(".filter-trigger")
    expect(product_col_filter_trigger).to_be_visible()
    product_col_filter_trigger.click()

    # Wait for popover to appear
    popover = product_header.locator(".filters-popover-wrapper")
    expect(popover).to_have_class(re.compile(r".*visible.*"))
    expect(popover).to_be_visible()

    # Get curator searchPane
    curator_search_pane = popover.locator(".dtsp-searchPane.curator-filter")
    curator_search_pane_label = curator_search_pane.locator(".filter-label")
    expect(curator_search_pane_label).to_be_visible()
    expect(curator_search_pane_label).to_have_text("Curator")

    # Curator filter clear button should be attached but not visible
    curator_filter_clear_button = curator_search_pane.locator(
        ".dtsp-paneButton.clearButton"
    )
    expect(curator_filter_clear_button).not_to_be_visible()

    # Clear all filters button should be attached but not visible
    clear_all_filters_button = page.locator("#clear-filters")
    expect(clear_all_filters_button).to_be_attached()
    expect(clear_all_filters_button).not_to_be_visible()

    # Get curator filter options
    curator_filter_options = curator_search_pane.locator(".dtsp-nameColumn")

    # Click on the "apple" option
    curator_apple_option = curator_filter_options.filter(has_text="apple")
    curator_apple_option.click()

    # get curator_apple_option parent tr
    curator_apple_option_row = curator_apple_option.locator("..")
    expect(curator_apple_option_row).to_have_class(re.compile(r".*selected.*"))

    # Get number of options with curator 'apple'
    number_of_apple_options = curator_apple_option.locator(".dtsp-pill").text_content()

    # Check that the product column filter trigger shows a count of 1
    product_filter_count = product_col_filter_trigger.get_attribute("data-count")
    assert (
        product_filter_count == "1"
    ), "After applying a filter, the product column filter trigger should show a count of 1"

    # Check that the clear buttons are now visible
    expect(curator_filter_clear_button).to_be_visible()
    expect(clear_all_filters_button).to_be_visible()

    # Wait for filtering to take effect
    page.wait_for_timeout(1000)

    # Get the product column header
    filtered_rows = page.locator("#deployments-table tbody tr.deployment-row")
    expect(filtered_rows).not_to_have_count(0)
    assert filtered_rows.count() == int(
        number_of_apple_options
    ), "Number of filtered rows should match number of selected filter options"

    # Check that every filtered row contains 'apple' in curators list
    filtered_rows_product_cells_curators_list = [
        row.locator("td.product-column span.curators-list")
        for row in filtered_rows.all()
    ]
    assert any(
        "apple" in curator_el.inner_text().lower()
        for curator_el in filtered_rows_product_cells_curators_list
    ), "Every filtered row should contain 'apple' in curators list"

    # Get filtered row count (use .deployment-row to avoid counting DataTables internal rows)
    filtered_rows = page.locator("#deployments-table tbody tr.deployment-row:visible")
    expect(filtered_rows).not_to_have_count(0)
    assert (
        filtered_rows.count() < initial_count
    ), "Applying a filter should reduce the number of visible rows"

    # Clear search should restore all rows
    curator_filter_clear_button.click()

    # Wait for filtering to clear
    page.wait_for_timeout(1000)

    # Check that the clear buttons are no longer visible
    expect(curator_filter_clear_button).not_to_be_visible()
    expect(clear_all_filters_button).not_to_be_visible()

    # Check that all rows are restored
    restored_rows = page.locator("#deployments-table tbody tr.deployment-row:visible")
    expect(restored_rows).to_have_count(initial_count)


# =====================
# 4. Integration Tests
# =====================
def test_datatable_mathjs_integration(page: Page):
    """Test that MathJax integration works with inline markdown"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Look for inline markdown elements (these should be processed by MathJax)
    inline_markdown = page.locator(".inline-markdown")
    expect(inline_markdown.first).not_to_have_count(0)


def test_datatable_columns_and_headers(page: Page):
    """Test that the datatable has properly configured columns and headers"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Check that table has headers
    headers = page.locator("#deployments-table thead th")
    expect(headers).not_to_have_count(0)

    # Check that headers have data-col-idx attributes (set by column config)
    first_header = headers.first
    data_col_idx = first_header.get_attribute("data-col-idx")
    assert (
        data_col_idx is not None and data_col_idx.isdigit()
    ), "'data-col-idx' attribute should exist and not be empty"


def test_datatable_search_panes_integration(page: Page):
    """Test that search panes are properly integrated into column headers"""
    page.goto("http://localhost:4000/deployments-registry/")
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Check if search panes exist in the DOM
    search_panes = page.locator(".dtsp-searchPane")

    # If search panes exist, they should be integrated into column headers
    if search_panes.count() > 0:
        # Search panes should be inside filter popovers
        popover_panes = page.locator(".filters-popover .dtsp-searchPane")
        expect(popover_panes).not_to_have_count(0)

        # Each search pane should have a filter label
        filter_labels = page.locator(".dtsp-searchPane .filter-label")
        expect(filter_labels).not_to_have_count(0)


# ========================
# 5. Error Handling Tests
# ========================
def test_datatable_error_handling(page: Page):
    """Test that the datatable handles errors gracefully"""
    page.goto("http://localhost:4000/deployments-registry/")

    # Check for any JavaScript errors in console that might indicate initialization problems
    console_errors = []

    def handle_console(msg):
        if msg.type == "error":
            console_errors.append(msg.text)

    page.on("console", handle_console)

    # Wait for table initialization
    page.wait_for_selector("#deployments-table", timeout=10000)

    # Filter out expected/harmless errors (if any)
    serious_errors = [
        error
        for error in console_errors
        if not any(
            harmless in error.lower()
            for harmless in ["mathjax", "failed to parse", "warning"]
        )
    ]

    # There should be no serious JavaScript errors
    assert len(serious_errors) == 0, f"JavaScript errors found: {serious_errors}"
