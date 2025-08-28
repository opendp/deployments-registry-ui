---
layout: main
title: Deployments Registry
order: 1
class: deployments-registry
permalink: /deployments-registry/
---

<div class="home-page deployments-registry-page">
<div class="main-content" markdown="1">

{% if page.icon %}
    <i class="fa-solid fa-2xl {{ page.icon }} page-icon"></i>
{% endif %}
{% if page.title %}
<header>
    <h1 class="post-title">{{ page.title | escape }}</h1>
    <button class="download-data-button">
        <a download="registry.tsv" id="download-tsv">Download data</a>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_1060_3018" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
            <rect width="16" height="16" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_1060_3018)">
            <path d="M7.49618 10.9423C7.40451 10.9423 7.31858 10.9263 7.23837 10.8942C7.15816 10.8622 7.08623 10.8141 7.02257 10.75L4.31076 8.01923C4.17072 7.87936 4.10388 7.71622 4.11024 7.52981C4.11661 7.34327 4.18676 7.17949 4.32069 7.03846C4.46685 6.89744 4.63223 6.82692 4.81684 6.82692C5.00145 6.82692 5.16377 6.89744 5.30382 7.03846L6.8125 8.57692V2.69231C6.8125 2.49615 6.878 2.33173 7.00901 2.19904C7.14002 2.06635 7.30234 2 7.49599 2C7.68964 2 7.8533 2.06635 7.98698 2.19904C8.12066 2.33173 8.1875 2.49615 8.1875 2.69231V8.57692L9.71528 7.03846C9.85112 6.89744 10.0124 6.83013 10.199 6.83654C10.3858 6.84295 10.5522 6.91667 10.6984 7.05769C10.8323 7.19872 10.8993 7.36218 10.8993 7.54808C10.8993 7.73397 10.8293 7.89744 10.6892 8.03846L7.97743 10.75C7.90868 10.8141 7.8342 10.8622 7.75399 10.8942C7.67378 10.9263 7.58785 10.9423 7.49618 10.9423ZM3.36965 14C2.99127 14 2.6684 13.8644 2.40104 13.5933C2.13368 13.3221 2 12.9962 2 12.6154V11.9231C2 11.7269 2.0655 11.5625 2.19651 11.4298C2.32752 11.2971 2.48984 11.2308 2.68349 11.2308C2.87714 11.2308 3.0408 11.2971 3.17448 11.4298C3.30816 11.5625 3.375 11.7269 3.375 11.9231V12.6154H11.625V11.9231C11.625 11.7269 11.6905 11.5625 11.8215 11.4298C11.9525 11.2971 12.1148 11.2308 12.3085 11.2308C12.5021 11.2308 12.6658 11.2971 12.7995 11.4298C12.9332 11.5625 13 11.7269 13 11.9231V12.6154C13 12.9962 12.8653 13.3221 12.5959 13.5933C12.3265 13.8644 12.0026 14 11.6242 14H3.36965Z" fill="#181818"/>
            </g>
        </svg>
    </button>
</header>
{% endif %}

