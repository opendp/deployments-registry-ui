import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

function fillTable(table, properties, required) {
    required = required || [];
    for (const [name, def] of Object.entries(properties)) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const requiredText = required.includes(name) ? '(required)' : '(optional)';
        nameCell.innerHTML = marked.parse(`\`${name}\` ${requiredText}`)
        row.appendChild(nameCell);

        const descriptionCell = document.createElement("td");
        if (def.properties) {
            const subTable = document.createElement("table");
            fillTable(subTable, def.properties, def.required);
            descriptionCell.appendChild(subTable);
        } else {
            descriptionCell.innerHTML = marked.parse(def.description || '');
        }
        row.appendChild(descriptionCell);

        table.appendChild(row);
    }
}

window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    fillTable(document.getElementById("schema-table"), schema.properties, schema.required);
});
