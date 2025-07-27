const KoreanLearningApp = (function () {
    const pages = {
        home: document.getElementById('homePage'),
        levels: document.getElementById('levelsPage'),
        cards: document.getElementById('cardsPage'),
        grammar: document.getElementById('grammarPage'),
        texts: document.getElementById('textsPage'),
        progress: document.getElementById('progressPage'),
        profile: document.getElementById('profilePage'),
        settings: document.getElementById('settingsPage'),
    };

    function hideAllPages() {
        Object.values(pages).forEach(page => {
            page.classList.add('hidden');
        });
    }

    return {
        showHomePage: function () {
            hideAllPages();
            pages.home.classList.remove('hidden');
            this.updateNavActiveState('home');
        },
        showLevelsPage: function () {
            hideAllPages();
            pages.levels.classList.remove('hidden');
            this.updateNavActiveState('levels');
        },
        showCardsPage: function () {
            hideAllPages();
            pages.cards.classList.remove('hidden');
            this.updateNavActiveState('cards');
        },
        showGrammarPage: function () {
            hideAllPages();
            pages.grammar.classList.remove('hidden');
            this.updateNavActiveState('grammar');
        },
        showTextsPage: function () {
            hideAllPages();
            pages.texts.classList.remove('hidden');
            this.updateNavActiveState('texts');
        },
        showProgressPage: function () {
            hideAllPages();
            pages.progress.classList.remove('hidden');
            this.updateNavActiveState('progress');
        },
        showProfilePage: function () {
            hideAllPages();
            pages.profile.classList.remove('hidden');
            this.updateNavActiveState('profile');
        },
        showSettingsPage: function () {
            hideAllPages();
            pages.settings.classList.remove('hidden');
            this.updateNavActiveState('settings');
        },
        updateNavActiveState: function(activePage) {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const selectorMap = {
                home: 'showHomePage',
                levels: 'showLevelsPage',
                cards: 'showCardsPage',
                grammar: 'showGrammarPage',
                texts: 'showTextsPage',
                progress: 'showProgressPage',
                profile: 'showProfilePage',
                settings: 'showSettingsPage'
            };

            const matchFn = selectorMap[activePage];
            const activeItem = Array.from(document.querySelectorAll('.nav-item')).find(item =>
                item.getAttribute('onclick')?.includes(matchFn)
            );

            if (activeItem) activeItem.classList.add('active');
        }
    };
})();

// === Сделать KoreanApp доступным глобально ===
window.KoreanApp = KoreanLearningApp;

// === Глобальные функции для нижнего меню и кнопок ===
window.showHomePage = () => KoreanLearningApp.showHomePage();
window.showLevelsPage = () => KoreanLearningApp.showLevelsPage();
window.showCardsPage = () => KoreanLearningApp.showCardsPage();
window.showGrammarPage = () => KoreanLearningApp.showGrammarPage();
window.showTextsPage = () => KoreanLearningApp.showTextsPage();
window.showProgressPage = () => KoreanLearningApp.showProgressPage();
window.showProfilePage = () => KoreanLearningApp.showProfilePage();
window.showSettingsPage = () => KoreanLearningApp.showSettingsPage();