Inspired by [Differential Privacy in Practice: Expose your Epsilons!](https://journalprivacyconfidentiality.org/index.php/jpc/article/view/689) by Cynthia Dwork, Nitin Kohli, and Deirdre Mulligan, this registry provides:

> A publicly available communal body of knowledge about differential privacy implementations that can be used by various stakeholders to drive the identification and adoption of judicious differentially private implementations -Dwork Kohli Mulligan 2019

<script>
    const deployments = {{ site.data.deployments | jsonify }};
</script>
<script type="module" src="/assets/js/download-tsv.js"></script>

<!-- Filters Section -->
<div class="filters-container">
    <div style="white-space: nowrap">Deployments Registry</div>
    <div class="filter-row" style="justify-content: right">
        <div class="filter-group">
            <input type="text" id="search-filter" placeholder="Search">
        </div>
        <div class="filter-group">
            <select id="visible-filters">
                <option value="">Filters</option>
            </select>
        </div>
        <div class="filter-actions">
            <button id="clear-filters" title="Clear all filters">Clear</button>
        </div>
    </div>
</div>

<div class="filters-container" style="margin-top: 0.5rem">
    <div class="filter-row">
        <div class="filter-group" id="curator-filter-group" style="display: none;">
            <label for="curator-filter">Curator:</label>
            <select id="curator-filter">
                <option value="">All Curators</option>
            </select>
        </div>
        <div class="filter-group" id="model-filter-group" style="display: none;">
            <label for="model-filter">Model:</label>
            <select id="model-filter">
                <option value="">All Models</option>
            </select>
        </div>
        <div class="filter-group" id="product-filter-group" style="display: none;">
            <label for="product-filter">Product:</label>
            <select id="product-filter">
                <option value="">All Products</option>
            </select>
        </div>
        <div class="filter-group" id="flavor-filter-group" style="display: none;">
            <label for="flavor-filter">Flavor:</label>
            <select id="flavor-filter">
                <option value="">All Flavors</option>
            </select>
        </div>
        <div class="filter-group" id="privacy-unit-filter-group" style="display: none;">
            <label for="privacy-unit-filter">Privacy Unit:</label>
            <select id="privacy-unit-filter">
                <option value="">All Privacy Units</option>
            </select>
        </div>
        <div class="filter-group" id="tier-filter-group" style="display: none;">
            <label for="tier-filter">Tier:</label>
            <select id="tier-filter">
                <option value="">All Tiers</option>
            </select>
        </div>
        <div class="filter-group" id="year-filter-group" style="display: none;">
            <label for="year-filter">Year:</label>
            <select id="year-filter">
                <option value="">All Years</option>
            </select>
        </div>
    </div>
</div>

<div class="table-container">
<table id="deployments-table">
    <thead>
        <tr>
            <th style="text-align: center; width: 35px;">Tier</th>
            <th style="width: 20%;">Product</th>
            <th style="width: 20%;">Description</th>
            <th style="min-width: 60px;">Year</th>
            <th style="width: 15%; min-width: 100px">Flavor name</th>
            <th style="width: 15%; min-width: 100px">Privacy Loss</th>
            <th style="min-width: 70px">Model</th>
            <th style="width: 10%; min-width: 80px">Accounting</th>
            <th style="width: 10%; min-width: 80px">Implementation</th>
        </tr>
    </thead>
    <tbody>
    {% for deployment in site.data.deployments %}
        {% assign d = deployment[1].deployment %}
        <tr class="deployment-row" data-index="{{ forloop.index0 }}" data-file-name="{{ deployment[0] }}">
            <td class='tier-column' data-tier="{{ deployment[1].tier }}">
                <div class='tiers'>
                    {% if deployment[1].tier == 1 %}
                        <i class="fa-solid fa-circle"></i>
                        <i class="fa-regular fa-circle"></i>
                        <i class="fa-regular fa-circle"></i>
                    {% elsif deployment[1].tier == 2 %}
                        <i class="fa-solid fa-circle"></i>
                        <i class="fa-solid fa-circle"></i>
                        <i class="fa-regular fa-circle"></i>
                    {% elsif deployment[1].tier == 3 %}
                        <i class="fa-solid fa-circle"></i>
                        <i class="fa-solid fa-circle"></i>
                        <i class="fa-solid fa-circle"></i>
                    {% else %}
                        {{ deployment[1].tier }}
                    {% endif %}
                </div>
            </td>
            <td style="width: 15%;">
                <div style="color: #181818; font-weight: 500; margin-bottom: 4px">{{ d.name }}</div>
                <div>by {{ d.data_curator }}</div>
            </td>
            <td class="product-description">
                <span class="description-text">{{ d.description }}</span>
                {% if d.description.size > 0 %}
                    <div data-index="{{ forloop.index0 }}" class="description-window">
                        {{ d.description }}
                    </div>
                {% endif %}
            </td>
            <td style="min-width: 60px;">{{ d.publication_date | date: "%Y" }}</td>
            <td>{{ d.dp_flavor.name }}</td>
            <td>
                {% if d.privacy_loss.privacy_unit %}
                    <div style="font-weight: 500; margin-bottom: 4px; font-size: 12px">{{ d.privacy_loss.privacy_unit }}</div>
                {% endif %}
                {% if d.privacy_loss.privacy_parameters.epsilon %}
                    ε:&nbsp;{{ d.privacy_loss.privacy_parameters.epsilon }}<br>
                {% endif %}
                {% if d.privacy_loss.privacy_parameters.delta %}
                    δ:&nbsp;{{ d.privacy_loss.privacy_parameters.delta }}<br>
                {% endif %}
                {% if d.privacy_loss.privacy_parameters.rho %}
                    ρ:&nbsp;{{ d.privacy_loss.privacy_parameters.rho }}<br>
                {% endif %}
            </td>
            <td>{{ d.model.model_name }}</td>
            <td> - </td>
            <td> - </td>
        </tr>
    {% endfor %}
    </tbody>
</table>
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
    {% assign d = deployment[1].deployment %}
    {{ d | jsonify }}{% unless forloop.last %},{% endunless %}
{% endfor %}
]
</script>

<!-- Hidden deployment/ui hints data for JavaScript -->
<script type="application/json" id="deployment-hints">
    {{ site.data.ui-hints['deployments-hints'] | jsonify }}
</script>

<script type="module" src="{{ '/assets/js/deployments.js' | relative_url }}"></script>
{% include filter-script.html %}
