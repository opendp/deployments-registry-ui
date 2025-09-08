import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const maxDepth = 4;

function makeNameCell(name, def, required, anchor) {
    const nameCell = document.createElement("td");
    nameCell.id = anchor;

    const typeMd = def.type || 'string';
    const tierMd = def.tier ? `tier ${def.tier}` : '';
    const requiredMd = required.includes(name) ? 'required' : 'optional';
    const fullMd = `(${requiredMd} ${tierMd} ${typeMd})`;
    nameCell.innerHTML = marked.parse(`\`${name}\`\n\n${fullMd}`);
    return nameCell
}

function makeDescriptionCell(def, colSpan) {
    const descriptionCell = document.createElement("td");
    const enumMd = def?.enum ? def?.enum.map((value) => `\`${value}\``).join(" / ") : '';
    descriptionCell.innerHTML = marked.parse(`${def.description || ''}\n\n${enumMd}`);
    if (def.description_long) {
        const details = document.createElement("details");
        details.innerHTML = marked.parse(def.description_long);
        descriptionCell.appendChild(details);
    }
    descriptionCell.colSpan = colSpan;
    return descriptionCell;
}

function fillTable(table, properties, required, nameCells, path = '') {
    required = required || [];
    for (const [name, def] of Object.entries(properties)) {
        const anchor = path ? `${path}-${name}` : name;
        const row = document.createElement("tr");

        if (nameCells.length > 0) {
            const emptyCell = document.createElement("td");
            emptyCell.className = "empty-cell";
            row.appendChild(emptyCell);
        }

        const nameCell = makeNameCell(name, def, required, anchor)
        row.appendChild(nameCell);

        if (!def.properties && def.description) {
            const descriptionCell = makeDescriptionCell(def, maxDepth - nameCells.length);
            row.appendChild(descriptionCell);
        }

        table.appendChild(row);

        for (const cell of nameCells) {
            cell.rowSpan += 1;
        }
        if (def.properties) {
            fillTable(table, def.properties, def.required, nameCells.concat(nameCell), anchor);
        }
    }
}

function initTable(table, schema) {
    const row = document.createElement("tr");
    const cell = makeDescriptionCell(schema, maxDepth + 1);
    row.appendChild(cell);
    table.appendChild(row);

    fillTable(table, schema.properties, schema.required, []);
}

window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    initTable(document.getElementById("schema-table"), schema);

    // Auto-select definition if URL has #definition_anchor
    // Runs only once on load
    (function readAnchorAndAutoScrollToRow() {
        if (window.__autoScrollToRowRan) return; // defensive guard
        window.__autoScrollToRowRan = true;

        const rawHash = window.location.hash;
        if (!rawHash || rawHash.length <= 1) return;

        const anchor = decodeURIComponent(rawHash.substring(1));

        // Use CSS.escape if available to safely query
        const esc = window.CSS && CSS.escape ? CSS.escape(anchor) : anchor.replace(/"/g, '\\"');

        // const targetRow = document.getElementById(esc);
        const targetCell = document.getElementById(esc);
        if (!targetCell) return;

        // Defer selection slightly to ensure MathJax / layout stable
        requestAnimationFrame(() => {
            try {
                targetCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const targetRow = targetCell.parentElement;
                if (targetRow) targetRow.classList.add('highlighted');
            } catch (e) {
                console.error('Failed to scroll into view: ', e);
            }
        });
    })();
});
