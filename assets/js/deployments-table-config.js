/* global CustomTag */
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Helper function to parse markdown with optional wrapper class
function parseInlineMarkdown(text, wrapperClass = '', truncate = false, startIndex = 0, endIndex = null) {
    // Handle null, undefined, or non-string values
    if (text == null) {
        return '';
    }

    // If it's an object, try to extract meaningful content
    if (typeof text === 'object') {
        // If it's an array, join the elements
        if (Array.isArray(text)) {
            text = text.join(', ');
        } else {
            // For other objects, convert to string or return empty
            text = text.toString();
            if (text === '[object Object]') {
                return '';
            }
        }
    }

    // Convert to string and parse markdown
    const parsed = marked.parse(String(text));

    let displayText = parsed;
    if (truncate) {
        if(!endIndex) {
            endIndex = parsed.length;
        }
        displayText = parsed.substring(startIndex, endIndex);
    }

    return `<span class="inline-markdown ${wrapperClass}">${displayText}</span>`;
}

// columnsConfig.js
const DESCRIPTION_CHAR_LIMIT = 100;

export function getColumnsConfig(deploymentsData) {
    // Load deployment hints
    let deploymentHints = {};
    const hintsScript = document.getElementById('deployment-hints');
    if (hintsScript) {
        try {
            deploymentHints = JSON.parse(hintsScript.textContent);

            if (!deploymentHints.tile_names) {
                throw new Error('Missing tile_names in deployment hints');
            }
        } catch (e) {
            console.warn('Encountered error parsing deployment hints JSON: \n', e);
        }
    }

    const tierSet = new Set();
    const productSet = new Set();
    const curatorSet = new Set();
    const privacyUnitSet = new Set();
    const AccountingTagsSet = new Set();
    const ImplementationTagsSet = new Set();

    deploymentsData.forEach(dep => {
        const { tier } = dep;
        // Safe extraction with defaults so missing keys don't create sparse/shift issues.
        const deployment = dep?.deployment || {};
        const data_product_type = deployment.product.data_product_type ?? '';
        const data_curators = deployment.product.data_curators ?? null; // may be array or string; null if absent
        const privacy_unit = deployment.privacy_loss?.privacy_unit ?? '';
        const accounting = deployment.accounting || {};
        const implementation = deployment.implementation || {};

        if (tier) tierSet.add(tier);
        if (data_product_type) productSet.add(data_product_type);
        if (data_curators) {
            if (Array.isArray(data_curators)) {
                data_curators.forEach(curator => curatorSet.add(curator));
            } else {
                curatorSet.add(data_curators);
            }
        }
        if (privacy_unit) privacyUnitSet.add(privacy_unit);
        if (Object.keys(accounting).length > 0) {
            Object.keys(accounting).forEach(key => {
                AccountingTagsSet.add(key);
            });
        }
        if (Object.keys(implementation).length > 0) {
            Object.keys(implementation).forEach(key => {
                ImplementationTagsSet.add(key);
            });
        }
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
        className: 'product-filter product-type-filter',
        header: 'Product Type',
        options: Array.from(productSet).map(product => ({
            label: product,
            value: function (rowData) {
                return rowData?.deployment?.product?.data_product_type === product;
            }
        }))
    };

    // curator search pane config
    const curatorSearchPaneConfig = {
        className: 'product-filter curator-filter',
        header: 'Curator',
        options: Array.from(curatorSet).map(curator => ({
            label: curator,
            value: function (rowData) {
                const curators = rowData?.deployment?.product.data_curators;
                if (Array.isArray(curators)) {
                    return curators.includes(curator);
                } else if (typeof curators === 'string') {
                    return curators === curator;
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

    function getTagName(key) {
        const shortNames = deploymentHints?.tile_names || {};
        return key in shortNames ? shortNames[key] : key.replaceAll('_', ' ');
    }
    function showTag(value) {
        return(value
            && value.trim().length > 0
            && value !== "No information provided")
    }

    const AccountingSearchPaneConfig = {
        className: 'accounting-filter',
        header: 'Accounting',
        options: Array.from(AccountingTagsSet).map(accountingTag => ({
            label: getTagName(accountingTag),
            value: function (rowData) {
                const tagValue = rowData?.deployment?.accounting?.[accountingTag];
                return showTag(tagValue);
            }
        }))
    };

    const ImplementationSearchPaneConfig = {
        className: 'implementation-filter',
        header: 'Implementation',
        options: Array.from(ImplementationTagsSet).map(implementationTag => ({
            label: getTagName(implementationTag),
            value: function (rowData) {
                const tagValue = rowData?.deployment?.implementation?.[implementationTag];
                return showTag(tagValue);
            }
        }))
    };

    function appendTags(container, config) {
        const variants = CustomTag.variants;

        Object.entries(config).forEach(([key, value], idx) => {
            if (showTag(value)) {
                const cont = document.createElement('div');
                cont.classList.add(`${key}-tag-container`);
                container.appendChild(cont);

                new CustomTag(cont, getTagName(key), `variant-${variants[idx % variants.length]}`);
            }
        });
    }

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
                        <div class="deployment-name" style="color: #181818; font-weight: 500; margin-bottom: 4px">${parseInlineMarkdown(name)}</div>
                        <div>by ${parseInlineMarkdown(data_curators, 'curators-list')}</div>
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
                render: (_, type, row, meta) => {
                    const description = row?.deployment?.product?.description || '';
                    if (!description) return '';

                    // For sorting, return the full description text
                    if (type === 'sort' || type === 'type') {
                        return description;
                    }

                    const displayIndex = meta?.row ?? 0;

                    const descriptionCell = document.createElement('div');
                    descriptionCell.classList.add('description-cell');
                    descriptionCell.setAttribute('data-index', displayIndex);

                    const descriptionText = document.createElement('span');
                    descriptionText.classList.add('description-text', 'truncate');

                    descriptionCell.appendChild(descriptionText);

                    const truncatedText = document.createElement('span');
                    truncatedText.classList.add('truncated-text');
                    truncatedText.innerHTML = parseInlineMarkdown(description, '', true, 0, DESCRIPTION_CHAR_LIMIT);

                    descriptionText.appendChild(truncatedText);

                    if (description.length > DESCRIPTION_CHAR_LIMIT) {
                        const ellipsisSpan = document.createElement('span');
                        ellipsisSpan.classList.add('ellipsis');
                        ellipsisSpan.textContent = '...';

                        const fullTextSpan = document.createElement('span');
                        fullTextSpan.classList.add('full-text');
                        fullTextSpan.innerHTML = parseInlineMarkdown(description);

                        const showMoreBtn = document.createElement('span');
                        showMoreBtn.classList.add('show-more-btn');
                        showMoreBtn.innerHTML = 'show <span class="more">more</span><span class="less">less</span>';

                        descriptionText.appendChild(ellipsisSpan);
                        descriptionText.appendChild(fullTextSpan);
                        descriptionText.appendChild(showMoreBtn);
                    }

                    descriptionCell.appendChild(descriptionText);

                    // Return the outer HTML of the constructed description cell
                    return descriptionCell.outerHTML;
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

                    // For sorting, return the timestamp
                    if (type === 'sort' || type === 'type') {
                        return date.getTime();
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
                    return parseInlineMarkdown(flavorName);
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
                render: (_, type, row) => {
                    const privacy_unit = row?.deployment?.privacy_loss.privacy_unit || null;
                    const privacy_parameters = row?.deployment?.privacy_loss?.privacy_parameters || {};
                    const epsilon = privacy_parameters.epsilon || null;
                    const delta = privacy_parameters.delta || null;
                    const rho = privacy_parameters.rho || null;

                    // For sorting, return a comparable value
                    if (type === 'sort' || type === 'type') {
                        let epsilonNum = epsilon ? parseFloat(epsilon) : 0;
                        let deltaNum = delta ? parseFloat(delta) : 0;
                        let rhoNum = rho ? parseFloat(rho) : 0;

                        // Create a composite sort value using smaller, safer multipliers
                        const sortValue = epsilonNum * 100000000 + deltaNum * 10000 + rhoNum;
                        return sortValue;
                    }
                    const elements = [];

                    if (privacy_unit) {
                        elements.push(`<div style="font-weight: 500; margin-bottom: 4px; font-size: 12px">${parseInlineMarkdown(privacy_unit)}</div>`)
                    }
                    if (epsilon) {
                        const epsilonNum = parseFloat(epsilon);
                        const formattedEpsilon = epsilonNum < 0.01 ? epsilonNum.toExponential(2) : epsilonNum.toString();
                        elements.push(`ϵ:&nbsp;${formattedEpsilon}<br>`)
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
                    return parseInlineMarkdown(modelName);
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
                render: (_, __, row) => {
                    const accounting = row?.deployment?.accounting || {};

                    const accountingCell = document.createElement('div');
                    accountingCell.classList.add('accounting-cell');

                    appendTags(accountingCell, accounting);

                    return accountingCell.outerHTML;
                },
            },
            searchPane: {
                show: true,
                config: AccountingSearchPaneConfig,
            },
            columnDef: { orderable: false },
        },
        // IMPLEMENTATION
        {
            column: {
                data: null,
                className: 'implementation-column',
                title: 'Implementation',
                render: (_, __, row) => {
                    const implementation = row?.deployment?.implementation || {};

                    const implementationCell = document.createElement('div');
                    implementationCell.classList.add('implementation-cell');

                    appendTags(implementationCell, implementation);

                    return implementationCell.outerHTML;
                },
            },
            searchPane: {
                show: true,
                config: ImplementationSearchPaneConfig,
            },
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
            headerAttributes['has-searchpane'] = 'true';

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
            } else if (typeof c.searchPane === 'object' && c.searchPane.show && 'config' in c.searchPane) {
                let searchPanes = [];
                if (Array.isArray(c.searchPane.config)) {
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

