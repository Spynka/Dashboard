import { UIComponent } from './UIComponent.js';

export class DictionaryWidget extends UIComponent {
    constructor(config = {}) {
        super({ 
            ...config,
            title: config.title || '📚 Словарь',
            className: 'dictionary-widget'
        });
        
        this.searchHistory = JSON.parse(localStorage.getItem('dictionaryHistory') || '[]');
        this.isLoading = false;
        this.currentWord = null;
        this.favorites = new Set(JSON.parse(localStorage.getItem('dictionaryFavorites') || '[]'));
    }

    renderContent() {
        return `
            <div class="dictionary-container">
                <div class="search-section">
                    <div class="search-input-container">
                        <input 
                            type="text" 
                            class="dictionary-input" 
                            placeholder="Введите слово на английском..."
                            maxlength="50"
                        >
                        <button class="search-btn" ${this.isLoading ? 'disabled' : ''}>
                            ${this.isLoading ? '⏳' : '🔍'}
                        </button>
                    </div>
                    
                    <div class="search-options">
                        <button class="clear-btn" title="Очистить">🗑️</button>
                        <button class="random-word-btn" ${this.isLoading ? 'disabled' : ''}>🎲 Случайное слово</button>
                    </div>
                </div>
                
                ${this.searchHistory.length > 0 ? this.renderSearchHistory() : ''}
                
                <div class="results-section">
                    <div class="word-header" style="display: none;">
                        <div class="word-title">
                            <h3 class="word-text"></h3>
                            <button class="favorite-btn">☆</button>
                            <button class="pronounce-btn">🔊</button>
                        </div>
                        <div class="word-phonetic"></div>
                    </div>
                    
                    <div class="definitions-container">
                        ${this.renderWelcomeMessage()}
                    </div>
                </div>
                
                <div class="dictionary-footer">
                    <div class="api-status connected">✓ Dictionary API</div>
                    <div class="favorites-count">Избранные: ${this.favorites.size}</div>
                </div>
            </div>
        `;
    }

