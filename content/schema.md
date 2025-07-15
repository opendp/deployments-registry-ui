---
title: Schema
order: 5
---

<table id="schema-table"></table>

<script>
    const schema = {{ site.data.schemas.deployments-schema.properties.deployment.properties | jsonify }};

    

    function fillTable(id, schema) {
        const table = document.getElementById(id);
        for (const [name, def] of Object.entries(schema)) {
            const row = document.createElement("tr");

            const nameCell = document.createElement("td");
            nameCell.textContent = name;
            row.appendChild(nameCell);

            const descriptionCell = document.createElement("td");
            descriptionCell.textContent = def.description;
            row.appendChild(descriptionCell);

            table.appendChild(row);
        }
    }

    fillTable("schema-table", schema);

</script>