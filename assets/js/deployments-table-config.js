// columnsConfig.js
export function getColumnsConfig(deploymentsData) {
	const tierSet = new Set();
	const productSet = new Set();
	const curatorSet = new Set();
	const privacyUnitSet = new Set();

    deploymentsData.forEach(dep => {
        const { tier } = dep;
        // Safe extraction with defaults so missing keys don't create sparse/shift issues.
		const deployment = dep?.deployment || {};
		const data_product_type = deployment.product.data_product_type ?? '';
		const data_curators = deployment.product.data_curators ?? null; // may be array or string; null if absent
		const privacy_unit = deployment.privacy_loss?.privacy_unit ?? '';

        if (tier)  tierSet.add(tier);
        if (data_product_type) productSet.add(data_product_type);
        if (data_curators) {
            if (Array.isArray(data_curators)) {
				data_curators.forEach(curator => curatorSet.add(curator));
			} else {
				curatorSet.add(data_curators);
			}
        }
        if (privacy_unit) privacyUnitSet.add(privacy_unit);
    });

    // tier search pane config
    const tierSearchPaneConfig = {
        className: 'tier-filter',
        header: 'Tier',
        options: Array.from(tierSet).map(tier => ({
            label: Number(tier),
            value: function (rowData) {
                return rowData['tier'] === tier;
            }
        }))
    };

    // product search pane config
    const productSearchPaneConfig = {
        className: 'product-filter',
        header: 'Product Type',
        options: Array.from(productSet).map(product => ({
            label: product,
            value: function (rowData) {
                return rowData?.deployment?.data_product_type === product;
            }
        }))
    };

    // curator search pane config
    const curatorSearchPaneConfig = {
        className: 'product-filter',
        header: 'Curator',
        options: Array.from(curatorSet).map(curator => ({
            label: curator,
            value: function (rowData) {
                if (Array.isArray(rowData?.deployment?.data_curators)) {
                    return rowData?.deployment?.data_curators.includes(curator);
                } else if (typeof rowData?.deployment?.data_curators === 'string') {
                    return rowData?.deployment?.data_curators === curator;
                }
                return false;
            }
        }))
    };

    const privacyUnitSearchPaneConfig = {
        className: 'privacy-filter',
        header: 'Privacy Unit',
        options: Array.from(privacyUnitSet).map(privacyUnit => ({
            label: privacyUnit,
            value: function (rowData) {
                return rowData?.deployment?.privacy_loss?.privacy_unit === privacyUnit;
            }
        }))
    };

    const columnsConfig = [
        // TIER
        {
            column: {
                data: 'tier',
                className: 'tier-column',
                title: 'Tier',
                render: (data, type) => {
                    let tierValue = data;
                    const numericTier = Number(tierValue) || 0;

                    // For search panes, return just the numeric value
                    if (type === 'searchPanes' || type === 'sp' || type === 'filter') {
                        return numericTier;
                    }

                    // For table display, show the dot visualization
                    if (type === 'display') {
                        const dots = [];
                        dots.push('<div class="tiers">');
                        for (let i = 0; i < 3; i++) {
                            dots.push(`<i class="material-symbols-rounded ${numericTier > i ? 'filled' : ''}">circle</i>`);
                        }
                        dots.push('</div>');
                        return dots.join('');
                    }

                    // For all other types (sort, type), return the numeric value
                    return numericTier;
                },
            },
            headerAttributes: {
                'data-sortable': 'true',
                'data-filter-type': 'tier',
                'aria-label': 'Tier column header',
                'role': 'columnheader'
            },
            searchPane: {
                show: true,
                config: tierSearchPaneConfig,
            },
        },
        // PRODUCT
        {
            column: {
                data: null,
                className: 'product-column',
                title: 'Product',
                render: (_, __, row) => {
                    const { name, data_curators } = row.deployment.product;
                    return (`
                        <div style="color: #181818; font-weight: 500; margin-bottom: 4px">${name}</div>
                        <div>by ${Array.isArray(data_curators) ? data_curators.join(', ') : data_curators}</div>
                    `);
                },
            },
            searchPane: {
                show: true,
                config: [
                    productSearchPaneConfig,
                    curatorSearchPaneConfig,
                ],
            }
        },
        // DESCRIPTION
        {
            column: {
                data: 'deployment.description',
                className: 'product-description',
                title: 'Description',
                render: (_, __, row, meta) => {
                    const description = row?.deployment?.product?.description || '';
                    if (!description) return '';
                    const displayIndex = meta?.row ?? 0;

                    return (`
                        <span class="description-text">${description}</span>
                        ${description.length > 0 ? `
                            <div data-index="${displayIndex}" class="description-window">
                                ${description}
                            </div>
                        ` : ``}
                    `);
                },
            },
            searchPane: { show: true }
        },
        // YEAR
        {
            column: {
                data: 'deployment.product.publication_date',
                className: 'year-column',
                title: 'Year',
                render: (data, type) => {
                    const dateString = data;
                    const date = new Date(dateString);
                    const year = date.getFullYear();

                    if (type === 'sort') {
                        return date.getTime(); // Return timestamp for sorting
                    }

                    return year;
                },
            },
            searchPane: true
        },
        // FLAVOUR
        {
            column: {
                data: null,
                className: 'flavour-column',
                title: 'Flavor Name',
                render: (_, __, row) => {
                    const flavorName = row?.deployment?.dp_flavor?.name || '';
                    return flavorName;
                },
            },
            searchPane: true
        },
        // PRIVACY LOSS
        {
            column: {
                data: null,
                className: 'privacy-loss-column',
                title: 'Privacy Loss',
                render: (_, __, row) => {
                    const privacy_unit = row?.deployment?.privacy_loss.privacy_unit || null;
                    const privacy_parameters = row?.deployment?.privacy_loss?.privacy_parameters || {};
                    const epsilon = privacy_parameters.epsilon || null;
                    const delta = privacy_parameters.delta || null;
                    const rho = privacy_parameters.rho || null;

                    const elements = [];

                    if (privacy_unit) {
                        elements.push(`<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px">${privacy_unit}</div>`)
                    }
                    if (epsilon) {
                        const epsilonNum = parseFloat(epsilon);
                        const formattedEpsilon = epsilonNum < 0.01 ? epsilonNum.toExponential(2) : epsilonNum.toString();
                        elements.push(`ε:&nbsp;${formattedEpsilon}<br>`)
                    }
                    if (delta) {
                        const deltaNum = parseFloat(delta);
                        const formattedDelta = deltaNum < 0.01 ? deltaNum.toExponential(2) : deltaNum.toString();
                        elements.push(`δ:&nbsp;${formattedDelta}<br>`)
                    }
                    if (rho) {
                        const rhoNum = parseFloat(rho);
                        const formattedRho = rhoNum < 0.01 ? rhoNum.toExponential(2) : rhoNum.toString();
                        elements.push(`ρ:&nbsp;${formattedRho}<br>`)
                    }

                    return elements.join('');
                },
            },
            searchPane: {
                show: true,
                config: privacyUnitSearchPaneConfig,
            },
        },
        // MODEL
        {
            column: {
                data: null,
                className: 'model-column',
                title: 'Model',
                render: (_, __, row) => {
                    const modelName = row?.deployment?.model?.model_name || '';
                    return modelName;
                },
            },
            searchPane: true
        },
        // ACCOUNTING
        {
            column: {
                data: null,
                className: 'accounting-column',
                title: 'Accounting',
                render: () => {
                    return '-';
                },
            },
            searchPane: { show: false },
			columnDef: { orderable: false },
        },
        // IMPLEMENTATION
        {
            column: {
                data: null,
                className: 'implementation-column',
                title: 'Implementation',
                render: () => {
                    return '-';
                },
            },
            searchPane: { show: false },
			columnDef: { orderable: false },
        },
    ];

    const classNamePrefix = 'header-col-idx-';
    columnsConfig.forEach((c, index) => {
        c.colIdx = index;
        let columnDef = c.columnDef || {};
        let headerAttributes = c.headerAttributes || {};

        const uniqueClassName = `${classNamePrefix}${index}`;

        c.searchPaneClassName = uniqueClassName;

        // Add default className
        columnDef.className = `${columnDef.className ?? ''} ${uniqueClassName}`;
        columnDef.targets = [index];

        // Add default data attributes
        headerAttributes['data-col-idx'] = index;
        headerAttributes['data-col-title'] = c.column.title.toLowerCase().replace(/\s+/g, '-');
        headerAttributes['id'] = `header-${c.column.title.toLowerCase().replace(/\s+/g, '-')}-${index}`;

        if ('searchPane' in c) {
            if (typeof c.searchPane === 'boolean') {
                const header = c.column.title;
                const columnDefConfig = {
                    searchPanes: {
                        header,
                        className: `${header.toLowerCase().replace(' ', '-')}-filter ${uniqueClassName}`
                    },
                };

                // Merge with existing columnDef if it exists (for headerClassName)
                columnDef = { ...columnDef, ...columnDefConfig };
            } else if(typeof c.searchPane === 'object' && c.searchPane.show && 'config' in c.searchPane) {
                let searchPanes = [];
                if(Array.isArray(c.searchPane.config)) {
                    searchPanes = c.searchPane.config;
                } else {
                    searchPanes.push(c.searchPane.config);
                }

                searchPanes.forEach(sp => {
                    sp.className = `${sp.className ?? ''} ${uniqueClassName}`;
                });
            }
        }

        c.columnDef = columnDef;
        c.headerAttributes = { ...headerAttributes };
    });

    return columnsConfig;
}

