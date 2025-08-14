from playwright.sync_api import Page, expect
from pathlib import Path


bp = "BREAKPOINT()".lower()
if bp in Path(__file__).read_text(encoding='utf-8'):
    raise Exception(
        f"Instead of `{bp}`, use `page.pause()` in playwright tests. "
        "See https://playwright.dev/python/docs/debug"
        "#run-a-test-from-a-specific-breakpoint"
    )


def test_ui(page: Page):
    # Page load?
    page.goto(f"http://localhost:4000/deployments-registry/")
    expect(
        page.get_by_role("heading", name="Deployments Registry")
    ).to_be_visible()


    # Schema table?
    page.get_by_text('Schema').click()
    # Top level:
    expect(page.get_by_text("The name of the data product")).to_be_visible()
    # Second level:
    expect(page.get_by_text("Actual, potential, or counterfactual datasets")).to_be_visible()


    # Deployments table?
    page.get_by_role("link", name="Deployments Registry").click()

    # Markdown and Latex rendering?
    # Confirm hidden:
    latex_node = page.locator("mjx-container").filter(has_text="ϵsym")
    latex_node.is_hidden()

    # Click:
    # US Census:
    page.get_by_text("ρ: 2.63").click()

    # Confirm visible
    latex_node.is_visible()

    expect(page.get_by_text("2020 Census Redistricting Data (P.L. 94-171) Summary File").first).to_be_visible()

    # TODO: confirm the second paragraph is in a separate element.

    with page.expect_download() as tsv_download_info:
        page.get_by_text("Download TSV").click()

    tsv_content = tsv_download_info.value.path().read_text(encoding='utf-8')
    # header row:
    assert "name\tdata_curator" in tsv_content
    # dotted keys:
    assert "accounting.composition" in tsv_content
    # body row:
    assert "Assistive AI\tMicrosoft" in tsv_content

