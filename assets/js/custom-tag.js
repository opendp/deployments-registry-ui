// Reusable CustomSelect component (vanilla JS)
// Usage:
//   const cs = new CustomSelect(containerElement, 'label', 'className');
//   cs.onClose = () => { ... };
// Supports optional close button if onClose is set.

(function (global) {
    class CustomTag {
        constructor (container, label = '', className = '') {
            if (!container) throw new Error('CustomTag: container required');
            if (!label) throw new Error('CustomTag: label required');

            this.container = container;
            this.label = label;
            this.className = className;
            this.onClose = null;
            this._render();

            if(this.onClose) {
                this._bind();
            }
        }
        _render() {
            this.container.innerHTML = `
                <div class="tag ${this.className}">
                    <div class="label">
                        <span>${this.label}</span>
                    </div>
                    ${this.onClose ? `<i class="material-symbols-rounded icon close-button">close</i>` : ''}
                </div>`;
            this.closeButton = this.container.querySelector('.close-button');
        }
        _bind() {
            this.closeButton.addEventListener('click', () => this.close());
        }
        close() { this.onClose(); }
    }

    CustomTag.variants = Object.freeze([
        'neutral-900',
        // 'neutral-800',
        'neutral-700',
        'neutral-600',
        'neutral-500',
        'neutral-400',
    ]);

    // Expose globally (do not overwrite if already defined to allow override)
    if (!global.CustomTag) global.CustomTag = CustomTag;
})(window);
