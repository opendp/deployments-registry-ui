import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const maxDepth = 4;

function fillTable(table, properties, required, groupCells) {
    required = required || [];
    for (const [name, def] of Object.entries(properties)) {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        const typeMd = def.type || 'string';
        const requiredMd = required.includes(name) ? `(required ${typeMd})` : `(optional ${typeMd})`;
        nameCell.innerHTML = marked.parse(`\`${name}\`\n\n${requiredMd}`);
        row.appendChild(nameCell);

        if (def.properties) {
            const descriptionCell = document.createElement("td");
            descriptionCell.innerHTML = marked.parse(def.description || '');
            descriptionCell.colSpan = maxDepth - groupCells.length;
            row.appendChild(descriptionCell);
            table.appendChild(row);
            fillTable(table, def.properties, def.required, groupCells.concat(nameCell));
        } else {
            const descriptionCell = document.createElement("td");
            const enumMd = def?.enum ? def?.enum.map((value) => `\`${value}\``).join(" / ") : '';
            descriptionCell.innerHTML = marked.parse(`${def.description || ''}\n\n${enumMd}`);
            descriptionCell.colSpan = maxDepth - groupCells.length;
            row.appendChild(descriptionCell);
            table.appendChild(row);
            for (const cell of groupCells) {
                cell.rowSpan += 1;
            }
        }
    }
}

function fillDiv(div, schema) {
    const description = document.createElement('div');
    description.innerHTML = marked.parse(schema.description);
    div.appendChild(description);

    const table = document.createElement("table");
    fillTable(table, schema.properties, schema.required, []);
    div.appendChild(table);
}

window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    fillDiv(document.getElementById("schema-table"), schema);
});
