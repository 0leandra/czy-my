const CONFIG = {
    apiUrl: "https://script.google.com/macros/s/AKfycbwamKzhzlXw2bV1jH6VfYVX4r7gUX6qQzTbTFQQnEe55WyEnhrkD_Bvr7sSdiePyaUhMg/exec"
};

let currentLang = 'pl';
let isLoggedIn = false;
let DATABASE = {};
let currentCategory = [];
let currentMode = 'random';
let pendingCategoryName = '';
let pendingThemeColor = '';
let sequentialIndex = 0;

const TEXTS = {
    pl: {
        passPlaceholder: "Hasło...",
        loginBtn: "Start",
        loading: "Ładowanie...",
        errorMsg: "Błędne hasło lub problem z połączeniem.",
        loginHeader: "Zaloguj się,<br> aby rozpocząć",
        catHeader: "Wybierz Kategorię",
        changeLangBtn: "Zmień język",
        nextBtn: "Następne",
        changeCatBtn: "Zmień kategorię",
        finishHeader: "To już wszystkie pytania w tej kategorii!",
        backMenuBtn: "Wróć do menu",
        modeHeader: "Wybierz tryb",
        modeRandom: "Losowo",
        modeSequential: "Po kolei",
        modeBackCat: "Zmień kategorię"
    },
    en: {
        passPlaceholder: "Password...",
        loginBtn: "Start",
        loading: "Loading...",
        errorMsg: "Incorrect password or connection issue.",
        loginHeader: "Please log in to start",
        catHeader: "Choose Category",
        changeLangBtn: "Change language",
        nextBtn: "Next",
        changeCatBtn: "Change category",
        finishHeader: "That's all questions in this category!",
        backMenuBtn: "Back to menu",
        modeHeader: "Choose mode",
        modeRandom: "Random",
        modeSequential: "In order",
        modeBackCat: "Change category"
    }
};

const CATEGORY_THEMES = {
    "Codzienność": "darkest",
    "Wychowanie": "dark",
    "Relacje": "darker",
    "Finanse": "darker",
    "Everyday life": "darkest",
    "Wyzwania": "dark", "Everyday": "darkest",
    "Parenting": "darker",
    "Relations": "dark",
    "Finances": "dark",
    "Challenges": "dark"
};

const TEXTURE_BLOBS = [
    { x: 12, y: 18, size: 170, color: 'var(--twilight-indigo)' },
    { x: 84, y: 14, size: 150, color: 'var(--rosewood)' },
    { x: 20, y: 48, size: 200, color: 'var(--wine-plum)' },
    { x: 83, y: 50, size: 190, color: 'var(--evergreen)' },
    { x: 50, y: 82, size: 230, color: 'var(--twilight-indigo)' }
];

function isTextInputElement(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
}

function resetKeyboardShift() {
    document.body.classList.remove('keyboard-open');
    document.body.style.setProperty('--keyboard-shift', '0px');
}

function adjustForMobileKeyboard() {
    const activeEl = document.activeElement;
    if (!isTextInputElement(activeEl)) {
        resetKeyboardShift();
        return;
    }

    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const keyboardLikelyOpen = (window.innerHeight - viewportHeight) > 120;

    if (!keyboardLikelyOpen) {
        resetKeyboardShift();
        return;
    }

    const rect = activeEl.getBoundingClientRect();
    const safeBottom = viewportHeight - 18;
    const overlap = rect.bottom - safeBottom;
    const shiftPx = Math.min(240, Math.max(0, overlap + 12));

    document.body.classList.add('keyboard-open');
    document.body.style.setProperty('--keyboard-shift', `${shiftPx}px`);

    if (overlap > 0) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
}

function hideSplash() {
    const splash = document.getElementById('splash-fullscreen');
    if (!splash) return;
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 750);
}

function showScreen(screenId) {
    const app = document.getElementById('app-container');
    if (app) {
        app.classList.remove('splash-mode');
    }
    document.body.classList.remove('splash-mode');
    resetKeyboardShift();

    hideSplash();

    if (screenId === 'screen-login' || screenId === 'screen-language') {
        resetThemeToDefault();
        document.getElementById('app-container').classList.remove('inverted-colors');
    }

    const activeScreens = document.querySelectorAll('.screen.active');
    activeScreens.forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => el.classList.remove('active'), 500);
    });

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        setTimeout(() => { target.style.opacity = '1'; }, 50);
    }
}

