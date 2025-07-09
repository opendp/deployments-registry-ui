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
    page.goto('http://localhost:4000/')
    expect(page.get_by_role("heading", name="Differential Privacy Deployments Registry")).to_be_visible()