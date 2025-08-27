// Reusable CustomMultiSelect component (vanilla JS)
// Usage:
//   const ms = new CustomMultiSelect(containerElement, 'Items');
//   ms.updateOptions(['A','B','C']);
//   ms.onChange = (values) => { ... };
// Exposed globally as window.CustomMultiSelect (only if not already defined).
// Mirrors styling/behavior conventions of CustomSelect.

(function (global) {
	class CustomMultiSelect {
		constructor (container, placeholder = 'Select...') {
			if (!container) throw new Error('CustomMultiSelect: container required');
			this.container = container;
			this.placeholder = placeholder;
			this.values = [];
			this.options = [];
			this.isOpen = false;
			this.onChange = null;
			this._render();
			this._bind();
		}

		_render() {
			this.container.innerHTML = `
				<div class="custom-multiselect">
					<div class="custom-multiselect-trigger">
						<div class="custom-multiselect-values">
							<span class="custom-multiselect-placeholder">${this.placeholder}</span>
						</div>
						<svg class="chevron-down-icon" width="17" height="16" viewBox="0 0 17 16" aria-hidden="true">
							<use href="/assets/icons.svg#chevron-down"></use>
						</svg>
					</div>
					<div class="custom-multiselect-options"></div>
				</div>`;
			this.trigger = this.container.querySelector('.custom-multiselect-trigger');
			this.valuesContainer = this.container.querySelector('.custom-multiselect-values');
			this.optionsContainer = this.container.querySelector('.custom-multiselect-options');
			this.placeholderElement = this.container.querySelector('.custom-multiselect-placeholder');
		}

		_bind() {
			this.trigger.addEventListener('click', () => this.toggle());
			document.addEventListener('click', (e) => { if (!this.container.contains(e.target)) this.close(); });
			this.optionsContainer.addEventListener('click', (e) => {
				e.stopPropagation();
				const opt = e.target.closest('.custom-multiselect-option');
				if (opt) this.toggleOption(opt.dataset.value);
			});
		}

		toggle() { this.isOpen ? this.close() : this.open(); }
		open() { this.isOpen = true; this.container.querySelector('.custom-multiselect').classList.add('open'); }
		close() { this.isOpen = false; this.container.querySelector('.custom-multiselect').classList.remove('open'); }

		toggleOption(value) {
			const idx = this.values.indexOf(value);
			if (idx > -1) this.values.splice(idx, 1); else this.values.push(value);
			this._updateDisplay();
			this._updateOptionStates();
			if (typeof this.onChange === 'function') this.onChange(this.values.slice());
		}

		_updateDisplay() {
			if (this.values.length === 0) {
				this.valuesContainer.innerHTML = `<span class="custom-multiselect-placeholder">${this.placeholder}</span>`;
			} else {
				this.valuesContainer.innerHTML = `<span class="custom-multiselect-count">${this.placeholder} ${this.values.length} selected</span>`;
			}
		}

		_updateOptionStates() {
			this.optionsContainer.querySelectorAll('.custom-multiselect-option').forEach(option => {
				const checkbox = option.querySelector('.checkbox-icon');
				const selected = this.values.includes(option.dataset.value);
				option.classList.toggle('selected', selected);
				if (checkbox) checkbox.style.color = selected ? '#0066CC' : 'white';
			});
		}

		updateOptions(options) {
			this.options = (options || []).slice();
			this.optionsContainer.innerHTML = '';
			this.options.forEach(opt => {
				const optionEl = document.createElement('div');
				optionEl.className = 'custom-multiselect-option';
				optionEl.dataset.value = opt;
				optionEl.id = `option-${opt}`;
				optionEl.innerHTML = `
					<div class="custom-checkbox">
						<svg class="checkbox-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
							<use href="/assets/icons.svg#checkbox-check"></use>
						</svg>
					</div>
					<span class="custom-multiselect-text">${opt}</span>`;
				this.optionsContainer.appendChild(optionEl);
			});
			this._updateOptionStates();
		}

		clearSelection() {
			this.values = [];
			this._updateDisplay();
			this._updateOptionStates();
		}

		getValues() { return this.values.slice(); }
	}

	if (!global.CustomMultiSelect) global.CustomMultiSelect = CustomMultiSelect;
})(window);
