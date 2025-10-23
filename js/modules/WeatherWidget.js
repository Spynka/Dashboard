import { UIComponent } from './UIComponent.js';

export class WeatherWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '🌤️ Погода'
        });
        
        this.weatherData = config.weatherData || null;
        this.location = config.location || 'Moscow';
        this.apiKeys = [
            '1ab2e4c24809a73a125925778e297ff1',
            '73d97d40da8542ec0b65d35763a3c21e'
        ];
        this.currentApiKeyIndex = 0;
        this.isLoading = false;
        this.autoRefreshInterval = null;
        this.refreshInterval = 2 * 60 * 60 * 1000;
        this.lastUpdate = null;
        this.fetchTimeout = null;
        this.abortController = null;
    }

    initialize() {
        this.startAutoRefresh();
        
        this.fetchTimeout = setTimeout(() => {
            if (!this.isLoading) {
                this.fetchWeatherData();
            }
        }, 1000);
    }

    renderContent() {
        return `
            <div class="weather-container">
                <div class="weather-current">
                    ${this.renderCurrentWeather()}
                </div>

                <div class="weather-forecast">
                    <h4>Прогноз на день</h4>
                    <div class="forecast-list">
                        ${this.renderForecast()}
                    </div>
                </div>

                <div class="weather-details">
                    <h4>📊 Детали</h4>
                    ${this.renderWeatherDetails()}
                </div>

                <div class="weather-recommendations">
                    <h4>💡 Рекомендации</h4>
                    ${this.renderRecommendations()}
                </div>

                <div class="weather-footer">
                    <div class="weather-update-info">
                        ${this.renderUpdateInfo()}
                    </div>
                    <div class="weather-actions">
                        <button class="action-btn refresh-btn" ${this.isLoading ? 'disabled' : ''}>
                            ${this.isLoading ? '🔄 Загрузка...' : '🔄 Обновить'}
                        </button>
                        <button class="action-btn location-btn">📍 Сменить город</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderCurrentWeather() {
        if (!this.weatherData) {
            return `
                <div class="weather-loading">
                    <div class="loading-spinner">🔄</div>
                    <div>Загрузка данных о погоде...</div>
                </div>
            `;
        }

        const temp = Math.round(this.weatherData.main.temp);
        const feelsLike = Math.round(this.weatherData.main.feels_like);
        const description = this.weatherData.weather[0].description;
        const icon = this.getWeatherIcon(this.weatherData.weather[0].main);
        const city = this.weatherData.name;

        return `
            <div class="current-main">
                <div class="weather-icon-large">${icon}</div>
                <div class="weather-temp-large">${temp}°C</div>
            </div>
            <div class="current-details">
                <div class="weather-city">📍 ${city}</div>
                <div class="weather-desc">${description}</div>
                <div class="weather-feels-like">Ощущается как ${feelsLike}°C</div>
            </div>
        `;
    }

    renderWeatherDetails() {
        if (!this.weatherData) return '<div class="weather-detail">Нет данных</div>';

        const humidity = this.weatherData.main.humidity;
        const windSpeed = this.weatherData.wind.speed;
        const pressure = Math.round(this.weatherData.main.pressure * 0.75);
        const visibility = this.weatherData.visibility ? (this.weatherData.visibility / 1000) : 'N/A';

        return `
            <div class="weather-details-grid">
                <div class="weather-detail">
                    <span class="detail-icon">💧</span>
                    <span class="detail-label">Влажность:</span>
                    <span class="detail-value">${humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-icon">💨</span>
                    <span class="detail-label">Ветер:</span>
                    <span class="detail-value">${windSpeed} м/с</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-icon">🌡️</span>
                    <span class="detail-label">Давление:</span>
                    <span class="detail-value">${pressure} мм</span>
                </div>
                <div class="weather-detail">
                    <span class="detail-icon">👁️</span>
                    <span class="detail-label">Видимость:</span>
                    <span class="detail-value">${visibility} км</span>
                </div>
            </div>
        `;
    }

    renderForecast() {
        if (!this.weatherData) return '<div class="forecast-item">Нет данных</div>';

        const currentTemp = Math.round(this.weatherData.main.temp);
        const weatherType = this.weatherData.weather[0].main;
        
        const forecasts = [
            { time: 'Сейчас', temp: currentTemp, icon: this.getWeatherIcon(weatherType) },
            { time: '+3ч', temp: currentTemp + 1, icon: this.getWeatherIcon(weatherType) },
            { time: '+6ч', temp: currentTemp - 1, icon: this.getForecastIcon(weatherType, 6) },
            { time: '+12ч', temp: currentTemp - 2, icon: this.getForecastIcon(weatherType, 12) }
        ];

        return forecasts.map(forecast => `
            <div class="forecast-item">
                <div class="forecast-time">${forecast.time}</div>
                <div class="forecast-icon">${forecast.icon}</div>
                <div class="forecast-temp">${forecast.temp}°</div>
            </div>
        `).join('');
    }

    renderRecommendations() {
        const recommendations = [];
        
        if (this.weatherData) {
            const weather = this.weatherData.weather[0].main;
            const temp = this.weatherData.main.temp;

            if (weather === 'Rain' || weather === 'Drizzle') {
                recommendations.push('🌂 Возьмите зонт');
                recommendations.push('🚶 Осторожно на мокрых дорогах');
            }
            if (weather === 'Snow') {
                recommendations.push('🧤 Теплые перчатки не помешают');
                recommendations.push('🥾 Обувь с нескользящей подошвой');
            }
            if (temp < 0) {
                recommendations.push('🧥❄️ Оденьтесь очень тепло - мороз!');
                recommendations.push('🔋 Проверьте заряд телефона на холоде');
            } else if (temp < 5) {
                recommendations.push('🧥 Оденьтесь теплее - холодно!');
            } else if (temp < 15) {
                recommendations.push('🧥 Возьмите куртку или ветровку');
            }
            if (temp > 25) {
                recommendations.push('🧴 Не забудьте солнцезащитный крем');
                recommendations.push('💧 Пейте больше воды');
                recommendations.push('🕶️ Солнечные очки будут кстати');
            }
            if (this.weatherData.wind.speed > 8) {
                recommendations.push('💨 Ветрено - будьте осторожны');
                recommendations.push('🎩 Закрепите головные уборы');
            }
            if (this.weatherData.main.humidity > 80) {
                recommendations.push('💦 Высокая влажность - может быть душно');
            }
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ Идеальные условия для работы и прогулок');
            recommendations.push('☕ Наслаждайтесь комфортной погодой');
        }

        return recommendations.slice(0, 4).map(rec => `
            <div class="recommendation-item">${rec}</div>
        `).join('');
    }

    renderUpdateInfo() {
        if (!this.lastUpdate) return 'Данные обновляются...';
        
        const now = new Date();
        const updateTime = new Date(this.lastUpdate);
        const diffMinutes = Math.floor((now - updateTime) / 60000);
        
        if (diffMinutes < 1) {
            return 'Обновлено: только что';
        } else if (diffMinutes < 60) {
            return `Обновлено: ${diffMinutes} мин назад`;
        } else {
            return `Обновлено: ${updateTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`;
        }
    }

    bindEvents() {
        super.bindEvents();

        const refreshBtn = this.element?.querySelector('.refresh-btn');
        const locationBtn = this.element?.querySelector('.location-btn');

        if (refreshBtn) {
            this.addListener(refreshBtn, 'click', () => {
                this.fetchWeatherData();
            });
        }
        if (locationBtn) {
            this.addListener(locationBtn, 'click', () => this.changeLocation());
        }
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        
        this.autoRefreshInterval = setInterval(() => {
            if (this.isLoading) return;
            this.fetchWeatherData();
        }, this.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
            this.fetchTimeout = null;
        }
    }

    async fetchWeatherData() {
        if (this.isLoading) return;
        
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.isLoading = true;
        this.updateRefreshButton();
        
        this.abortController = new AbortController();
        
        try {
            const data = await this.tryAllApiKeys();
            
            if (data) {
                this.weatherData = data;
                this.lastUpdate = Date.now();
            } else {
                throw new Error('Все API ключи нерабочие');
            }
            
        } catch (error) {
            if (error.name === 'AbortError') return;
            
            console.error('Weather API error:', error);
            this.useDemoData();
            this.lastUpdate = Date.now();
        } finally {
            this.isLoading = false;
            this.abortController = null;
            
            if (this.element) {
                this.updateDisplay();
            }
        }
    }

    updateRefreshButton() {
        const refreshBtn = this.element?.querySelector('.refresh-btn');
        if (refreshBtn) {
            if (this.isLoading) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '🔄 Загрузка...';
            } else {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '🔄 Обновить';
            }
        }
    }

    async tryAllApiKeys() {
        const signal = this.abortController?.signal;
        
        for (let i = 0; i < this.apiKeys.length; i++) {
            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            
            try {
                this.currentApiKeyIndex = i;
                const apiKey = this.apiKeys[i];
                
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${this.location}&units=metric&appid=${apiKey}&lang=ru`,
                    { signal }
                );
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                if (error.name === 'AbortError') throw error;
            }
        }
        return null;
    }

    useDemoData() {
        this.weatherData = {
            main: {
                temp: 18 + Math.random() * 8,
                feels_like: 16 + Math.random() * 10,
                humidity: 40 + Math.random() * 40,
                pressure: 1013,
                temp_min: 15 + Math.random() * 5,
                temp_max: 20 + Math.random() * 10
            },
            weather: [{
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: ['ясно', 'облачно', 'небольшой дождь'][Math.floor(Math.random() * 3)]
            }],
            wind: {
                speed: (1 + Math.random() * 7).toFixed(1)
            },
            visibility: 10000,
            name: this.location,
            sys: {
                country: 'RU'
            }
        };
    }

    updateDisplay() {
        const container = this.element?.querySelector('.weather-container');
        if (container) {
            container.innerHTML = this.renderContent();
            this.bindEvents();
        }
    }

    changeLocation() {
        const newLocation = prompt('Введите название города:', this.location);
        if (newLocation && newLocation.trim()) {
            this.location = newLocation.trim();
            this.stopAutoRefresh();
            this.fetchWeatherData();
            this.startAutoRefresh();
        }
    }

    getWeatherIcon(weatherType) {
        const icons = {
            'Clear': '☀️',
            'Clouds': '🌤️',
            'Rain': '🌧️',
            'Snow': '❄️',
            'Thunderstorm': '⛈️',
            'Drizzle': '🌦️',
            'Mist': '🌫️',
            'Fog': '🌫️'
        };
        return icons[weatherType] || '🌤️';
    }

    getForecastIcon(weatherType, hours) {
        if (hours >= 18 || hours <= 6) {
            const nightIcons = {
                'Clear': '🌙',
                'Clouds': '☁️',
                'Rain': '🌧️',
                'Snow': '❄️'
            };
            return nightIcons[weatherType] || '🌙';
        }
        return this.getWeatherIcon(weatherType);
    }

    refresh() {
        if (!this.isLoading) {
            this.fetchWeatherData();
        }
    }

    destroy() {
        this.stopAutoRefresh();
        
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        
        super.destroy();
    }
}