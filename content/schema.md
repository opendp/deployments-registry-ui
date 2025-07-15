---
title: Schema
order: 5
---

<table id="schema-table"></table>
<script>
const schema = {{ site.data.schemas.deployments-schema.properties.deployment.properties | jsonify }};
</script>
<script type="module" src="/assets/js/schema-table.js"></script>