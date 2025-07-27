// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let userProgress = {
    knownWords: [],
    difficultWords: [],
    completedLevels: [],
    currentLevel: 1,
    cardIntervals: {}
};

let allWords = [];
let allLevels = [];
let allGrammar = [];
let allTexts = [];
let currentCardIndex = 0;
let flashcards = [];

// ==================== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ====================
document.addEventListener('DOMContentLoaded', function() {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
    });
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            console.log("Голоса загружены");
        };
    }
});

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadData() {
    const fallbackData = {
        words: [
            {
                id: 1,
                korean: "안녕하세요",
                romanization: "annyeonghaseyo",
                translation: "Здравствуйте",
                examples: [{
                    korean: "안녕하세요, 만나서 반갑습니다",
                    translation: "Здравствуйте, приятно познакомиться"
                }]
            }
        ],
        levels: [
            {
                id: 1,
                title: "1 Уровень",
                description: "Базовые слова и фразы",
                words: [1],
                grammar: [],
                locked: false
            }
        ]
    };

    try {
        const [wordsResponse, levelsResponse] = await Promise.all([
            fetch('data/words.json').catch(() => ({ ok: false })),
            fetch('data/levels.json').catch(() => ({ ok: false }))
        ]);
        
        if (!wordsResponse.ok || !levelsResponse.ok) {
            throw new Error("Не удалось загрузить основные данные");
        }
        
        allWords = await wordsResponse.json() || fallbackData.words;
        allLevels = await levelsResponse.json() || fallbackData.levels;
        
        try {
            const [grammarResponse, textsResponse] = await Promise.all([
                fetch('data/grammar.json').catch(() => ({ ok: false })),
                fetch('data/texts.json').catch(() => ({ ok: false }))
            ]);
            
            if (grammarResponse.ok) allGrammar = await grammarResponse.json() || [];
            if (textsResponse.ok) allTexts = await textsResponse.json() || [];
            
        } catch (e) {
            console.warn("Не удалось загрузить дополнительные данные:", e);
        }
        
    } catch (error) {
        console.error("Критическая ошибка загрузки:", error);
        allWords = fallbackData.words;
        allLevels = fallbackData.levels;
    }
}

// ==================== УПРАВЛЕНИЕ ПРОГРЕССОМ ====================
function loadUserProgress() {
    const savedProgress = localStorage.getItem('koreanPlatformProgress');
    if (savedProgress) {
        try {
            userProgress = JSON.parse(savedProgress);
            updateProgressUI();
        } catch (e) {
            console.error("Ошибка загрузки прогресса:", e);
        }
    }
}

function saveUserProgress() {
    try {
        localStorage.setItem('koreanPlatformProgress', JSON.stringify(userProgress));
        updateProgressUI();
    } catch (e) {
        console.error("Ошибка сохранения прогресса:", e);
    }
}

