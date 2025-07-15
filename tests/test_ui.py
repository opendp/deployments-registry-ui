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
    # Confirm hidden:
    latex_node = page.locator("mjx-container").filter(has_text="ϵsym")
    latex_node.is_hidden()

    markdown_p_1_text = "A region-specific constant c"
    markdown_p_1_node = page.get_by_text(markdown_p_1_text)
    markdown_p_1_node.is_hidden()

    # Click:
    # TODO: Update ID when https://github.com/opendp/deployments-registry-data/issues/51 is done.
    page.get_by_test_id("google_covid_19_sympton_search").click()

    # Confirm visible
    latex_node.is_visible()

    markdown_p_1_node.is_visible()

    # ... and confirm the second paragraph is in a separate element.
    # We could also confirm that markdown lists or links are rendered.
    markdown_p_2_text = "Unreliable metrics are removed"
    assert markdown_p_2_text not in markdown_p_1_node.text_content()

    parent = page.locator("dd").filter(has=markdown_p_1_node)
    assert markdown_p_2_text in parent.text_content()