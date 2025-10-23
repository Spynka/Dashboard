import { UIComponent } from './UIComponent.js';

export class CalendarWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '📅 Календарь'
        });
        
        this.events = config.events || [];
        this.currentDate = new Date();
        this.showingMonth = new Date();
    }

    renderContent() {
        return `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="nav-btn prev-month">◀</button>
                    <h3 class="current-month">${this.getMonthYearString()}</h3>
                    <button class="nav-btn next-month">▶</button>
                </div>
                
                <div class="calendar-grid">
                    ${this.renderCalendarDays()}
                </div>
                
                <div class="calendar-events">
                    <div class="events-header">
                        <h4>Ближайшие события</h4>
                        <button class="add-event-btn" title="Добавить событие">+</button>
                    </div>
                    <div class="events-list">
                        ${this.renderEventsList()}
                    </div>
                </div>
                
                <div class="calendar-actions">
                    <button class="sync-btn">🔄 Синхронизировать</button>
                    <button class="today-btn">Сегодня</button>
                </div>
            </div>
        `;
    }

    renderCalendarDays() {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        let html = '';
        
        days.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });
        
        const firstDay = new Date(this.showingMonth.getFullYear(), this.showingMonth.getMonth(), 1);
        const lastDay = new Date(this.showingMonth.getFullYear(), this.showingMonth.getMonth() + 1, 0);
        
        const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = 0; i < startDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }
        
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.showingMonth.getFullYear(), this.showingMonth.getMonth(), day);
            const isToday = this.isToday(date);
            const hasEvents = this.hasEventsOnDate(date);
            const dayClass = `calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`;
            
            html += `
                <div class="${dayClass}" data-date="${date.toISOString()}">
                    <span class="day-number">${day}</span>
                    ${hasEvents ? '<span class="event-dot"></span>' : ''}
                </div>
            `;
        }
        
        return html;
    }

    renderEventsList() {
        if (this.events.length === 0) {
            return '<p class="no-events">Нет событий на сегодня</p>';
        }
        
        const todayEvents = this.getEventsForDate(new Date());
        if (todayEvents.length === 0) {
            return '<p class="no-events">Нет событий на сегодня</p>';
        }
        
        return todayEvents
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .map(event => `
                <div class="event-item" data-event-id="${event.id}">
                    <div class="event-time">${this.formatTime(event.startTime)}</div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    </div>
                    <button class="delete-event-btn" title="Удалить">×</button>
                </div>
            `).join('');
    }

    bindEvents() {
        super.bindEvents();
        
        const syncBtn = this.element.querySelector('.sync-btn');
        const todayBtn = this.element.querySelector('.today-btn');
        const prevBtn = this.element.querySelector('.prev-month');
        const nextBtn = this.element.querySelector('.next-month');
        const addEventBtn = this.element.querySelector('.add-event-btn');
        const calendarDays = this.element.querySelectorAll('.calendar-day:not(.empty)');
        
        this.addListener(syncBtn, 'click', () => this.syncCalendar());
        this.addListener(todayBtn, 'click', () => this.goToToday());
        this.addListener(prevBtn, 'click', () => this.previousMonth());
        this.addListener(nextBtn, 'click', () => this.nextMonth());
        this.addListener(addEventBtn, 'click', () => this.showAddEventForm());
        
        calendarDays.forEach(day => {
            this.addListener(day, 'click', (e) => this.onDayClick(e, day));
        });
        
        this.addListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('delete-event-btn')) {
                const eventItem = e.target.closest('.event-item');
                this.deleteEvent(eventItem.dataset.eventId);
            }
        });
    }

    syncCalendar() {
        this.showLoading('Синхронизация...');
        
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('Календарь синхронизирован', 'success');
        }, 1500);
    }

    goToToday() {
        this.showingMonth = new Date();
        this.refresh();
    }

    previousMonth() {
        this.showingMonth.setMonth(this.showingMonth.getMonth() - 1);
        this.refresh();
    }

    nextMonth() {
        this.showingMonth.setMonth(this.showingMonth.getMonth() + 1);
        this.refresh();
    }

    onDayClick(e, dayElement) {
        const date = new Date(dayElement.dataset.date);
        const events = this.getEventsForDate(date);
        
        if (events.length > 0) {
            this.showEventsForDate(date, events);
        } else {
            this.showAddEventForm(date);
        }
    }

    showAddEventForm(date = new Date()) {
        const title = prompt('Название события:');
        if (!title) return;
        
        const time = prompt('Время (ЧЧ:ММ):', '10:00');
        if (!time) return;
        
        const description = prompt('Описание (необязательно):');
        
        const [hours, minutes] = time.split(':');
        const startTime = new Date(date);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const newEvent = {
            id: Date.now().toString(),
            title,
            startTime: startTime.toISOString(),
            description,
            date: date.toISOString().split('T')[0]
        };
        
        this.events.push(newEvent);
        this.refresh();
        this.showNotification('Событие добавлено', 'success');
    }

    deleteEvent(eventId) {
        if (confirm('Удалить событие?')) {
            this.events = this.events.filter(event => event.id !== eventId);
            this.refresh();
            this.showNotification('Событие удалено', 'info');
        }
    }

    showEventsForDate(date, events) {
        const eventList = events.map(event => 
            `• ${this.formatTime(event.startTime)} - ${event.title}`
        ).join('\n');
        
        alert(`События на ${this.formatDate(date)}:\n\n${eventList}`);
    }

    getMonthYearString() {
        return this.showingMonth.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    hasEventsOnDate(date) {
        return this.events.some(event => 
            new Date(event.startTime).toDateString() === date.toDateString()
        );
    }

    getEventsForDate(date) {
        return this.events.filter(event => 
            new Date(event.startTime).toDateString() === date.toDateString()
        );
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    refresh() {
        const contentElement = this.element.querySelector('.widget-content');
        if (contentElement) {
            contentElement.innerHTML = this.renderContent();
            this.bindEvents();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showLoading(message) {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = message;
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 4px;
            z-index: 1000;
        `;
        
        document.body.appendChild(loading);
        this.currentLoading = loading;
    }

    hideLoading() {
        if (this.currentLoading) {
            this.currentLoading.remove();
            this.currentLoading = null;
        }
    }
}