function updateProgressUI() {
    try {
        const progressPercent = allWords.length > 0 
            ? Math.floor((userProgress.knownWords.length / allWords.length) * 100)
            : 0;
        
        const progressBar = document.querySelector('.progress-bar');
        const progressInfo = document.querySelector('.progress-info');
        
        if (progressBar && progressInfo) {
            progressBar.style.width = `${progressPercent}%`;
            progressInfo.querySelector('span:first-child').textContent = `${progressPercent}% завершено`;
            progressInfo.querySelector('span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
        }
    } catch (e) {
        console.error("Ошибка обновления UI:", e);
    }
}

// ==================== НАВИГАЦИЯ ====================
function showHomePage() {
    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="modules-grid">
                <a href="javascript:void(0)" onclick="showLevelsPage()" class="module-card">
                    <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                    <h2>Уровни</h2>
                    <p>Пошаговое изучение от начального до продвинутого</p>
                </a>

                <a href="javascript:void(0)" onclick="showCardsPage()" class="module-card">
                    <div class="card-icon cards"><i class="far fa-sticky-note"></i></div>
                    <h2>Карточки</h2>
                    <p>Запоминание слов с интервальным повторением</p>
                </a>

                <a href="javascript:void(0)" onclick="showGrammarPage()" class="module-card">
                    <div class="card-icon grammar"><i class="fas fa-book-open"></i></div>
                    <h2>Грамматика</h2>
                    <p>Изучение правил и языковых конструкций</p>
                </a>

                <a href="javascript:void(0)" onclick="showTextsPage()" class="module-card">
                    <div class="card-icon text"><i class="fas fa-align-left"></i></div>
                    <h2>Текст и перевод</h2>
                    <p>Чтение и анализ текстов с переводом</p>
                </a>
            </div>

            <div class="repetition-section">
                <h2>Повторение</h2>
                <p>Повторяйте изученный материал для закрепления знаний</p>
                <button class="card-btn" onclick="showCardsPage()">
                    <i class="fas fa-redo"></i> Начать повторение
                </button>
            </div>
        `;
        updateActiveNav('home');
    } catch (e) {
        console.error("Ошибка отображения главной страницы:", e);
        showErrorPage();
    }
}

function showCardsPage() {
    try {
        flashcards = allWords.filter(word => isDueForReview(word.id));
        currentCardIndex = 0;
        
        if (flashcards.length === 0) {
            flashcards = allWords.slice(0, 5);
        }
        
        renderFlashcard();
        updateActiveNav('cards');
    } catch (e) {
        console.error("Ошибка отображения карточек:", e);
        showErrorPage();
    }
}

function renderFlashcard() {
    try {
        if (flashcards.length === 0) {
            document.getElementById('mainContent').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>Нет слов для изучения</h3>
                    <button class="card-btn" onclick="showHomePage()">
                        На главную
                    </button>
                </div>
            `;
            return;
        }
        
        const word = flashcards[currentCardIndex];
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Карточки</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            
            <div class="word-card" onclick="flipCard(this)">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="word-korean">${word.korean}</div>
                        <div class="word-romanization">${word.romanization}</div>
                        <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="word-translation">${word.translation}</div>
                        ${word.examples?.map(ex => `
                            <div class="example-container">
                                <div class="example-korean">${ex.korean}</div>
                                <button class="speak-example-btn" 
                                        onclick="speakWord(event, '${ex.korean}')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
            </div>
            
            <div class="card-controls">
                <button class="card-btn" onclick="nextCard(false)">
                    <i class="fas fa-redo"></i> Снова
                </button>
                <button class="card-btn primary" onclick="nextCard(true)">
                    <i class="fas fa-check-circle"></i> Знаю
                </button>
            </div>
            
            <div class="progress-text">
                ${currentCardIndex + 1} / ${flashcards.length}
            </div>
        `;
    } catch (e) {
        console.error("Ошибка рендеринга карточки:", e);
        showErrorPage();
    }
}

function nextCard(know) {
    try {
        const currentWord = flashcards[currentCardIndex];
        
        if (know) {
            if (!userProgress.knownWords.includes(currentWord.id)) {
                userProgress.knownWords.push(currentWord.id);
            }
            updateCardInterval(currentWord.id, 'easy');
        } else {
            updateCardInterval(currentWord.id, 'again');
        }
        
        saveUserProgress();
        currentCardIndex++;
        
        if (currentCardIndex < flashcards.length) {
            renderFlashcard();
        } else {
            showCardsPage();
        }
    } catch (e) {
        console.error("Ошибка переключения карточки:", e);
    }
}

function showGrammarPage() {
    try {
        if (allGrammar.length === 0) {
            allGrammar = [{
                title: "Основы грамматики",
                description: "Базовые правила корейского языка",
                examples: [{
                    korean: "는/은",
                    translation: "Тематический маркер"
                }]
            }];
        }
        
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Грамматика корейского</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            <div class="grammar-container">
                ${allGrammar.map(item => `
                    <div class="grammar-card">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        ${item.examples?.map(ex => `
                            <div class="example-container">
                                <div class="example-korean">${ex.korean}</div>
                                <div class="example-translation">${ex.translation}</div>
                            </div>
                        `).join('') || ''}
                    </div>
                `).join('')}
            </div>
        `;
        updateActiveNav('grammar');
    } catch (e) {
        console.error("Ошибка отображения грамматики:", e);
        showErrorPage();
    }
}

function showTextsPage() {
    try {
        if (allTexts.length === 0) {
            allTexts = [{
                title: "Приветствие",
                content: "안녕하세요",
                translation: "Здравствуйте"
            }];
        }
        
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Тексты для чтения</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            <div class="texts-container">
                ${allTexts.map(text => `
                    <div class="text-card">
                        <h3>${text.title}</h3>
                        <div class="text-content">
                            <p class="korean-text">${text.content}</p>
                            <p class="translation">${text.translation}</p>
                        </div>
                        <button class="card-btn" onclick="speakText('${text.content}')">
                            <i class="fas fa-volume-up"></i> Озвучить текст
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        updateActiveNav('texts');
    } catch (e) {
        console.error("Ошибка отображения текстов:", e);
        showErrorPage();
    }
}

function showProgressPage() {
    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Ваш прогресс</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            <div class="stats-container">
                <div class="stat-card">
                    <div class="stat-value">${userProgress.knownWords.length}</div>
                    <div class="stat-label">Изучено слов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userProgress.completedLevels.length}</div>
                    <div class="stat-label">Пройдено уровней</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userProgress.difficultWords.length}</div>
                    <div class="stat-label">Сложных слов</div>
                </div>
            </div>
        `;
        updateActiveNav('progress');
    } catch (e) {
        console.error("Ошибка отображения прогресса:", e);
        showErrorPage();
    }
}

function showProfilePage() {
    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Ваш профиль</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            <div class="profile-container">
                <div class="profile-card">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <h3>${localStorage.getItem('userName') || 'Ученик корейского'}</h3>
                    <div class="profile-info">
                        <p><strong>Уровень:</strong> ${userProgress.currentLevel}</p>
                        <p><strong>Изучено слов:</strong> ${userProgress.knownWords.length}</p>
                        <p><strong>Пройдено уроков:</strong> ${userProgress.completedLevels.length}</p>
                    </div>
                    <button class="card-btn" onclick="showHomePage()">
                        <i class="fas fa-arrow-left"></i> На главную
                    </button>
                </div>
            </div>
        `;
        updateActiveNav('profile');
    } catch (e) {
        console.error("Ошибка отображения профиля:", e);
        showErrorPage();
    }
}