    renderSearchHistory() {
        return `
            <div class="search-history">
                <div class="history-header">
                    <span>История поиска</span>
                    <button class="toggle-history">▼</button>
                </div>
                <div class="history-list">
                    ${this.searchHistory.slice(0, 8).map(item => `
                        <div class="history-item" data-word="${item.word}">
                            <span class="history-word">${item.word}</span>
                            <span class="history-time">${this.formatTime(item.timestamp)}</span>
                            <button class="history-favorite ${this.favorites.has(item.word) ? 'favorited' : ''}">
                                ${this.favorites.has(item.word) ? '★' : '☆'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderWelcomeMessage() {
        return `
            <div class="welcome-message">
                <h4>Английский словарь</h4>
                <p>Введите слово на английском языке чтобы получить:</p>
                <ul>
                    <li>📖 Определение</li>
                    <li>🎯 Примеры использования</li>
                    <li>🔊 Произношение</li>
                    <li>💬 Синонимы</li>
                </ul>
                <div class="example-words">
                    <strong>Примеры:</strong>
                    <span class="example-word" data-word="hello">hello</span>
                    <span class="example-word" data-word="computer">computer</span>
                    <span class="example-word" data-word="beautiful">beautiful</span>
                </div>
            </div>
        `;
    }

    renderWordData(wordData) {
        if (!wordData || wordData.length === 0) {
            return `
                <div class="error-message">
                    <h4>Слово не найдено</h4>
                    <p>Попробуйте проверить правописание или ввести другое слово.</p>
                </div>
            `;
        }

        const word = wordData[0];
        return `
            <div class="word-data">
                ${word.meanings.map(meaning => `
                    <div class="meaning-section">
                        <div class="part-of-speech">
                            ${meaning.partOfSpeech}
                        </div>
                        
                        ${meaning.definitions.map((def, index) => `
                            <div class="definition">
                                <div class="definition-number">${index + 1}.</div>
                                <div class="definition-content">
                                    <div class="definition-text">${def.definition}</div>
                                    
                                    ${def.example ? `
                                        <div class="example">
                                            <em>Пример: "${def.example}"</em>
                                        </div>
                                    ` : ''}
                                    
                                    ${def.synonyms && def.synonyms.length > 0 ? `
                                        <div class="synonyms">
                                            <strong>Синонимы:</strong> 
                                            ${def.synonyms.slice(0, 5).map(synonym => 
                                                `<span class="synonym-tag">${synonym}</span>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
                
                ${word.phonetics && word.phonetics.length > 0 ? `
                    <div class="phonetics-section">
                        <h4>Произношение</h4>
                        <div class="phonetics-list">
                            ${word.phonetics.filter(ph => ph.text).map(phonetic => `
                                <div class="phonetic-item">
                                    <span class="phonetic-text">/${phonetic.text}/</span>
                                    ${phonetic.audio ? `
                                        <button class="play-audio" data-audio="${phonetic.audio}">
                                            🔊 Произнести
                                        </button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    bindEvents() {
        super.bindEvents();
        
        const searchInput = this.element.querySelector('.dictionary-input');
        const searchBtn = this.element.querySelector('.search-btn');
        const clearBtn = this.element.querySelector('.clear-btn');
        const randomBtn = this.element.querySelector('.random-word-btn');
        const exampleWords = this.element.querySelectorAll('.example-word');
        
        this.addListener(searchInput, 'keypress', (e) => {
            if (e.key === 'Enter' && !this.isLoading) {
                this.searchWord();
            }
        });
        
        this.addListener(searchBtn, 'click', () => this.searchWord());
        this.addListener(clearBtn, 'click', () => this.clearSearch());
        this.addListener(randomBtn, 'click', () => this.getRandomWord());
        
        exampleWords.forEach(word => {
            this.addListener(word, 'click', (e) => {
                searchInput.value = e.target.dataset.word;
                this.searchWord();
            });
        });
        
        this.addListener(this.element, 'click', (e) => {
            if (e.target.classList.contains('history-item') || e.target.closest('.history-item')) {
                const historyItem = e.target.closest('.history-item');
                this.searchHistoryWord(historyItem.dataset.word);
            }
            
            if (e.target.classList.contains('history-favorite')) {
                e.stopPropagation();
                const word = e.target.closest('.history-item').dataset.word;
                this.toggleFavorite(word, e.target);
            }
            
            if (e.target.classList.contains('play-audio')) {
                this.playAudio(e.target.dataset.audio);
            }
            
            if (e.target.classList.contains('favorite-btn')) {
                this.toggleFavorite(this.currentWord, e.target);
            }
            
            if (e.target.classList.contains('pronounce-btn')) {
                this.pronounceCurrentWord();
            }
            
            if (e.target.classList.contains('toggle-history')) {
                this.toggleHistory();
            }
        });
    }

    async searchWord() {
        const searchInput = this.element.querySelector('.dictionary-input');
        const word = searchInput.value.trim().toLowerCase();
        
        if (!word) {
            this.showNotification('Введите слово для поиска', 'warning');
            return;
        }
        
        if (!/^[a-zA-Z]+$/.test(word)) {
            this.showNotification('Введите слово на английском языке', 'warning');
            return;
        }
        
        this.setLoading(true);
        
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Слово не найдено в словаре');
                } else {
                    throw new Error('Ошибка при запросе к API');
                }
            }
            
            const wordData = await response.json();
            
            this.addToHistory(word);
            this.currentWord = word;
            
            this.updateWordHeader(word, wordData);
            this.showWordData(wordData);
            
        } catch (error) {
            console.error('Dictionary search error:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async getRandomWord() {
        const randomWords = [
            'serendipity', 'ephemeral', 'ubiquitous', 'nostalgia', 
            'eloquent', 'luminous', 'resilience', 'paradox', 'quintessential'
        ];
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        
        const searchInput = this.element.querySelector('.dictionary-input');
        searchInput.value = randomWord;
        this.searchWord();
    }

    searchHistoryWord(word) {
        const searchInput = this.element.querySelector('.dictionary-input');
        searchInput.value = word;
        this.searchWord();
    }

    updateWordHeader(word, wordData) {
        const wordHeader = this.element.querySelector('.word-header');
        const wordText = this.element.querySelector('.word-text');
        const favoriteBtn = this.element.querySelector('.favorite-btn');
        const phoneticElement = this.element.querySelector('.word-phonetic');
        
        if (wordHeader && wordData && wordData.length > 0) {
            wordHeader.style.display = 'block';
            wordText.textContent = word;
            
            favoriteBtn.textContent = this.favorites.has(word) ? '★' : '☆';
            favoriteBtn.className = `favorite-btn ${this.favorites.has(word) ? 'favorited' : ''}`;
            
            const phonetic = wordData[0].phonetic || 
                           (wordData[0].phonetics && wordData[0].phonetics[0]?.text);
            phoneticElement.textContent = phonetic ? `/${phonetic}/` : '';
        }
    }

    showWordData(wordData) {
        const definitionsContainer = this.element.querySelector('.definitions-container');
        if (definitionsContainer) {
            definitionsContainer.innerHTML = this.renderWordData(wordData);
            
            const audioButtons = definitionsContainer.querySelectorAll('.play-audio');
            audioButtons.forEach(btn => {
                this.addListener(btn, 'click', (e) => {
                    e.stopPropagation();
                    this.playAudio(e.target.dataset.audio);
                });
            });
        }
    }

    showError(message) {
        const definitionsContainer = this.element.querySelector('.definitions-container');
        if (definitionsContainer) {
            definitionsContainer.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка</h4>
                    <p>${message}</p>
                </div>
            `;
        }
        
        const wordHeader = this.element.querySelector('.word-header');
        if (wordHeader) {
            wordHeader.style.display = 'none';
        }
    }

    playAudio(audioUrl) {
        if (!audioUrl) {
            this.showNotification('Аудио недоступно', 'warning');
            return;
        }
        
        try {
            const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `https:${audioUrl}`;
            const audio = new Audio(fullAudioUrl);
            audio.play().catch(error => {
                console.error('Audio play error:', error);
                this.showNotification('Ошибка воспроизведения аудио', 'error');
            });
        } catch (error) {
            console.error('Audio error:', error);
            this.showNotification('Ошибка воспроизведения', 'error');
        }
    }

    pronounceCurrentWord() {
        if (!this.currentWord) return;
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(this.currentWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        } else {
            this.showNotification('Синтез речи не поддерживается', 'warning');
        }
    }

    toggleFavorite(word, buttonElement = null) {
        if (this.favorites.has(word)) {
            this.favorites.delete(word);
            if (buttonElement) {
                buttonElement.textContent = '☆';
                buttonElement.classList.remove('favorited');
            }
            this.showNotification(`Удалено из избранных: ${word}`, 'info');
        } else {
            this.favorites.add(word);
            if (buttonElement) {
                buttonElement.textContent = '★';
                buttonElement.classList.add('favorited');
            }
            this.showNotification(`Добавлено в избранные: ${word}`, 'success');
        }
        
        localStorage.setItem('dictionaryFavorites', JSON.stringify([...this.favorites]));
        
        const favoritesCount = this.element.querySelector('.favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = `Избранные: ${this.favorites.size}`;
        }
        
        this.refreshHistory();
    }

    addToHistory(word) {
        const existingIndex = this.searchHistory.findIndex(item => item.word === word);
        
        if (existingIndex !== -1) {
            this.searchHistory.splice(existingIndex, 1);
        }
        
        this.searchHistory.unshift({
            word: word,
            timestamp: Date.now()
        });
        
        this.searchHistory = this.searchHistory.slice(0, 20);
        localStorage.setItem('dictionaryHistory', JSON.stringify(this.searchHistory));
        
        this.refreshHistory();
    }

    refreshHistory() {
        const historyContainer = this.element.querySelector('.search-history');
        if (historyContainer && this.searchHistory.length > 0) {
            const historyList = historyContainer.querySelector('.history-list');
            if (historyList) {
                historyList.innerHTML = this.searchHistory.slice(0, 8).map(item => `
                    <div class="history-item" data-word="${item.word}">
                        <span class="history-word">${item.word}</span>
                        <span class="history-time">${this.formatTime(item.timestamp)}</span>
                        <button class="history-favorite ${this.favorites.has(item.word) ? 'favorited' : ''}">
                            ${this.favorites.has(item.word) ? '★' : '☆'}
                        </button>
                    </div>
                `).join('');
            }
        }
    }

    clearSearch() {
        const searchInput = this.element.querySelector('.dictionary-input');
        const definitionsContainer = this.element.querySelector('.definitions-container');
        const wordHeader = this.element.querySelector('.word-header');
        
        if (searchInput) searchInput.value = '';
        if (definitionsContainer) definitionsContainer.innerHTML = this.renderWelcomeMessage();
        if (wordHeader) wordHeader.style.display = 'none';
        
        searchInput.focus();
    }

    setLoading(loading) {
        this.isLoading = loading;
        
        const searchBtn = this.element.querySelector('.search-btn');
        const searchInput = this.element.querySelector('.dictionary-input');
        const randomBtn = this.element.querySelector('.random-word-btn');
        
        if (searchBtn) {
            searchBtn.innerHTML = loading ? '⏳' : '🔍';
            searchBtn.disabled = loading;
        }
        
        if (searchInput) {
            searchInput.disabled = loading;
        }
        
        if (randomBtn) {
            randomBtn.disabled = loading;
        }
    }

    toggleHistory() {
        const historyList = this.element.querySelector('.history-list');
        const toggleBtn = this.element.querySelector('.toggle-history');
        
        if (historyList.style.display === 'none') {
            historyList.style.display = 'block';
            toggleBtn.textContent = '▼';
        } else {
            historyList.style.display = 'none';
            toggleBtn.textContent = '▶';
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`;
        
        return date.toLocaleDateString('ru-RU');
    }

    showNotification(message, type) {
        console.log(`Dictionary Notification [${type}]:`, message);
    }
}