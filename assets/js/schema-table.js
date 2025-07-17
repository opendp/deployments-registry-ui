import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

function fillTable(table, properties, required) {
    required = required || [];
    for (const [name, def] of Object.entries(properties)) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const typeMd = def.type || 'string';
        const requiredMd = required.includes(name) ? `(required ${typeMd})` : `(optional ${typeMd})`;
        nameCell.innerHTML = marked.parse(`\`${name}\`\n\n${requiredMd}`)
        row.appendChild(nameCell);

        const descriptionCell = document.createElement("td");
        if (def.properties) {
            const subTable = document.createElement("table");
            fillTable(subTable, def.properties, def.required);
            descriptionCell.appendChild(subTable);
        } else {
            const enumMd = def?.enum ? def?.enum.map((value) => `\`${value}\``).join(" / ") : '';
            descriptionCell.innerHTML = marked.parse(`${def.description || ''}\n\n${enumMd}`);
        }
        row.appendChild(descriptionCell);

        table.appendChild(row);
    }
}

function fillDiv(div, schema) {
    const description = document.createElement('div');
    description.innerHTML = marked.parse(schema.description);
    div.appendChild(description);

    const table = document.createElement("table");
    fillTable(table, schema.properties, schema.required);
    div.appendChild(table);
}

window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    fillDiv(document.getElementById("schema-table"), schema);
});
