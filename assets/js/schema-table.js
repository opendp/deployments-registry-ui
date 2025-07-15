import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

function fillTable(table, schema) {
    for (const [name, def] of Object.entries(schema)) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = name;
        row.appendChild(nameCell);

        const descriptionCell = document.createElement("td");
        if (def.properties) {
            const subTable = document.createElement("table");
            fillTable(subTable, def.properties);
            descriptionCell.appendChild(subTable);
        } else {
            descriptionCell.innerHTML = marked.parse(def.description || '');
        }
        row.appendChild(descriptionCell);

        table.appendChild(row);
    }
}

fillTable(document.getElementById("schema-table"), schema);