function setLanguage(lang) {
    if (lang === 'en') {
        return;
    }

    currentLang = lang;
    const t = TEXTS[currentLang];

    document.getElementById('password-input').placeholder = t.passPlaceholder;

    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.innerText = t.loginBtn;

    const loginHeader = document.getElementById('txt-login-header');
    if (loginHeader) loginHeader.innerHTML = t.loginHeader;

    const errorMsg = document.getElementById('error-msg');
    if (errorMsg) errorMsg.innerText = t.errorMsg;

    const catHeader = document.getElementById('txt-cat-header');
    if (catHeader) catHeader.innerText = t.catHeader;

    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) nextBtn.innerText = t.nextBtn;

    const btnChangeLang = document.getElementById('btn-change-lang');
    if (btnChangeLang) btnChangeLang.innerText = t.changeLangBtn;

    const btnChangeCat = document.getElementById('btn-change-cat');
    if (btnChangeCat) btnChangeCat.innerText = t.changeCatBtn;

    const finishHeader = document.getElementById('txt-finish-header');
    if (finishHeader) finishHeader.innerText = t.finishHeader;

    const backMenuBtn = document.getElementById('btn-back-menu');
    if (backMenuBtn) backMenuBtn.innerText = t.backMenuBtn;

    const modeHeader = document.getElementById('txt-mode-header');
    if (modeHeader) modeHeader.innerText = t.modeHeader;
    const btnModeRandom = document.getElementById('btn-mode-random');
    if (btnModeRandom) btnModeRandom.innerText = t.modeRandom;
    const btnModeSequential = document.getElementById('btn-mode-sequential');
    if (btnModeSequential) btnModeSequential.innerText = t.modeSequential;
    const btnModeBackCat = document.getElementById('btn-mode-back-cat');
    if (btnModeBackCat) btnModeBackCat.innerText = t.modeBackCat;

    if (isLoggedIn) {
        initCategories();
        showScreen('screen-categories');
    } else {
        showScreen('screen-login');
    }
}

async function checkPassword() {
    const emailVal = document.getElementById('email-input').value.trim();
    const passwordVal = document.getElementById('password-input').value.trim();
    const btn = document.getElementById('btn-login');
    const errorMsg = document.getElementById('error-msg');

    if (!emailVal || !passwordVal) return;

    btn.disabled = true;
    btn.innerText = TEXTS[currentLang].loading;
    errorMsg.style.display = 'none';

    try {
        const requestUrl = CONFIG.apiUrl + "?l=" + encodeURIComponent(emailVal) + "&p=" + encodeURIComponent(passwordVal);
        const response = await fetch(requestUrl);
        const data = await response.json();

        if (data.error) throw new Error('Pass');

        DATABASE = data;
        isLoggedIn = true;
        initCategories();
        showScreen('screen-categories');
    } catch (e) {
        console.error('Błąd:', e);
        errorMsg.innerText = TEXTS[currentLang].errorMsg;
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerText = TEXTS[currentLang].loginBtn;
    }
}

function initCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';

    const cats = DATABASE[currentLang] || {};

    Object.keys(cats).forEach(category => {
        const btn = document.createElement('button');
        const colorKey = CATEGORY_THEMES[category] || 'brown';
        btn.className = `category-btn btn-${colorKey}`;
        btn.innerText = category;
        btn.onclick = () => startGame(category, colorKey);
        list.appendChild(btn);
    });
}

function startGame(categoryName, themeColor) {
    document.getElementById('app-container').classList.remove('finished-fullscreen');
    document.body.classList.remove('finished-fullscreen');
    setAppTheme(`theme-${themeColor}`);
    document.getElementById('app-container').classList.remove('inverted-colors');
    document.body.style.backgroundColor = 'var(--desert-sand)';

    pendingCategoryName = categoryName;
    pendingThemeColor = themeColor;
    showScreen('screen-mode');
}

function selectMode(mode) {
    currentMode = mode;

    if (DATABASE[currentLang] && DATABASE[currentLang][pendingCategoryName]) {
        currentCategory = [...DATABASE[currentLang][pendingCategoryName]];
        sequentialIndex = 0;

        if (mode === 'random') {
            nextQuestion();
        } else {
            nextQuestionOrdered();
        }
        showScreen('screen-game');
    }
}

function handleNext() {
    if (currentMode === 'sequential') {
        nextQuestionOrdered();
    } else {
        nextQuestion();
    }
}

function nextQuestion() {
    const textEl = document.getElementById('question-text');

    if (!currentCategory || currentCategory.length === 0) {
        finishGame();
        return;
    }

    const randomIndex = Math.floor(Math.random() * currentCategory.length);
    const question = currentCategory[randomIndex];
    currentCategory.splice(randomIndex, 1);

    textEl.style.opacity = 0;

    setTimeout(() => {
        const safeText = question.text ? question.text : question;

        textEl.innerText = safeText;

        if (question.text.length > 120) {
            textEl.classList.add('long-text');
        } else {
            textEl.classList.remove('long-text');
        }

        textEl.style.opacity = 1;
    }, 200);
}

