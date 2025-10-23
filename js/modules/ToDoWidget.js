import { UIComponent } from './UIComponent.js';

export class ToDoWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '📝 Мои задачи'
        });
        this.tasks = this.loadTasks();
        this.filter = 'all';
        this.searchQuery = '';
    }

    renderContent() {
        const filteredTasks = this.getFilteredTasks();
        const completedCount = this.tasks.filter(t => t.completed).length;
        const activeCount = this.tasks.filter(t => !t.completed).length;

        return `
            <div class="todo-container">
                <div class="todo-input-section">
                    <div class="todo-quick-input">
                        <input type="text" class="todo-input" placeholder="✏️ Что нужно сделать?" maxlength="200">
                        <button class="todo-add-btn">➕ Добавить</button>
                    </div>
                    
                    <div class="task-options hidden">
                        <div class="option-row">
                            <label>📅 Срок:</label>
                            <input type="date" class="due-date-input">
                        </div>
                        <div class="option-row">
                            <label>🚨 Приоритет:</label>
                            <select class="priority-select">
                                <option value="">Без приоритета</option>
                                <option value="low">🔵 Низкий</option>
                                <option value="medium">🟡 Средний</option>
                                <option value="high">🔴 Высокий</option>
                            </select>
                        </div>
                        <button class="save-options-btn">💾 Сохранить с настройками</button>
                    </div>
                    
                    <button class="toggle-options-btn">⚙️ Дополнительно</button>
                </div>

                <div class="todo-controls">
                    <div class="todo-filters">
                        <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all">
                            Все (${this.tasks.length})
                        </button>
                        <button class="filter-btn ${this.filter === 'active' ? 'active' : ''}" data-filter="active">
                            Активные (${activeCount})
                        </button>
                        <button class="filter-btn ${this.filter === 'completed' ? 'active' : ''}" data-filter="completed">
                            Выполненные (${completedCount})
                        </button>
                    </div>
                    
                    <div class="todo-search">
                        <input type="text" class="search-input" placeholder="🔍 Поиск..." value="${this.searchQuery}">
                    </div>
                </div>

                <div class="todo-stats">
                    <div class="stat-badge">
                        <span class="stat-number">${this.tasks.length}</span>
                        <span class="stat-label">всего</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-number">${completedCount}</span>
                        <span class="stat-label">выполнено</span>
                    </div>
                    <div class="stat-badge">
                        <span class="stat-number">${activeCount}</span>
                        <span class="stat-label">активно</span>
                    </div>
                </div>

                <div class="todo-list-container" id="todo-list-container">
                    ${filteredTasks.length === 0 ? this.renderEmptyState() : `
                        <ul class="todo-list">
                            ${filteredTasks.map(task => this.renderTaskItem(task)).join('')}
                        </ul>
                    `}
                </div>

                <div class="todo-footer">
                    <div class="progress-info">
                        <div class="progress-text">
                            Прогресс: ${completedCount}/${this.tasks.length} (${this.getCompletionPercentage()}%)
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this.getCompletionPercentage()}%"></div>
                        </div>
                    </div>
                    <div class="footer-actions">
                        <button class="footer-btn clear-completed" ${completedCount === 0 ? 'disabled' : ''}>
                            🗑️ Очистить выполненные
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderTaskItem(task) {
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        const priorityClass = task.priority ? `priority-${task.priority}` : '';
        
        return `
            <li class="todo-item ${task.completed ? 'completed' : ''} ${priorityClass} ${isOverdue ? 'overdue' : ''}" 
                data-id="${task.id}">
                
                <div class="task-main">
                    <label class="checkbox-container">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-checkbox">
                        <span class="checkmark"></span>
                    </label>
                    
                    <div class="task-content">
                        <div class="task-text">${task.text}</div>
                        ${this.renderTaskMeta(task)}
                    </div>
                </div>

                <div class="task-actions">
                    <button class="task-btn delete-btn" title="Удалить" data-action="delete">
                        🗑️
                    </button>
                </div>
            </li>
        `;
    }

    renderTaskMeta(task) {
        const meta = [];
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const isToday = dueDate.toDateString() === new Date().toDateString();
            const isOverdue = dueDate < new Date() && !task.completed;
            
            meta.push(`
                <div class="task-meta due-date ${isToday ? 'today' : ''} ${isOverdue ? 'overdue' : ''}">
                    📅 ${isToday ? 'Сегодня' : dueDate.toLocaleDateString('ru-RU')}
                </div>
            `);
        }
        
        if (task.priority) {
            meta.push(`
                <div class="task-meta priority ${task.priority}">
                    ${this.getPriorityIcon(task.priority)} ${this.getPriorityText(task.priority)}
                </div>
            `);
        }
        
        return meta.length > 0 ? `<div class="task-meta-container">${meta.join('')}</div>` : '';
    }

    renderEmptyState() {
        const emptyStates = {
            all: '🎉 Отличная работа! Все задачи выполнены.',
            active: '✅ Нет активных задач. Можно отдохнуть!',
            completed: '📝 Выполненных задач пока нет.',
            search: '🔍 По вашему запросу ничего не найдено.'
        };
        
        const stateKey = this.searchQuery ? 'search' : this.filter;
        
        return `
            <div class="empty-state">
                <div class="empty-icon">${this.getEmptyStateIcon()}</div>
                <div class="empty-text">${emptyStates[stateKey] || emptyStates.all}</div>
                ${this.searchQuery ? `
                    <button class="clear-search-btn">Очистить поиск</button>
                ` : ''}
            </div>
        `;
    }

    bindEvents() {
        super.bindEvents();

        const addBtn = this.element.querySelector('.todo-add-btn');
        const input = this.element.querySelector('.todo-input');
        const toggleOptionsBtn = this.element.querySelector('.toggle-options-btn');
        const saveOptionsBtn = this.element.querySelector('.save-options-btn');
        const searchInput = this.element.querySelector('.search-input');
        const clearCompleted = this.element.querySelector('.clear-completed');

        this.addListener(addBtn, 'click', () => this.addSimpleTask(input.value));
        this.addListener(input, 'keypress', (e) => {
            if (e.key === 'Enter') this.addSimpleTask(input.value);
        });

        this.addListener(toggleOptionsBtn, 'click', () => this.toggleOptions());
        this.addListener(saveOptionsBtn, 'click', () => this.addTaskWithOptions(input.value));

        const filterBtns = this.element.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                this.filter = e.target.dataset.filter;
                this.updateFilters();
                this.renderTaskList();
            });
        });

        this.addListener(searchInput, 'input', (e) => {
            this.searchQuery = e.target.value;
            this.renderTaskList();
        });

        this.addListener(clearCompleted, 'click', () => this.clearCompleted());

        this.addListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                const todoItem = e.target.closest('.todo-item');
                if (todoItem) {
                    const taskId = todoItem.dataset.id;
                    this.deleteTask(taskId);
                    return;
                }
            }

            if (e.target.classList.contains('task-checkbox') || e.target.closest('.task-checkbox')) {
                const todoItem = e.target.closest('.todo-item');
                if (todoItem) {
                    const taskId = todoItem.dataset.id;
                    this.toggleTask(taskId);
                    return;
                }
            }

            if (e.target.classList.contains('clear-search-btn')) {
                this.searchQuery = '';
                this.renderTaskList();
                return;
            }
        });
    }

    addSimpleTask(text) {
        const input = this.element.querySelector('.todo-input');
        if (!text.trim()) return;

        const task = {
            id: 'task-' + Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        if (input) input.value = '';
        this.renderTaskList();
        this.saveTasks();
    }

    addTaskWithOptions(text) {
        const input = this.element.querySelector('.todo-input');
        const dueDateInput = this.element.querySelector('.due-date-input');
        const prioritySelect = this.element.querySelector('.priority-select');

        if (!text.trim()) {
            alert('Введите текст задачи!');
            return;
        }

        const task = {
            id: 'task-' + Date.now(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: dueDateInput.value ? new Date(dueDateInput.value).toISOString() : null,
            priority: prioritySelect.value || null
        };

        this.tasks.push(task);
        
        if (input) input.value = '';
        if (dueDateInput) dueDateInput.value = '';
        if (prioritySelect) prioritySelect.value = '';
        
        this.toggleOptions();
        this.renderTaskList();
        this.saveTasks();
    }

    deleteTask(taskId) {
        if (confirm('Удалить задачу?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.renderTaskList();
            this.saveTasks();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.renderTaskList();
            this.saveTasks();
        }
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.renderTaskList();
        this.saveTasks();
    }

    toggleOptions() {
        const optionsSection = this.element.querySelector('.task-options');
        const toggleBtn = this.element.querySelector('.toggle-options-btn');
        
        optionsSection.classList.toggle('hidden');
        toggleBtn.textContent = optionsSection.classList.contains('hidden') ? '⚙️ Дополнительно' : '✖️ Скрыть';
    }

    updateFilters() {
        const filterBtns = this.element.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.filter);
        });
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        if (this.filter === 'active') {
            filtered = filtered.filter(task => !task.completed);
        } else if (this.filter === 'completed') {
            filtered = filtered.filter(task => task.completed);
        }

        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return filtered;
    }

    getCompletionPercentage() {
        if (this.tasks.length === 0) return 0;
        const completedCount = this.tasks.filter(t => t.completed).length;
        return Math.round((completedCount / this.tasks.length) * 100);
    }

    getPriorityIcon(priority) {
        const icons = {
            low: '🔵',
            medium: '🟡',
            high: '🔴'
        };
        return icons[priority] || '⚪';
    }

    getPriorityText(priority) {
        const texts = {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий'
        };
        return texts[priority] || 'Без приоритета';
    }

    getEmptyStateIcon() {
        const icons = {
            all: '🎉',
            active: '✅',
            completed: '📝',
            search: '🔍'
        };
        const stateKey = this.searchQuery ? 'search' : this.filter;
        return icons[stateKey] || icons.all;
    }

    renderTaskList() {
        const container = this.element.querySelector('#todo-list-container');
        if (container) {
            const filteredTasks = this.getFilteredTasks();
            container.innerHTML = filteredTasks.length === 0 ? 
                this.renderEmptyState() : 
                `<ul class="todo-list">${filteredTasks.map(task => this.renderTaskItem(task)).join('')}</ul>`;
        }
        
        this.updateStats();
        this.updateFilters();
    }

    updateStats() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        const activeCount = this.tasks.filter(t => !t.completed).length;
        
        const filterBtns = this.element.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            const filter = btn.dataset.filter;
            let count = this.tasks.length;
            if (filter === 'active') count = activeCount;
            if (filter === 'completed') count = completedCount;
            
            btn.textContent = `${this.getFilterText(filter)} (${count})`;
        });

        const stats = this.element.querySelector('.todo-stats');
        if (stats) {
            stats.innerHTML = `
                <div class="stat-badge">
                    <span class="stat-number">${this.tasks.length}</span>
                    <span class="stat-label">всего</span>
                </div>
                <div class="stat-badge">
                    <span class="stat-number">${completedCount}</span>
                    <span class="stat-label">выполнено</span>
                </div>
                <div class="stat-badge">
                    <span class="stat-number">${activeCount}</span>
                    <span class="stat-label">активно</span>
                </div>
            `;
        }

        const progressFill = this.element.querySelector('.progress-fill');
        const progressText = this.element.querySelector('.progress-text');
        if (progressFill) {
            progressFill.style.width = `${this.getCompletionPercentage()}%`;
        }
        if (progressText) {
            progressText.textContent = `Прогресс: ${completedCount}/${this.tasks.length} (${this.getCompletionPercentage()}%)`;
        }

        const clearBtn = this.element.querySelector('.clear-completed');
        if (clearBtn) {
            clearBtn.disabled = completedCount === 0;
        }
    }

    getFilterText(filter) {
        const texts = {
            all: 'Все',
            active: 'Активные',
            completed: 'Выполненные'
        };
        return texts[filter] || filter;
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem(`todo-${this.id}`);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem(`todo-${this.id}`, JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
        }
    }

    onDestroy() {
        this.saveTasks();
    }
}