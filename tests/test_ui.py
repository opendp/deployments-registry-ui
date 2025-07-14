from playwright.sync_api import Page, expect
from pathlib import Path


bp = "BREAKPOINT()".lower()
if bp in Path(__file__).read_text():
    raise Exception(
        f"Instead of `{bp}`, use `page.pause()` in playwright tests. "
        "See https://playwright.dev/python/docs/debug"
        "#run-a-test-from-a-specific-breakpoint"
    )


def test_ui(page: Page):
    # Page load?
    root = Path(__file__).parent.parent
    page.goto(f"file://{root}/_site/index.html")
    expect(
        page.get_by_role("heading", name="Differential Privacy Deployments Registry")
    ).to_be_visible()

    # Schema load?
    expect(
        page.get_by_text("The name of the entity publishing the data product.")
    ).to_be_visible()

    # Data load?
    expect(
        # US Census:
        page.get_by_text("ε: 19.61")
    ).to_be_visible()

    # Markdown and Latex rendering?
    page.locator("mjx-container").filter(has_text="ϵsym").is_hidden()
    # TODO: Update ID when https://github.com/opendp/deployments-registry-data/issues/51 is done.
    page.get_by_test_id("google_covid_19_sympton_search").click()
    page.locator("mjx-container").filter(has_text="ϵsym").is_visible()

