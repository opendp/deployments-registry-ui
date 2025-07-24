---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

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

<table>
    <tbody>
        {% assign s = site.data.schemas.deployments-schema.properties.deployment.properties %}
        <tr>
            <th>Curator</th>
            <td>{{ s.data_curator.description }}</td>
        </tr>
        <tr>
            <th>Epsilon (ϵ)</th>
            <!-- TODO: Add a description in the schema for epsilon in particular. -->
            <td>{{ s.privacy_loss.properties.privacy_parameters.description }}</td>
        </tr>
        <tr>
            <th>Model</th>
            <td>{{ s.model.properties.model_type.description }}</td>
        </tr>
        <tr>
            <th>Intended Use</th>
            <td>{{ s.intended_use.description }}</td>
        </tr>
    </tbody>
</table>

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
</div>


{% assign pages = site.pages | where_exp: 'page', 'page.title' | sort: 'order' %}
{% for page in pages %}
- [{{page.title}}]({{page.url}})
{% endfor %}

<!-- Hidden deployment data for JavaScript -->
<script type="application/json" id="deployments-data">
[
{% for deployment in site.data.deployments %}
    {% assign d = deployment[1].deployment %}
    {
        "name": {{ d.name | jsonify }},
        "data_curator": {{ d.data_curator | jsonify }},
        "intended_use": {{ d.intended_use | jsonify }},
        "data_product_type": {{ d.data_product_type | jsonify }},
        "data_product_region": {{ d.data_product_region | jsonify }},
        "data_product_description": {{ d.data_product_description | jsonify }},
        "publication_date": {{ d.publication_date | jsonify }},
        "dp_flavor": {
            "name": {{ d.dp_flavor.name | jsonify }},
            "data_domain": {{ d.dp_flavor.data_domain | jsonify }},
            "unprotected_quantities": {{ d.dp_flavor.unprotected_quantities | jsonify }}
        },
        "privacy_loss": {
            "privacy_unit": {{ d.privacy_loss.privacy_unit | jsonify }},
            "privacy_unit_description": {{ d.privacy_loss.privacy_unit_description | jsonify }},
            "privacy_parameters": {{ d.privacy_loss.privacy_parameters | jsonify }},
            "privacy_parameters_description": {{ d.privacy_loss.privacy_parameters_description | jsonify }}
        },
        "model": {
            "model_type": {{ d.model.model_type | jsonify }},
            "model_type_description": {{ d.model.model_type_description | jsonify }},
            "release_type": {{ d.model.release_type | jsonify }},
            "release_type_description": {{ d.model.release_type_description | jsonify }},
            "interactivity": {{ d.model.interactivity | jsonify }}
        },
        "additional_dp_information": {
            "post_processing": {{ d.additional_dp_information.post_processing | jsonify }},
            "composition": {{ d.additional_dp_information.composition | jsonify }}
        },
        "implementation": {
            "pre_processing_eda_hyperparameter_tuning": {{ d.implementation.pre_processing_eda_hyperparameter_tuning | jsonify }},
            "mechanisms": {{ d.implementation.mechanisms | jsonify }},
            "justification": {{ d.implementation.justification | jsonify }}
        }
    }{% unless forloop.last %},{% endunless %}
{% endfor %}
]
</script>

{% include filter-script.html %}
