# Documentation Website Structure

This documentation website uses Jekyll.

## Adding New Pages

To add new documentation pages:

### 1. Create the Markdown File

Create your new `.md` file in the appropriate folder under `pages/`:

```text
pages/
├── background/
│   ├── overview.md
│   └── intro-to-dp.md
├── concepts/
│   ├── trust-model.md
│   ├── standardization.md
│   └── advanced-topics.md
├── deployments-registry/
├── further-information/
└── privacy/
```

### 2. Add Front Matter

Each page must include front matter with these fields:

```yaml
---
title: Your Page Title
order: 1  # Controls order within the section (optional)
class: your-page-class  # Optional CSS class
layout: docs  # Use the docs layout for regular pages, main for special layouts
icon: '<svg>...</svg>'  # Optional icon (used as part of page header)
---
```

### 3. Update Navigation

Add your page to `_navigation/main.md`. The navigation structure supports two types of sections:

**Sections with sub-pages:**
```yaml
- section: your-section
  title: Section Title
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">...</svg>'
  path: /your-section/ # Note: URL path to the index file permalink
  pages:
    - path: /your-section/your-page/  # Note: URL path, not file path
      title: Your Page Title
      order: 1
```

**Direct link sections (no sub-pages):**
```yaml
- section: your-section
  title: Section Title
  path: /your-section/  # Direct link to a page
  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">...</svg>'
```

### 4. Update _config.yml

When adding a new section, you must also add it to the `defaults` in `_config.yml` to configure permalinks and layout:

```yaml
defaults:
  - scope:
      path: "pages/your-section"
    values:
      layout: "docs"
      permalink: /your-section/:basename/
```

## Creating New Sections

To create a new section:

1. Create a new folder under `pages/`
2. Add pages to that folder
3. Add a new section to `_navigation/main.md`
4. Add permalink configuration to `_config.yml` under `defaults`

## Navigation Structure

The sidebar navigation reads from `_navigation/main.md`, which contains a YAML front matter with the navigation structure. The sidebar supports:

- **Icons**: SVG icons for each section (16x16 recommended)
- **Collapsible Sections**: Sections with sub-pages that can be expanded/collapsed
- **Direct Links**: Sections that link directly to a single page
- **Active State**: Automatic highlighting of current page/section
- **Order Control**: Sort pages within sections using the `order` field

## File Structure

```text
├── _navigation/
│   └── main.md                # Sidebar navigation structure
├── _layouts/
│   ├── docs.html              # Documentation page layout
│   └── main.html              # Special layout for certain pages
├── _includes/
│   ├── head.html
│   ├── footer.html
│   ├── sidebar.html           # Sidebar navigation component
│   └── image.html
├── assets/css/
│   └── custom.css             # Documentation-specific styles
├── pages/                     # All documentation pages
│   ├── background/
│   ├── concepts/
│   ├── deployments-registry/
│   ├── further-information/
│   └── privacy/
└── index.md                   # Homepage
```

## Local Development

Run the Jekyll development server:

```bash
bundle exec jekyll serve --host 0.0.0.0 --port 4000
```

The site will be available at `http://localhost:4000`
