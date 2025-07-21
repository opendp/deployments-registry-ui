function flatten(obj, parent, result = {}){
    for(let key in obj){
        let propName = parent ? `${parent}.${key}` : key;
        if (typeof obj[key] == 'object'){
            flatten(obj[key], propName, result);
        } else {
            // If we export CSV, then the white space wouldn't need to be sanitized,
            // ... but it might still be a good idea.
            result[propName] = String(obj[key]).replaceAll(/\s+/g, ' ');
        }
    }
    return result;
}

function setTsvHref(id, deployments) {
    const details = Object.values(deployments).map((entry) => entry.deployment);
    const rows = details.map((detail) => flatten(detail));
    const columns = Array.from(rows.map((row) => new Set(Object.keys(row))).reduce((unionOfKeys, currentKeys) => unionOfKeys.union(currentKeys), new Set()));
    const tsv = columns.join("\t") + "\n" + rows.map((row) => columns.map((col) => row[col]).join("\t")).join("\n");
    const tsvBlob = new Blob([tsv], {type: "text/tab-separated-values"});
    const tsvUrl = URL.createObjectURL(tsvBlob);
    document.getElementById(id).setAttribute("href", tsvUrl);
}

window.addEventListener("load", () => {
    // eslint-disable-next-line no-undef
    setTsvHref("download-tsv", deployments);
});