function showSettingsPage() {
    try {
        document.getElementById('mainContent').innerHTML = `
            <div class="section-title">
                <h2>Настройки</h2>
                <div class="view-all" onclick="showHomePage()">На главную</div>
            </div>
            <div class="settings-container">
                <div class="setting-item">
                    <label>Уведомления</label>
                    <label class="switch">
                        <input type="checkbox" id="notifications" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>Автоозвучка</label>
                    <label class="switch">
                        <input type="checkbox" id="autoSpeak" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="setting-item">
                    <label>Имя пользователя</label>
                    <input type="text" id="userName" 
                           value="${localStorage.getItem('userName') || ''}"
                           placeholder="Введите ваше имя">
                </div>
                <button class="card-btn" onclick="saveSettings()">
                    <i class="fas fa-save"></i> Сохранить
                </button>
                <button class="card-btn danger" onclick="resetProgress()">
                    <i class="fas fa-trash"></i> Сбросить прогресс
                </button>
            </div>
        `;
        updateActiveNav('settings');
    } catch (e) {
        console.error("Ошибка отображения настроек:", e);
        showErrorPage();
    }
}

function saveSettings() {
    try {
        const userName = document.getElementById('userName').value;
        localStorage.setItem('userName', userName);
        alert("Настройки сохранены!");
    } catch (e) {
        console.error("Ошибка сохранения настроек:", e);
    }
}

