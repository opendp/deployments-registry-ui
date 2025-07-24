---
layout: main
title: Deployments Registry
order: 1
class: deployments-registry
permalink: /deployments-registry/
---

<div class="home-page">
<div class="main-content" markdown="1">

Inspired by [Differential Privacy in Practice: Expose your Epsilons!](https://journalprivacyconfidentiality.org/index.php/jpc/article/view/689) by Cynthia Dwork, Nitin Kohli, and Deirdre Mulligan, this registry provides: 

> a publicly available communal body of knowledge about differential privacy implementations that can be used by various stakeholders to drive the identification and adoption of judicious differentially private implementations

<a download="registry.tsv" id="download-tsv">Download TSV</a>
<script>
    const deployments = {{ site.data.deployments | jsonify }};
</script>
<script type="module" src="/assets/js/download-tsv.js"></script>

<!-- Filters Section -->
<div class="filters-container">
    <div>Deployments Registry</div>
    <div class="filter-row">
        <div class="filter-group">
            <label for="curator-filter">Curator:</label>
            <select id="curator-filter">
                <option value="">All Curators</option>
            </select>
        </div>
        <div class="filter-group">
            <label for="model-filter">Model:</label>
            <select id="model-filter">
                <option value="">All Models</option>
            </select>
        </div>
        <div class="filter-group">
            <label for="year-filter">Year:</label>
            <select id="year-filter">
                <option value="">All Years</option>
            </select>
        </div>
        <div class="filter-actions">
            <button id="clear-filters" title="Clear all filters">Clear</button>
        </div>
    </div>
</div>

<table id="deployments-table">
    <thead>
        <tr>
            <th>Curator</th>
            <th>Product</th>
            <th>Date</th>
            <th>Flavor</th>
            <th>Privacy Loss</th>
            <th>Model</th>
        </tr>
    </thead>
    <tbody>
    {% for deployment in site.data.deployments %}
        {% assign d = deployment[1].deployment %}
        <tr class="deployment-row" data-index="{{ forloop.index0 }}">
            <td>{{ d.data_curator }}</td>
            <td>{{ d.data_product_type }}</td>
            <td>{{ d.publication_date }}</td>
            <td>{{ d.dp_flavor.name }}</td>
            <td>
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
            <td>{{ d.model.model_type }}</td>
        </tr>
    {% endfor %}
    </tbody>
</table>
</div>

<div class="side-panel-container">
    <div class="side-panel">
        <div class="side-panel-content" id="deployment-details">
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

{% include filter-script.html %}