function nextQuestionOrdered() {
    const textEl = document.getElementById('question-text');

    if (!currentCategory || sequentialIndex >= currentCategory.length) {
        finishGame();
        return;
    }

    const question = currentCategory[sequentialIndex];
    sequentialIndex++;

    textEl.style.opacity = 0;

    setTimeout(() => {
        const safeText = question.text ? question.text : question;
        textEl.innerText = safeText;

        if (safeText.length > 120) {
            textEl.classList.add('long-text');
        } else {
            textEl.classList.remove('long-text');
        }

        textEl.style.opacity = 1;
    }, 200);
}

function finishGame() {
    const t = TEXTS[currentLang];
    const finishHeader = document.getElementById('txt-finish-header');
    if (finishHeader) finishHeader.innerText = t.finishHeader;
    const backMenuBtn = document.getElementById('btn-back-menu');
    if (backMenuBtn) backMenuBtn.innerText = t.backMenuBtn;

    showScreen('screen-finished');
    setTimeout(() => {
        const app = document.getElementById('app-container');
        app.classList.add('finished-fullscreen');
        app.classList.add('inverted-colors');
        document.body.classList.add('finished-fullscreen');
        document.body.style.backgroundColor = window.getComputedStyle(app).backgroundColor;
    }, 100);
}

function resetApp() {
    document.getElementById('app-container').classList.remove('inverted-colors');
    document.getElementById('app-container').classList.remove('finished-fullscreen');
    document.body.classList.remove('finished-fullscreen');
    resetThemeToDefault();
    document.body.style.backgroundColor = 'var(--desert-sand)';

    if (isLoggedIn) {
        showScreen('screen-categories');
    } else {
        showScreen('screen-login');
    }
}

function setAppTheme(themeClass) {
    const container = document.getElementById('app-container');
    container.classList.remove('theme-brown', 'theme-darkest', 'theme-darker', 'theme-dark');
    container.classList.add(themeClass);
}

function resetThemeToDefault() { setAppTheme('theme-brown'); }

function createTextureBackground() {
    const container = document.getElementById('screen-texture');
    if (!container) return;
    container.innerHTML = '';

    TEXTURE_BLOBS.forEach((blob) => {
        const el = document.createElement('div');
        el.className = 'texture-blob';
        el.style.width = `${blob.size}px`;
        el.style.height = `${blob.size}px`;
        el.style.left = `${blob.x}%`;
        el.style.top = `${blob.y}%`;
        el.style.transform = 'translate(-50%, -50%)';
        el.style.background = `radial-gradient(circle at 38% 35%, color-mix(in srgb, ${blob.color} 36%, var(--desert-sand)) 0%, color-mix(in srgb, ${blob.color} 22%, transparent) 56%, transparent 100%)`;
        container.appendChild(el);
    });
}

function createSplashBackground() {
    const container = document.getElementById('splash-bg');
    if (!container) return;
    container.innerHTML = '';

    const splashBlobs = [
        { x: 8, y: 10, size: 420, color: 'var(--twilight-indigo)' },
        { x: 92, y: 12, size: 380, color: 'var(--rosewood)' },
        { x: 10, y: 88, size: 400, color: 'var(--wine-plum)' },
        { x: 90, y: 85, size: 420, color: 'var(--evergreen)' },
        { x: 50, y: 48, size: 460, color: 'var(--twilight-indigo)' }
    ];

    splashBlobs.forEach((blob) => {
        const el = document.createElement('div');
        el.className = 'splash-blob';
        el.style.width = `${blob.size}px`;
        el.style.height = `${blob.size}px`;
        el.style.left = `${blob.x}%`;
        el.style.top = `${blob.y}%`;
        el.style.transform = 'translate(-50%, -50%)';
        el.style.background = `radial-gradient(circle, color-mix(in srgb, ${blob.color} 62%, var(--desert-sand)) 0%, color-mix(in srgb, ${blob.color} 30%, transparent) 55%, transparent 100%)`;
        container.appendChild(el);
    });
}

window.onload = () => {
    createTextureBackground();
    createSplashBackground();

    const passInput = document.getElementById('password-input');
    if (passInput) {
        passInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    document.addEventListener('focusin', () => {
        setTimeout(adjustForMobileKeyboard, 80);
    });

    document.addEventListener('focusout', () => {
        setTimeout(adjustForMobileKeyboard, 80);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', adjustForMobileKeyboard);
        window.visualViewport.addEventListener('scroll', adjustForMobileKeyboard);
    }

    setTimeout(() => {
        showScreen('screen-language');
    }, 4500);
};
