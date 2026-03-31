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

<script>
    // All deployments from Jekyll data files (unfiltered)
    const allDeployments = {{ site.data.deployments | jsonify }};
    // Statuses considered "published" — configured in _config.yml
    var publishedStatuses = {{ site.published_statuses | jsonify }};
    // Shared predicate for status filtering across table, visualizations, and TSV
    window.isPublishedDeployment = function(deployment) {
        return publishedStatuses.includes(deployment.status);
    };
    // Filter to only published deployments for visualizations and TSV download
    var deployments = Object.fromEntries(
        Object.entries(allDeployments).filter(([_, d]) => window.isPublishedDeployment(d))
    );
</script>
<script type="module" src="/assets/js/download-tsv.js"></script>

<!-- Visualizations Section -->
{% include visualizations-section.html %}

<!-- Filters Section -->
<div class="filters-container">
    <div style="display: flex; flex-direction: column; gap: 8px;">
        <span class="title" style="white-space: nowrap;">All deployments</span>
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

<div class="registry-table-callout" role="note">
    <i class="material-symbols-rounded icon" aria-hidden="true">info</i>
    <p>
        Click on a row to see more details about each deployment.
    </p>
</div>

<div class="table-container">
<table id="deployments-table" class="display stripe"></table>
</div>

</div>

<div class="side-panel-container">
    <div class="tier-info-card" id="tier-info-card" aria-live="polite">
        <div class="tier-info-card-icon-wrapper">
            <i class="material-symbols-rounded icon" aria-hidden="true">check_circle</i>
        </div>
        <div class="tier-info-card-content">
            <span class="tier-info-card-title">Information about Tiers</span>
            <p class="tier-info-card-description">
                Each deployment is assigned a tier, with higher tiers requiring more detailed information.
            </p>
            <div class="tier-info-card-actions">
                <button type="button" class="tier-info-card-dismiss" data-tier-info-dismiss>Dismiss</button>
                <a class="tier-info-card-read-more" href="{{ '/transparency-tiers/' | relative_url }}">Read More</a>
            </div>
        </div>
        <button type="button" class="tier-info-card-close" data-tier-info-dismiss aria-label="Dismiss tier information">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
        </button>
    </div>
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
    {% assign d_json = d | jsonify %}
    {% assign d_json_without_brace = d_json | replace_first: '{', '' %}
    {% assign anchor_value = d.url_slug | default: deployment[0] %}
    {
        "file_name": {{ deployment[0] | jsonify }},
        "anchor": {{ anchor_value | jsonify }},
        {{ d_json_without_brace }}{% unless forloop.last %},{% endunless %}
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
