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

def test_visualizations_on_mobile(page: Page):
    # Set viewport to 768px breakpoint
    page.set_viewport_size({"width": 768, "height": 1024})

    # Page load?
    page.goto("http://localhost:4000/deployments-registry/")
    expect(
        page.get_by_role("heading", name="Deployments Registry")
    ).to_be_visible()


    # =========
    # Elements
    # =========
    visualizations_not_supported_warning = page.locator("div#visualizations-not-supported-warning")
    visualizations_button = page.get_by_role("button", name="Visualize trends in deployments")
    visualizations_container = page.locator("div#visualizations-container")

    # ====================================
    # check registry page loads correctly
    # ====================================
    # visualizations not supported warning should be visible
    expect(visualizations_not_supported_warning).to_be_visible()

    # visualizations button should not be visible
    expect(visualizations_button).not_to_be_visible()

    # visualizations should not be visible
    expect(visualizations_container).not_to_be_visible()
