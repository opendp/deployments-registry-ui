---
layout: main
title: Deployments Registry
order: 1
class: deployments-registry
permalink: /deployments-registry/
icon: 'assignment'
---

<div class="home-page deployments-registry-page">
<div class="main-content" markdown="1">

{% if page.icon %}
<i class="material-symbols-rounded icon page-icon">{{ page.icon }}</i>
{% endif %}
{% if page.title %}
<header>
    <h1 class="post-title">{{ page.title | escape }}</h1>
    <button class="download-data-button">
        <a download="registry.tsv" id="download-tsv">Download data</a>
        <i class="material-symbols-rounded icon icon-download">download</i>
    </button>
</header>
{% endif %}

This registry is a collaborative resource for information about real-world differential privacy deployments. Use the table and visualizations below to explore both technical and sociotechnical aspects of these deployments.

**Click on any row to see expanded details.**

<script>
    // Exclude draft deployments from visualizations and TSV download
    const deployments = {{ site.data.deployments | where_exp: "item", "item.status != 'Draft'" | jsonify }};
    window.deployments = deployments;
</script>
<script type="module" src="/assets/js/download-tsv.js"></script>

<!-- Visualizations Section -->
{% include visualizations-section.html %}

<!-- Filters Section -->
<div class="filters-container">
    <div style="display: flex; flex-direction: column; gap: 8px;">
        <span class="title" style="white-space: nowrap;">Deployments Registry</span>
    </div>
    <div class="filter-row" style="justify-content: right">
        <div class="search-container">
            <input type="text" id="search-filter" placeholder="Search">
            <button id="clear-search-btn" class="clear-search-btn">
                <i class="material-symbols-rounded icon">close</i>
            </button>
        </div>
        <div class="filter-actions">
            <button id="clear-filters" title="Clear all filters">Clear all</button>
        </div>
    </div>
</div>

<div class="table-container">
<table id="deployments-table" class="display stripe"></table>
</div>

</div>

<div class="side-panel-container">
    <div class="side-panel">
        <div class="side-panel-content" id="deployment-details">
        </div>
    </div>
</div>
</div>

<!-- Hidden deployment data for JavaScript -->
<script type="application/json" id="deployments-data">
[
{% for deployment in site.data.deployments %}
    {% assign d = deployment[1] %}
    {% comment %}Exclude draft deployments from the table{% endcomment %}
    {% if d.status == "Draft" %}{% continue %}{% endif %}
    {% assign d_json = d | jsonify %}
    {% assign d_json_without_brace = d_json | replace_first: '{', '' %}
    {% assign anchor_value = d.url_slug | default: deployment[0] %}
    {% if first_rendered %},{% endif %}{% assign first_rendered = true %}
    {
        "file_name": {{ deployment[0] | jsonify }},
        "anchor": {{ anchor_value | jsonify }},
        {{ d_json_without_brace }}
{% endfor %}
]
</script>

<!-- Hidden deployment/ui hints data for JavaScript -->
<script type="application/json" id="deployment-hints">
    {{ site.data.ui-hints['deployments-hints'] | jsonify }}
</script>
<script>
    window.siteConfig = {
        dataRepoBaseUrl: "{{ site.data_repo_base_url | escape }}"
    };
</script>

<script type="module" src="{{ '/assets/js/deployments.js' | relative_url }}"></script>

<!-- jQuery first -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>

<!-- DataTables core -->
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.8/css/jquery.dataTables.min.css">
<script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js"></script>

<!-- Select extension (must come before SearchPanes) -->
<link rel="stylesheet" href="https://cdn.datatables.net/select/1.7.0/css/select.dataTables.min.css">
<script src="https://cdn.datatables.net/select/1.7.0/js/dataTables.select.min.js"></script>

<!-- SearchPanes extension -->
<link rel="stylesheet" href="https://cdn.datatables.net/searchpanes/2.3.1/css/searchPanes.dataTables.min.css">
<script src="https://cdn.datatables.net/searchpanes/2.3.1/js/dataTables.searchPanes.min.js"></script>

<!-- Custom scripts -->
<script type="module" src="{{ '/assets/js/datatable-init.js' | relative_url }}"></script>

<script src="{{ '/assets/js/visualization-toggle.js' | relative_url }}" defer></script>
