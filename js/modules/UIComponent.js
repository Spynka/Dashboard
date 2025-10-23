export class UIComponent {
    constructor(config = {}) {
        this.id = config.id || `widget-${Date.now()}`;
        this.title = config.title || 'Widget';
        this.slotId = config.slotId;
        this.element = null;
        this.eventListeners = [];
        this.abortController = null;
        this.isInitialized = false;
    }

    render() {
        if (!this.slotId) {
            console.error('No slotId provided for widget:', this.title);
            return null;
        }

        const slot = document.getElementById(this.slotId);
        if (!slot) {
            console.error('Slot not found:', this.slotId);
            return null;
        }

        this.clearEventListeners();

        this.element = document.createElement('div');
        this.element.className = 'widget';
        this.element.id = this.id;
        
        this.element.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${this.title}</h3>
                <div class="widget-controls">
                    <button class="widget-btn minimize-btn">−</button>
                    <button class="widget-btn close-btn">×</button>
                </div>
            </div>
            <div class="widget-content">
                ${this.renderContent()}
            </div>
        `;

        slot.appendChild(this.element);
        
        if (!this.isInitialized) {
            this.initialize();
            this.isInitialized = true;
        }
        
        this.bindEvents();
        
        return this.element;
    }

    initialize() {
    }

    renderContent() {
        return '<p>Базовый виджет</p>';
    }
    
    refresh() {
        if (this.element) {
            const contentElement = this.element.querySelector('.widget-content');
            if (contentElement) {
                this.clearEventListeners();
                contentElement.innerHTML = this.renderContent();
                this.bindEvents();
            }
        }
    }

    addListener(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.push({ element, event, handler });
        }
    }

    clearEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    bindEvents() {
        const closeBtn = this.element?.querySelector('.close-btn');
        const minimizeBtn = this.element?.querySelector('.minimize-btn');

        if (closeBtn) {
            this.addListener(closeBtn, 'click', () => this.destroy());
        }
        if (minimizeBtn) {
            this.addListener(minimizeBtn, 'click', () => this.toggleMinimize());
        }
    }

    toggleMinimize() {
        const content = this.element?.querySelector('.widget-content');
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    }

    abortAllOperations() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    destroy() {
        this.abortAllOperations();
        this.clearEventListeners();
        this.isInitialized = false;

        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}