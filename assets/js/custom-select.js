// Reusable CustomSelect component (vanilla JS)
// Usage:
//   const cs = new CustomSelect(containerElement, 'Placeholder');
//   cs.updateOptions(['A','B']); // or [{ value:'a', label:'Option A' }, ...]
//   cs.onChange = (val) => { ... };
// Supports both string arrays and objects with value/label for backward compatibility.

(function (global) {
    class CustomSelect {
        constructor (container, placeholder = '') {
            if (!container) throw new Error('CustomSelect: container required');
            this.container = container;
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
        <div class="custom-select">
          <div class="custom-select-trigger">
            <span class="custom-select-value">${this.placeholder}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none">
              <mask id="mask0_cs" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="20">
                <rect x="0.666626" width="20" height="20" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask0_cs)">
                <path d="M8.62927 8.72917L11.3626 5.99583C11.4848 5.87361 11.6265 5.8125 11.7876 5.8125C11.9487 5.8125 12.0904 5.87361 12.2126 5.99583C12.3348 6.11806 12.3959 6.25972 12.3959 6.42083C12.3959 6.58194 12.3329 6.7255 12.2069 6.8515L9.04593 10.0125C8.98593 10.0681 8.92093 10.1097 8.85093 10.1375C8.78093 10.1653 8.70593 10.1792 8.62593 10.1792C8.54593 10.1792 8.47093 10.1653 8.40093 10.1375C8.33093 10.1097 8.26816 10.0681 8.2126 10.0125L5.0516 6.8515C4.9256 6.7255 4.86538 6.58472 4.87093 6.42917C4.87649 6.27361 4.94038 6.13472 5.0626 6.0125C5.18482 5.89028 5.32649 5.82917 5.4876 5.82917C5.64871 5.82917 5.79038 5.89028 5.9126 6.0125L8.62927 8.72917Z" fill="#3A3A3A"/>
              </g>
            </svg>
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
