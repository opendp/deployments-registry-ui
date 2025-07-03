# deployments-registry-ui
Front-end for the Privacy Deployments Registry

Shared development practices and architectural goals will make the Privacy Deployments Registry a sustainable community project.

## Development practices

Work is tracked with github issues.

- **Bugs** should include a reproducer and the expected behavior.
- **Features** should include a clear description of the desired feature, as well as a reminder of the motivation.

Development should happen in branches from `main`. To relate issues to branches we follow a naming convention on branches: `[issue number]-[short description]`. For example: `1234-add-dev-practices`. To keep in-progress work from being lost, draft PRs can be filed. PR descriptions should list the issues which are fixed, so github will automatically close the linked issues on merge. Project maintainers are responsible for reviewing PRs and should either indicate what needs to change or approve and merge. We require branches to be up-to-date with the latest changes in `main` to avoid surprises.

Reviewers should confirm that a PR actually addresses the linked issue, that the implementation makes sense, that new tests are added for any new functionality. Tests aren't required for changes to static content, but if there is anything more complicated, we can't assume that maintainers will remember and test all the functionality of the site with each new PR.

When CI checks pass, PRs should be [squash merged](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github#squashing-your-merge-commits). The linked issue will be automatically closed, and the new version of the site automatically published.

## Architectural goals

The Privacy Deployments Registry uses simple, widely adopted, actively maintained technologies to ensure its sustainability. It uses Jekyll to render static pages, and Github Pages to serve the content. We are conservative about introducing new libraries. Any front-end libraries used should be pulled from a CDN, rather than checked in to the codebase. We avoid inline Javascript, and favor modern widely supported JS language features like [modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules). Deployment should not rely on any steps apart from the static site generator, and the output files should be git-ignored.

This repo will describe DP in general terms. Particular deployments are described in [`deployments-registry-data`](https://github.com/opendp/deployments-registry-data) which is referenced as a git module.

## Getting started

```
git clone --recurse-submodules https://github.com/opendp/deployments-registry-ui.git
cd deployments-registry-ui
bundle install
bundle exec jekyll serve
```
