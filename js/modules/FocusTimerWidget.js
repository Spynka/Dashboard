import { UIComponent } from './UIComponent.js';

export class FocusTimerWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '⏱️ Фокус-таймер'
        });
        
        this.modes = {
            focus: { time: 25 * 60, name: 'Фокус', emoji: '🎯' },
            shortBreak: { time: 5 * 60, name: 'Короткий перерыв', emoji: '☕' },
            longBreak: { time: 15 * 60, name: 'Длинный перерыв', emoji: '🌴' }
        };
        
        this.currentMode = 'focus';
        this.timeLeft = this.modes.focus.time;
        this.isRunning = false;
        this.sessions = [];
        this.sessionCount = 0;
    }

    renderContent() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const progress = this.calculateProgress();
        
        return `
            <div class="focus-container">
                <div class="timer-display">
                    <div class="timer-circle">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="progress-ring-bg" cx="60" cy="60" r="54"></circle>
                            <circle class="progress-ring-fill" cx="60" cy="60" r="54" 
                                    stroke-dasharray="339.292" 
                                    stroke-dashoffset="${339.292 - (progress * 339.292)}">
                            </circle>
                        </svg>
                        <div class="timer-text">
                            <div class="time">${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</div>
                            <div class="mode">${this.modes[this.currentMode].emoji} ${this.modes[this.currentMode].name}</div>
                        </div>
                    </div>
                </div>

                <div class="timer-controls">
                    <button class="timer-btn start-btn ${this.isRunning ? 'active' : ''}">
                        ${this.isRunning ? '⏸️ Пауза' : '▶️ Старт'}
                    </button>
                    <button class="timer-btn reset-btn">⏹️ Сброс</button>
                    <button class="timer-btn skip-btn">⏭️ Пропустить</button>
                </div>

                <div class="mode-selector">
                    ${Object.entries(this.modes).map(([key, mode]) => `
                        <button class="mode-btn ${this.currentMode === key ? 'active' : ''}" 
                                data-mode="${key}">
                            ${mode.emoji} ${mode.name}
                        </button>
                    `).join('')}
                </div>

                <div class="focus-stats">
                    <div class="stats-grid">
                        <div class="stat-item">
                            <div class="stat-value">${this.sessionCount}</div>
                            <div class="stat-label">Сессии сегодня</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${Math.round(this.sessionCount * 25)}</div>
                            <div class="stat-label">Минут в фокусе</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${this.sessionCount % 4}/4</div>
                            <div class="stat-label">До перерыва</div>
                        </div>
                    </div>
                </div>

                <div class="quick-start">
                    <button class="quick-btn" data-minutes="15">🚀 15 мин</button>
                    <button class="quick-btn" data-minutes="30">⚡ 30 мин</button>
                    <button class="quick-btn" data-minutes="45">🔥 45 мин</button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        super.bindEvents();

        const startBtn = this.element.querySelector('.start-btn');
        const resetBtn = this.element.querySelector('.reset-btn');
        const skipBtn = this.element.querySelector('.skip-btn');
        const modeBtns = this.element.querySelectorAll('.mode-btn');
        const quickBtns = this.element.querySelectorAll('.quick-btn');

        if (startBtn) {
            this.addListener(startBtn, 'click', () => this.toggleTimer());
        }
        
        if (resetBtn) {
            this.addListener(resetBtn, 'click', () => this.resetTimer());
        }
        
        if (skipBtn) {
            this.addListener(skipBtn, 'click', () => this.skipSession());
        }

        modeBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                this.changeMode(e.target.dataset.mode);
            });
        });

        quickBtns.forEach(btn => {
            this.addListener(btn, 'click', (e) => {
                this.quickStart(parseInt(e.target.dataset.minutes));
            });
        });
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.updateControls();
        this.tick();
    }

    pauseTimer() {
        this.isRunning = false;
        this.updateControls();
    }

    resetTimer() {
        this.isRunning = false;
        this.timeLeft = this.modes[this.currentMode].time;
        this.updateDisplay();
        this.updateControls();
    }

    skipSession() {
        this.isRunning = false;
        this.completeSession(true);
    }

    tick() {
        if (this.isRunning && this.timeLeft > 0) {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft > 0) {
                setTimeout(() => this.tick(), 1000);
            } else {
                this.completeSession();
            }
        }
    }

    completeSession(skipped = false) {
        this.isRunning = false;
        
        if (!skipped) {
            this.sessionCount++;
            this.saveSessions();
            
            if (this.currentMode === 'focus') {
                this.showCompletionMessage('🎉 Фокус-сессия завершена! Время отдохнуть.');
            } else {
                this.showCompletionMessage('💤 Перерыв завершен! Возвращайтесь к работе.');
            }
        }
        
        this.autoSwitchMode();
    }

    autoSwitchMode() {
        if (this.currentMode === 'focus') {
            if (this.sessionCount % 4 === 0) {
                this.changeMode('longBreak');
            } else {
                this.changeMode('shortBreak');
            }
        } else {
            this.changeMode('focus');
        }
    }

    changeMode(mode) {
        this.currentMode = mode;
        this.timeLeft = this.modes[mode].time;
        this.resetTimer();
    }

    quickStart(minutes) {
        this.modes.focus.time = minutes * 60;
        this.changeMode('focus');
        this.startTimer();
    }

    calculateProgress() {
        const totalTime = this.modes[this.currentMode].time;
        return (totalTime - this.timeLeft) / totalTime;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeElement = this.element.querySelector('.time');
        const modeElement = this.element.querySelector('.mode');
        const progressElement = this.element.querySelector('.progress-ring-fill');
        const progress = this.calculateProgress();

        if (timeElement) {
            timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (modeElement) {
            modeElement.textContent = `${this.modes[this.currentMode].emoji} ${this.modes[this.currentMode].name}`;
        }

        if (progressElement) {
            progressElement.style.strokeDashoffset = 339.292 - (progress * 339.292);
        }

        this.updateStats();
    }

    updateControls() {
        const startBtn = this.element.querySelector('.start-btn');
        if (startBtn) {
            startBtn.textContent = this.isRunning ? '⏸️ Пауза' : '▶️ Старт';
            startBtn.classList.toggle('active', this.isRunning);
        }
    }

    updateStats() {
        const statValues = this.element.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = this.sessionCount;
        if (statValues[1]) statValues[1].textContent = Math.round(this.sessionCount * 25);
        if (statValues[2]) statValues[2].textContent = `${this.sessionCount % 4}/4`;
    }

    showCompletionMessage(message) {
        alert(message);
    }

    saveSessions() {
        try {
            const data = {
                sessions: this.sessions,
                count: this.sessionCount,
                lastUpdate: new Date().toISOString()
            };
            localStorage.setItem(`focus-sessions-${this.id}`, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save sessions:', error);
        }
    }

    loadSessions() {
        try {
            const stored = localStorage.getItem(`focus-sessions-${this.id}`);
            if (stored) {
                const data = JSON.parse(stored);
                this.sessions = data.sessions || [];
                this.sessionCount = data.count || 0;
            }
        } catch {
            this.sessions = [];
            this.sessionCount = 0;
        }
    }

    onDestroy() {
        if (this.isRunning) {
            this.pauseTimer();
        }
        this.saveSessions();
    }
}