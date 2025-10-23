import { ToDoWidget } from './ToDoWidget.js';
import { FocusTimerWidget } from './FocusTimerWidget.js';
import { CalendarWidget } from './CalendarWidget.js';
import { WeatherWidget } from './WeatherWidget.js';
import { DictionaryWidget } from './DictionaryWidget.js';

export class Dashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.widgets = new Map();
        this.widgetTypes = {
            'todo': ToDoWidget,
            'focus': FocusTimerWidget,
            'calendar': CalendarWidget,
            'weather': WeatherWidget,
            'dictionary': DictionaryWidget
        };
    }

    addWidget(widgetType, config = {}) {
        const WidgetClass = this.widgetTypes[widgetType];
        if (!WidgetClass) {
            console.error(`Unknown widget type: ${widgetType}`);
            return null;
        }

        try {
            const slotId = config.slotId || `widget-${widgetType}`;
            const existingWidget = this.findWidgetBySlotId(slotId);
            
            if (existingWidget) {
                const widgetElement = document.getElementById(slotId);
                if (widgetElement && widgetElement.style.display === 'none') {
                    widgetElement.style.display = 'block';
                }
                return existingWidget.id;
            }

            const widget = new WidgetClass(config);
            this.widgets.set(widget.id, widget);
            widget.render();
            
            return widget.id;
            
        } catch (error) {
            console.error(`Error creating widget ${widgetType}:`, error);
            return null;
        }
    }

    findWidgetBySlotId(slotId) {
        for (let [id, widget] of this.widgets) {
            if (widget.slotId === slotId) {
                return widget;
            }
        }
        return null;
    }

    findWidgetByType(widgetType) {
        for (let [id, widget] of this.widgets) {
            if (widget.constructor.name.toLowerCase().includes(widgetType.toLowerCase())) {
                return widget;
            }
        }
        return null;
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            widget.destroy();
            this.widgets.delete(widgetId);
        }
    }

    removeWidgetBySlotId(slotId) {
        const widget = this.findWidgetBySlotId(slotId);
        if (widget) {
            this.removeWidget(widget.id);
        }
    }
}