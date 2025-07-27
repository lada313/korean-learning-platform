// Глобальные переменные
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
let currentFlashcardIndex = 0;
let flashcards = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function () {
    loadUserProgress();
    loadData().then(() => {
        showHomePage();
    });

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function () {
            console.log("Голоса загружены");
        };
    }
});

// Загрузка данных
async function loadData() {
    try {
        const [wordsResponse, levelsResponse, grammarResponse, textsResponse] = await Promise.all([
            fetch('data/words.json'),
            fetch('data/levels.json'),
            fetch('data/grammar.json'),
            fetch('data/texts.json')
        ]);

        allWords = await wordsResponse.json();
        allLevels = await levelsResponse.json();
        allGrammar = await grammarResponse.json();
        allTexts = await textsResponse.json();
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }
}

// Управление прогрессом
function loadUserProgress() {
    const savedProgress = localStorage.getItem('koreanPlatformProgress');
    if (savedProgress) {
        userProgress = JSON.parse(savedProgress);
        updateProgressUI();
    }
}

function saveUserProgress() {
    localStorage.setItem('koreanPlatformProgress', JSON.stringify(userProgress));
    updateProgressUI();
}

function updateProgressUI() {
    const progressPercent = allWords.length > 0
        ? Math.floor((userProgress.knownWords.length / allWords.length) * 100)
        : 0;

    if (document.querySelector('.progress-bar')) {
        document.querySelector('.progress-bar').style.width = `${progressPercent}%`;
        document.querySelector('.progress-info span:first-child').textContent = `${progressPercent}% завершено`;
        document.querySelector('.progress-info span:last-child').textContent = `Уровень ${userProgress.currentLevel}`;
    }
}

// Навигация
function showHomePage() {
    document.getElementById('mainContent').innerHTML = `
        <div class="modules-grid">
            <a href="javascript:void(0)" onclick="showLevelsPage()" class="module-card">
                <div class="card-icon levels"><i class="fas fa-layer-group"></i></div>
                <h2>Уровни</h2>
                <p>Пошаговое изучение от начального до продвинутого</p>
            </a>

            <a href="javascript:void(0)" onclick="showCardsPage()" class="module-card">
                <div class="card-icon cards"><i class="fas fa-flipbook"></i></div>
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
}

function showLevelsPage() {
    const levelsHtml = allLevels.map(level => `
        <div class="level-card" onclick="startLevel(${level.id})">
            <h3>${level.title}</h3>
            <p>${level.description}</p>
            <div class="level-progress">
                <div class="progress-bar" style="width: ${level.completed ? 100 : 0}%"></div>
            </div>
        </div>
    `).join('');

    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Уровни изучения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="levels-container">
            ${levelsHtml}
        </div>
    `;
    updateActiveNav('levels');
}

function showGrammarPage() {
    const grammarHtml = allGrammar.map(item => `
        <div class="grammar-card">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        </div>
    `).join('');

    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Грамматические правила</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="grammar-container">
            ${grammarHtml}
        </div>
    `;
    updateActiveNav('grammar');
}

function showTextsPage() {
    const textsHtml = allTexts.map(text => `
        <div class="text-card">
            <h3>${text.title}</h3>
            <p>${text.korean}</p>
            <div class="translation">${text.translation}</div>
        </div>
    `).join('');

    document.getElementById('mainContent').innerHTML = `
        <div class="section-title">
            <h2>Тексты для чтения</h2>
            <div class="view-all" onclick="showHomePage()">На главную</div>
        </div>
        <div class="texts-container">
            ${textsHtml}
        </div>
    `;
    updateActiveNav('text');
}

// Остальные функции (карточки, озвучка, flipCard и т.п.) уже есть в файле и остаются без изменений

// Экспорт функций
window.showHomePage = showHomePage;
window.showLevelsPage = showLevelsPage;
window.showCardsPage = showCardsPage;
window.showGrammarPage = showGrammarPage;
window.showTextsPage = showTextsPage;
window.showProgressPage = showProgressPage;
window.showSettingsPage = showSettingsPage;
window.flipCard = flipCard;
window.nextCard = nextCard;
window.speakWord = speakWord;
window.showWordCard = showWordCard;
