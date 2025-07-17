---
title: Schema
order: 5
---

Entries in the registry conform to a standard schema. The overview below is generated from the [authoritative JSON Schema](https://github.com/opendp/deployments-registry-data/blob/main/schemas/deployments-schema.yaml).

<table id="schema-table"></table>
<script>
const schema = {{ site.data.schemas.deployments-schema | jsonify }};
</script>
<script type="module" src="/assets/js/schema-table.js"></script>