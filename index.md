---
layout: home
---

Inspired by [Differential Privacy in Practice: Expose your Epsilons!](https://journalprivacyconfidentiality.org/index.php/jpc/article/view/689) by Cynthia Dwork, Nitin Kohli, and Deirdre Mulligan, this registry provides: 

> a publicly available communal body of knowledge about differential privacy implementations that can be used by various stakeholders to drive the identification and adoption of judicious differentially private implementations

<a download="registry.tsv" id="download-tsv">Download TSV</a>
<script>
const deployments = {{ site.data.deployments | jsonify }};
</script>
<script type="module" src="/assets/js/download-tsv.js"></script>
<script src="/assets/js/toggle-details.js"></script>

<div style="column-count: 2;">
    <div>
        <table>
            <thead>
                <tr>
                    <th></th>
                    <th>Tier</th>
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
                {% assign id = deployment[0] %}
                {% assign d = deployment[1].deployment %}
                <tr>
                    <td><input type="checkbox" onchange="toggleDetails('{{id}}');"></td>
                    <td>{{ deployment[1].tier }}</td>
                    <td>{{ d.data_curator }}</td>
                    <td>{{ d.data_product_type }}</td>
                    <td>{{ d.publication_date }}</td>
                    <td>{{ d.dp_flavor.name }}</td>
                    <td>
                        ε:&nbsp;{{ d.privacy_loss.privacy_parameters.epsilon }}<br>
                        δ:&nbsp;{{ d.privacy_loss.privacy_parameters.delta }}<br>
                        ρ:&nbsp;{{ d.privacy_loss.privacy_parameters.rho }}
                    </td>
                    <td>{{ d.model.model_type }}</td>
                </tr>
            {% endfor %}
            </tbody>
        </table>
    </div>
    <div>
    {% for deployment in site.data.deployments %}
        {% assign id = deployment[0] %}
        {% assign d = deployment[1].deployment %}
        {% include details.html id=id deployment=d %}
    {% endfor %}
    </div>
</div>

{% assign pages = site.pages | where_exp: 'page', 'page.title' | sort: 'order' %}
{% for page in pages %}
- [{{page.title}}]({{page.url}})
{% endfor %}
