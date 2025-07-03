---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

Inspired by [Differential Privacy in Practice: Expose your Epsilons!](https://journalprivacyconfidentiality.org/index.php/jpc/article/view/689) by Cynthia Dwork, Nitin Kohli, and Deirdre Mulligan, this registry provides: 

> a publicly available communal body of knowledge about differential privacy implementations that can be used by various stakeholders to drive the identification and adoption of judicious differentially private implementations

<table>
    <thead>
        <tr>
            <th>Curator</th>
            <th>Epsilon (ε)</th>
            <th>Model</th>
            <th>Intended Use</th>
        </tr>
    </thead>
    <tbody>
    {% for deployment in site.data.deployments %}
        {% assign d = deployment[1].deployment %}
        <tr>
            <td>{{ d.data_curator }}</td>
            <td>{{ d.privacy_loss.privacy_parameters.epsilon }}</td>
            <td>{{ d.model.model_type }}</td>
            <td>{{ d.intended_use }}</td>
        </tr>
    {% endfor %}
    </tbody>
</table>

