import { Dashboard } from './modules/Dashboard.js';

class WorkdayFocusApp {
    constructor() {
        this.dashboard = new Dashboard('dashboard-container');
        this.widgetStates = new Map();
        this.widgetInstances = new Map();
        this.pageRefreshInterval = null;
        this.refreshInterval = 2 * 60 * 60 * 1000;
        this.init();
    }

    init() {
        this.updateDateTime();
        this.bindEvents();
        this.loadDefaultWidgets();
        this.startAutoRefresh();
    }

    startAutoRefresh() {
        this.pageRefreshInterval = setInterval(() => {
            this.refreshPage();
        }, this.refreshInterval);
    }

    refreshPage() {
        this.updateDateTime();
        this.refreshAllWidgets();
        this.showRefreshNotification('Данные обновлены');
    }

    refreshAllWidgets() {
        this.widgetInstances.forEach((widgetId, widgetType) => {
            if (widgetType === 'weather') return;
            
            const widget = this.dashboard.widgets.get(widgetId);
            if (widget && typeof widget.refresh === 'function') {
                try {
                    widget.refresh();
                } catch (error) {
                    console.error(`Error refreshing widget ${widgetType}:`, error);
                }
            }
        });
    }

    destroy() {
        if (this.pageRefreshInterval) {
            clearInterval(this.pageRefreshInterval);
            this.pageRefreshInterval = null;
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    bindEvents() {
        const buttons = [
            { id: 'add-todo-btn', type: 'todo' },
            { id: 'add-focus-btn', type: 'focus' },
            { id: 'add-calendar-btn', type: 'calendar' },
            { id: 'add-weather-btn', type: 'weather' },
            { id: 'add-dictionary-btn', type: 'dictionary' }
        ];

        buttons.forEach(button => {
            const element = document.getElementById(button.id);
            if (element) {
                element.addEventListener('click', () => {
                    this.toggleWidget(button.type);
                });
            }
        });
    }

    toggleWidget(widgetType) {
        const widgetId = `widget-${widgetType}`;
        const widgetElement = document.getElementById(widgetId);
        const widgetExists = this.widgetInstances.has(widgetType);
        
        if (!widgetExists) {
            const widgetInstanceId = this.dashboard.addWidget(widgetType, { slotId: widgetId });
            if (widgetInstanceId) {
                this.widgetInstances.set(widgetType, widgetInstanceId);
                this.widgetStates.set(widgetType, true);
                this.updateButtonState(widgetType, true);
            }
        } else {
            const isVisible = widgetElement.style.display !== 'none';
            widgetElement.style.display = isVisible ? 'none' : 'block';
            this.widgetStates.set(widgetType, !isVisible);
            this.updateButtonState(widgetType, !isVisible);
        }
    }

    updateButtonState(widgetType, isVisible) {
        const button = document.getElementById(`add-${widgetType}-btn`);
        if (button) {
            if (isVisible) {
                button.classList.add('active');
                button.title = `Скрыть ${this.getWidgetName(widgetType)}`;
            } else {
                button.classList.remove('active');
                button.title = `Показать ${this.getWidgetName(widgetType)}`;
            }
        }
    }

    getWidgetName(widgetType) {
        const names = {
            'todo': 'Список дел',
            'focus': 'Таймер фокуса',
            'calendar': 'Календарь',
            'weather': 'Погода',
            'dictionary': 'Словарь'
        };
        return names[widgetType] || widgetType;
    }

    loadDefaultWidgets() {
        const defaultWidgets = ['todo', 'focus', 'calendar', 'weather', 'dictionary'];
        
        defaultWidgets.forEach(widgetType => {
            const widgetId = `widget-${widgetType}`;
            
            if (!this.widgetInstances.has(widgetType)) {
                const widgetInstanceId = this.dashboard.addWidget(widgetType, { slotId: widgetId });
                if (widgetInstanceId) {
                    this.widgetInstances.set(widgetType, widgetInstanceId);
                    this.widgetStates.set(widgetType, true);
                    this.updateButtonState(widgetType, true);
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new WorkdayFocusApp();
    });
} else {
    window.app = new WorkdayFocusApp();
}