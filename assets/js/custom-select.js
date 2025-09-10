// Reusable CustomSelect component (vanilla JS)
// Usage:
//   const cs = new CustomSelect(containerElement, 'Placeholder');
//   cs.updateOptions(['A','B']); // or [{ value:'a', label:'Option A' }, ...]
//   cs.onChange = (val) => { ... };
// Supports both string arrays and objects with value/label for backward compatibility.

(function (global) {
    class CustomSelect {
        constructor (container, placeholder = '', id = '') {
            if (!container) throw new Error('CustomSelect: container required');
            this.container = container;
            if(id.length > 0) this.id = id;
            this.placeholder = placeholder;
            this.value = '';
            this.options = []; // stored normalized objects { value, label }
            this.isOpen = false;
            this.onChange = null;
            this._render();
            this._bind();
        }
        _render() {
            this.container.innerHTML = `
                <div class="custom-select" ${this.id ? `id="${this.id}"` : ''}>
                    <div class="custom-select-trigger">
                        <span class="custom-select-value">${this.placeholder}</span>
                        <i class="material-symbols-rounded icon chevron">keyboard_arrow_down</i>
                    </div>
                    <div class="custom-select-options">
                        ${this.placeholder.length > 0 ? `<div class="custom-select-option placeholder" data-value="">${this.placeholder}</div>` : ``}
                    </div>
                </div>`;
            this.trigger = this.container.querySelector('.custom-select-trigger');
            this.valueElement = this.container.querySelector('.custom-select-value');
            this.optionsContainer = this.container.querySelector('.custom-select-options');
        }
        _bind() {
            this.trigger.addEventListener('click', () => this.toggle());
            document.addEventListener('click', (e) => { if (!this.container.contains(e.target)) this.close(); });
            this.optionsContainer.addEventListener('click', (e) => {
                const opt = e.target.closest('.custom-select-option');
                if (opt) this.selectOption(opt.dataset.value, opt.textContent);
            });
        }
        toggle() { this.isOpen ? this.close() : this.open(); }
        open() { this.isOpen = true; this.container.querySelector('.custom-select').classList.add('open'); }
        close() { this.isOpen = false; this.container.querySelector('.custom-select').classList.remove('open'); }
        selectOption(value, text) {
            this.value = value;
            this.valueElement.textContent = text;
            this.close();
            if (typeof this.onChange === 'function') this.onChange(value);
        }
        updateOptions(options) {
            // Normalize options to objects
            this.options = (options || []).map(o => typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value });
            let placeholderHTML = '';
            if (this.placeholder.length > 0) {
                placeholderHTML = `<div class="custom-select-option" data-value="">${this.placeholder}</div>`;
            }
            this.optionsContainer.innerHTML = placeholderHTML + this.options.map(o => `<div class="custom-select-option" data-value="${o.value}">${o.label}</div>`).join('');
        }
        setValue(value) {
            this.value = value;
            if (!value) { this.valueElement.textContent = this.placeholder; return; }
            const found = this.options.find(o => o.value === value);
            this.valueElement.textContent = found ? found.label : value;
        }
    }
    // Expose globally (do not overwrite if already defined to allow override)
    if (!global.CustomSelect) global.CustomSelect = CustomSelect;
})(window);
