# deployments-registry-ui
Front-end for the Differential Privacy Deployments Registry

Shared development practices and architectural goals will make the Differential Privacy Deployments Registry a sustainable community project.

## Development practices

Work is tracked with github issues.

- **Bugs** should include a reproducer and the expected behavior.
- **Features** should include a clear description of the desired feature, as well as a reminder of the motivation.

Development should happen in branches from `main`. To relate issues to branches we follow a naming convention on branches: `[issue number]-[short description]`. For example: `1234-add-dev-practices`. To keep in-progress work from being lost, draft PRs can be filed. PR descriptions should list the issues which are fixed, so github will automatically close the linked issues on merge. Project maintainers are responsible for reviewing PRs and should either indicate what needs to change or approve and merge. We require branches to be up-to-date with the latest changes in `main` to avoid surprises.

Reviewers should confirm that a PR actually addresses the linked issue, that the implementation makes sense, that new tests are added for any new functionality. Tests aren't required for changes to static content, but if there is anything more complicated, we can't assume that maintainers will remember and test all the functionality of the site with each new PR.

When CI checks pass, PRs should be [squash merged](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github#squashing-your-merge-commits). The linked issue will be automatically closed, and the new version of the site automatically published.

## Architecture

**Static site generation**: The Differential Privacy Deployments Registry uses simple, widely adopted, actively maintained technologies to ensure its sustainability. It uses Jekyll to render static pages, and Github Pages to serve the content. Deployment should not rely on any steps apart from the static site generator, and the output files should be git-ignored.

**Javascript**: We are conservative about introducing new libraries. Any front-end libraries used should be pulled from a CDN, rather than checked in to the codebase. We avoid inline Javascript, and favor modern widely supported JS language features like [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

**Testing**: Additional testing (playwright end-to-end tests, link checking, etc.) will use Python, just because of our greater familiarity with Python testing tools. We'll focus on making simple assertions with these tests, so if there is a desire in the future to make the whole project Ruby, it shouldn't be too hard.

**Separation of concerns**: This repo has front end details, and will describe DP in general terms. Particular deployments are described in [`deployments-registry-data`](https://github.com/opendp/deployments-registry-data) which is referenced as a git module.


## Getting started

To build the site locally:

```shell
git clone --recurse-submodules https://github.com/opendp/deployments-registry-ui.git
cd deployments-registry-ui
bundle install
bundle exec jekyll build
```

To run tests:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r tests/requirements.txt
playwright install
pytest
```

We're using [Playwright](https://playwright.dev/python/) for end-to-end tests. You can use it to [generate test code](https://playwright.dev/python/docs/codegen-intro) just by interacting with the app in a browser:

```shell
playwright codegen http://127.0.0.1:4000/
```

You can also [step through these tests](https://playwright.dev/python/docs/running-tests#debugging-tests) and see what the browser sees:

```shell
PWDEBUG=1 pytest
```

If Playwright fails in CI, we can still see what went wrong:
- Scroll to the end of the CI log, to `actions/upload-artifact`.
- Download the zipped artifact locally.
- Inside the zipped artifact will be _another_ zip: `trace.zip`.
- Don't unzip it! Instead, open it with [trace.playwright.dev](https://trace.playwright.dev/).

To update the `deployments-registry-data` submodule, start a new branch and run:

```shell
git submodule update --remote
```

CI in the data repo is responsible for validating the deployment records,
but if there are changes to the schema, corresponding changes may be needed here.
After making any necessary updates, commit your changes and make a PR.


## Site Structure

The site is organized with documentation pages in the `pages/` directory, but served at clean URLs:

- Documentation home: `/` (served from `pages/index.md`)
- Getting started pages: `/overview`, `/intro-to-dp` (from `pages/getting-started/`)
- Concept pages: `/concepts/trust-model`, `/concepts/standardization` (from `pages/concepts/`)

This is achieved through Jekyll's permalink configuration, allowing clean URLs without moving files around.