function resetProgress() {
    if (confirm("Вы уверены, что хотите сбросить весь прогресс?")) {
        localStorage.removeItem('koreanPlatformProgress');
        userProgress = {
            knownWords: [],
            difficultWords: [],
            completedLevels: [],
            currentLevel: 1,
            cardIntervals: {}
        };
        showHomePage();
    }
}

function showWordCard(wordId) {
    try {
        const word = allWords.find(w => w.id === wordId);
        if (!word) return;
        
        document.getElementById('mainContent').innerHTML = `
            <div class="word-card" onclick="flipCard(this)">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="word-korean">${word.korean}</div>
                        <div class="word-romanization">${word.romanization}</div>
                        <button class="speak-btn" onclick="speakWord(event, '${word.korean}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                    </div>
                    <div class="card-back">
                        <div class="word-translation">${word.translation}</div>
                        ${word.examples?.map(ex => `
                            <div class="example-container">
                                <div class="example-korean">${ex.korean}</div>
                                <button class="speak-example-btn" 
                                        onclick="speakWord(event, '${ex.korean}')">
                                    <i class="fas fa-volume-up"></i>
                                </button>
                            </div>
                        `).join('') || ''}
                    </div>
                </div>
            </div>
            <div class="card-controls">
                <button class="card-btn" onclick="showHomePage()">
                    <i class="fas fa-arrow-left"></i> Назад
                </button>
            </div>
        `;
    } catch (e) {
        console.error("Ошибка отображения слова:", e);
        showErrorPage();
    }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function updateActiveNav(section) {
    try {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('onclick')?.includes(section)) {
                item.classList.add('active');
            }
        });
    } catch (e) {
        console.error("Ошибка обновления навигации:", e);
    }
}

function speakWord(event, text) {
    try {
        event?.stopPropagation();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    } catch (e) {
        console.error("Ошибка воспроизведения:", e);
    }
}

function speakText(text) {
    try {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.7;
            window.speechSynthesis.speak(utterance);
        }
    } catch (e) {
        console.error("Ошибка воспроизведения текста:", e);
    }
}

function flipCard(cardElement) {
    cardElement?.classList?.toggle('flipped');
}

function isDueForReview(wordId) {
    try {
        if (!userProgress.knownWords.includes(wordId)) return true;
        if (!userProgress.cardIntervals?.[wordId]) return true;
        return Date.now() >= userProgress.cardIntervals[wordId].nextReview;
    } catch (e) {
        console.error("Ошибка проверки повторения:", e);
        return true;
    }
}

function updateCardInterval(cardId, response) {
    try {
        const intervals = { 'again': 1, 'hard': 3, 'easy': 7 };
        
        userProgress.cardIntervals = userProgress.cardIntervals || {};
        userProgress.cardIntervals[cardId] = {
            nextReview: Date.now() + intervals[response] * 86400000,
            interval: intervals[response]
        };
    } catch (e) {
        console.error("Ошибка обновления интервала:", e);
    }
}

function showErrorPage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Произошла ошибка</h3>
            <p>Попробуйте перезагрузить страницу</p>
            <button class="card-btn" onclick="location.reload()">
                <i class="fas fa-sync-alt"></i> Перезагрузить
            </button>
        </div>
    `;
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ====================
window.showHomePage = showHomePage;
window.showLevelsPage = showLevelsPage;
window.showCardsPage = showCardsPage;
window.showGrammarPage = showGrammarPage;
window.showTextsPage = showTextsPage;
window.showProgressPage = showProgressPage;
window.showProfilePage = showProfilePage;
window.showSettingsPage = showSettingsPage;
window.showWordCard = showWordCard;
window.flipCard = flipCard;
window.nextCard = nextCard;
window.speakWord = speakWord;
window.speakText = speakText;
window.saveSettings = saveSettings;
window.resetProgress = resetProgress;
window.startLevel = startLevel;
window.completeLevel = completeLevel;
window.startWordLearning = startWordLearning;
window.startGrammarLearning = startGrammarLearning;
window.startWordGame = startWordGame;
window.checkGameAnswer = checkGameAnswer;
window.startLevelTest = startLevelTest;
window.checkTestAnswer = checkTestAnswer;
