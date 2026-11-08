const LANGUAGE_KEY = "daily-walk-language";
const PLAN_KEY = "daily-walk-plan";
const CHECKIN_PREFIX = "daily-walk-checkin-";
const languageButtons = document.querySelectorAll("[data-language-button]");
const checkboxes = [...document.querySelectorAll("[data-practice]")];
const planField = document.querySelector("[data-plan]");
const progressRing = document.querySelector("[data-progress-ring]");
const progressNumber = document.querySelector("[data-progress-number]");
const progressCopy = document.querySelector("[data-progress-copy]");
const saveStatus = document.querySelector("[data-save-status]");
const toast = document.querySelector("[data-toast]");

const translations = {
    en: {
        today: "Today",
        saved: "Saved on this device only.",
        saving: "Saving...",
        checkinProgress: (done) => `${done} of 5 practices noticed today. Every small moment counts.`,
        checkinComplete: "You made space for all five today. Receive that as a gift, not a target to beat.",
        progressAria: (done) => `${done} of 5 practices`,
        resetConfirm: "Reset today's check-in? This will clear only today's five checkboxes.",
        resetDone: "Today's check-in has been reset.",
        planSaved: "Your note was saved on this device.",
        storageError: "This browser could not save your note. Your text is still here for now; copy it before leaving this page.",
        storageUnavailable: "Browser storage is unavailable. Your changes may not be saved.",
        storageReadError: "Saved progress could not be read from this browser.",
        planPlaceholder: "A small step I want to try..."
    },
    zh: {
        today: "今天",
        saved: "只儲存在這部裝置上。",
        saving: "儲存中……",
        checkinProgress: (done) => `今天留意了 ${done}/5 個操練。每個小時刻都值得珍惜。`,
        checkinComplete: "今天五個操練都留了空間。把它當作恩典，不是需要超越的目標。",
        progressAria: (done) => `今日已留意 ${done}/5 個操練`,
        resetConfirm: "要重設今日小記嗎？只會清除今天的五個勾選。",
        resetDone: "今日小記已重設。",
        planSaved: "你的筆記已儲存在這部裝置上。",
        storageError: "瀏覽器未能儲存筆記。離開此頁前，請先複製目前文字。",
        storageUnavailable: "瀏覽器儲存功能無法使用，變更可能未能儲存。",
        storageReadError: "未能從瀏覽器讀取已儲存的進度。",
        planPlaceholder: "我想嘗試的一小步……"
    }
};

function currentLanguage() {
    return document.body.dataset.language === "zh" ? "zh" : "en";
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

function setLanguage(language, persist = true) {
    const selected = language === "zh" ? "zh" : "en";
    document.body.dataset.language = selected;
    document.documentElement.lang = selected === "zh" ? "zh-Hant" : "en";
    languageButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.languageButton === selected));
    });
    planField.placeholder = translations[selected].planPlaceholder;
    if (persist) {
        try {
            localStorage.setItem(LANGUAGE_KEY, selected);
        } catch (error) {
            showToast(translations[selected].storageUnavailable);
        }
    }
    saveStatus.textContent = translations[selected].saved;
    setDateLabel();
    updateProgress();
}

function localDateKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function setDateLabel() {
    const language = currentLanguage();
    const date = new Intl.DateTimeFormat(language === "zh" ? "zh-Hant" : "en", {
        weekday: "long",
        month: "short",
        day: "numeric"
    }).format(new Date());
    document.querySelector("[data-today-label]").textContent = `${translations[language].today} / ${date}`;
}

function updateProgress() {
    const done = checkboxes.filter((checkbox) => checkbox.checked).length;
    const language = currentLanguage();
    progressNumber.textContent = `${done}/5`;
    progressCopy.textContent = done === 5
        ? translations[language].checkinComplete
        : translations[language].checkinProgress(done);
    progressRing.style.background = `conic-gradient(var(--green) ${done * 20}%, #dbe8dd ${done * 20}%)`;
    progressRing.style.border = "0";
    progressRing.setAttribute("aria-label", translations[language].progressAria(done));
}

function checkinKey() {
    return `${CHECKIN_PREFIX}${localDateKey()}`;
}

function loadSavedState() {
    try {
        const language = localStorage.getItem(LANGUAGE_KEY);
        if (language === "en" || language === "zh") setLanguage(language, false);

        const savedPlan = localStorage.getItem(PLAN_KEY);
        if (savedPlan !== null) planField.value = savedPlan;

        const savedCheckin = localStorage.getItem(checkinKey());
        if (savedCheckin !== null) {
            const completed = JSON.parse(savedCheckin);
            if (Array.isArray(completed)) {
                checkboxes.forEach((checkbox) => {
                    checkbox.checked = completed.includes(checkbox.dataset.practice);
                });
            }
        }
    } catch (error) {
        showToast(translations[currentLanguage()].storageReadError);
    }
    setDateLabel();
    updateProgress();
}

function saveCheckin() {
    const completed = checkboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.dataset.practice);
    try {
        localStorage.setItem(checkinKey(), JSON.stringify(completed));
    } catch (error) {
        showToast(translations[currentLanguage()].storageUnavailable);
    }
    updateProgress();
}

languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.languageButton));
});

checkboxes.forEach((checkbox) => checkbox.addEventListener("change", saveCheckin));

document.querySelector("[data-reset-checkin]").addEventListener("click", () => {
    const language = currentLanguage();
    if (!window.confirm(translations[language].resetConfirm)) return;
    checkboxes.forEach((checkbox) => { checkbox.checked = false; });
    saveCheckin();
    showToast(translations[language].resetDone);
});

let saveTimeout;
planField.addEventListener("input", () => {
    const language = currentLanguage();
    saveStatus.textContent = translations[language].saving;
    window.clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(() => {
        try {
            localStorage.setItem(PLAN_KEY, planField.value);
            saveStatus.textContent = translations[currentLanguage()].planSaved;
        } catch (error) {
            saveStatus.textContent = translations[currentLanguage()].storageError;
        }
    }, 350);
});

loadSavedState();
