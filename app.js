/**
 * Salati Fi Waqtiha - Main Application Logic
 * Handles Geolocation, Adhan.js integration, UI updates, and Notifications
 */

// translations.js - Embedded to keep single file simple or can be separate
const translations = {
    ar: {
        app_title: "صلاتي في وقتها",
        loading: "جاري التحميل...",
        detecting_location: "جاري تحديد الموقع...",
        next_prayer: "الصلاة القادمة",
        prayer_times: "أوقات الصلاة",
        settings: "الإعدادات",
        language: "اللغة",
        calculation_method: "طريقة الحساب",
        notifications: "التنبيهات",
        enable_notifications: "تفعيل التنبيهات",
        install_app: "تثبيت التطبيق",
        athan_voice: "صوت الأذان",
        athan_makkah: "أذان مكة (الافتراضي)",
        athan_madina: "أذان المدينة",
        athan_quds: "أذان القدس",
        fajr: "الفجر",
        sunrise: "الشروق",
        dhuhr: "الظهر",
        asr: "العصر",
        maghrib: "المغرب",
        isha: "العشاء",
        now: "الآن",
        prayer_time: "وقت الصلاة",
        time_remaining: "الوقت المتبقي",
        test_notification: "تجربة التنبيه",
        select_city: "اختر المدينة",
        manual_selection: "تحديد يدوي"
    },
    en: {
        app_title: "Salati Fi Waqtiha",
        loading: "Loading...",
        detecting_location: "Detecting Location...",
        next_prayer: "Next Prayer",
        prayer_times: "Prayer Times",
        settings: "Settings",
        language: "Language",
        calculation_method: "Calculation Method",
        notifications: "Notifications",
        enable_notifications: "Enable Notifications",
        notification_hint: "Athan will play at prayer time",
        manual_location: "Manual Location",
        update: "Update",
        install_app: "Install App",
        athan_voice: "Athan Voice",
        athan_makkah: "Makkah Athan (Default)",
        athan_madina: "Madina Athan",
        athan_quds: "Al-Quds Athan",
        fajr: "Fajr",
        sunrise: "Sunrise",
        dhuhr: "Dhuhr",
        asr: "Asr",
        maghrib: "Maghrib",
        isha: "Isha",
        now: "Now",
        prayer_time: "It's time for prayer",
        time_remaining: "Time Remaining",
        test_notification: "Test Notification",
        select_city: "Select City",
        manual_selection: "Manual Selection"
    },
    fr: {
        app_title: "Salati Fi Waqtiha",
        loading: "Chargement...",
        detecting_location: "Détection de l'emplacement...",
        next_prayer: "Prochaine Prière",
        prayer_times: "Heures de Prière",
        settings: "Paramètres",
        language: "Langue",
        calculation_method: "Méthode de Calcul",
        notifications: "Notifications",
        enable_notifications: "Activer les Notifications",
        notification_hint: "L'Athan jouera à l'heure de la prière",
        manual_location: "Position Manuelle",
        update: "Mettre à jour",
        install_app: "Installer l'App",
        athan_voice: "Voix de l'Athan",
        athan_makkah: "Athan de la Mecque (Défaut)",
        athan_madina: "Athan de Médine",
        athan_quds: "Athan d'Al-Quds",
        fajr: "Fajr",
        sunrise: "Lever du soleil",
        dhuhr: "Dhuhr",
        asr: "Asr",
        maghrib: "Maghrib",
        isha: "Isha",
        now: "Maintenant",
        prayer_time: "C'est l'heure de la prière",
        time_remaining: "Temps Restant",
        test_notification: "Tester la Notification",
        select_city: "Choisir la Ville",
        manual_selection: "Sélection Manuelle"
    }
};

// State Management
const state = {
    coords: null,
    cityName: localStorage.getItem('user_city_name') || 'Makkah', // Default Name
    prayerTimes: null,
    nextPrayer: null,
    lang: localStorage.getItem('user_lang') || 'ar',
    method: localStorage.getItem('calc_method') || 'MuslimWorldLeague',
    notificationsEnabled: localStorage.getItem('notifications') === 'true',
    darkMode: localStorage.getItem('dark_mode') === 'true',
    audio: new Audio('assets/athan.mp3') // Placeholder path
};

// DOM Elements
const dom = {
    app: document.getElementById('app'),
    loading: document.getElementById('loading-screen'),
    locationText: document.getElementById('location-text'),
    hijriDate: document.getElementById('hijri-date'),
    gregorianDate: document.getElementById('gregorian-date'),
    currentTime: document.getElementById('current-time'),
    nextPrayerName: document.getElementById('next-prayer-name'),
    nextPrayerTime: document.getElementById('next-prayer-time'),
    countdownTimer: document.getElementById('countdown-timer'),
    prayerGrid: document.getElementById('prayer-grid'),
    settingsPanel: document.getElementById('settings-panel'),
    settingsBtn: document.getElementById('settings-btn'),
    closeSettingsBtn: document.getElementById('close-settings'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    languageSelect: document.getElementById('language-select'),
    methodSelect: document.getElementById('method-select'),
    athanSelect: document.getElementById('athan-select'),
    testNotifyBtn: document.getElementById('test-notification'),
    enableNotifyBtn: document.getElementById('enable-notifications'),
    installBtn: document.getElementById('install-pwa'),
    latInput: document.getElementById('latitude-input'),
    lngInput: document.getElementById('longitude-input'),
    updateLocBtn: document.getElementById('update-location')
};

// Initialization
async function init() {
    applyTheme();
    applyLanguage();
    setupEventListeners();
    
    // Attempt to get location from storage first
    const storedLoc = JSON.parse(localStorage.getItem('user_location'));
    if (storedLoc) {
        state.coords = storedLoc;
        updatePrayerTimes();
    } else {
        // Default to Makkah
        state.coords = { latitude: 21.4225, longitude: 39.8262 };
        updatePrayerTimes();
        updateLocationName(); // Will show coords
        // Then try to refine with actual location
        requestLocation();
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('sw.js');
            console.log('ServiceWorker registered:', reg);
        } catch (e) {
            console.error('ServiceWorker registration failed:', e);
        }
    }
    
    // Hide loading screen after a brief delay
    setTimeout(() => {
        dom.loading.style.opacity = '0';
        setTimeout(() => {
            dom.loading.style.display = 'none';
            dom.app.classList.remove('hidden');
        }, 500);
    }, 1000);

    // Start ticker
    setInterval(updateTicker, 1000);
}

// City Selection Logic
function setupCitySelection() {
    if (dom.citySelect) {
        dom.citySelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'manual') {
                dom.latInput.focus();
            } else {
                const [lat, lng] = val.split(',').map(parseFloat);
                state.coords = { latitude: lat, longitude: lng };
                
                // Get text for display
                const selectedText = e.target.options[e.target.selectedIndex].text;
                localStorage.setItem('user_city_name', selectedText);
                localStorage.setItem('user_location', JSON.stringify(state.coords));
                
                updatePrayerTimes();
                updateLocationName();
            }
        });
        
        // Init City Select if coordinates match one of the options
        if (state.coords) {
             // Check if almost matches
             Array.from(dom.citySelect.options).forEach(opt => {
                 if (opt.value !== 'manual') {
                     const [lat, lng] = opt.value.split(',').map(parseFloat);
                     if (Math.abs(lat - state.coords.latitude) < 0.01 && Math.abs(lng - state.coords.longitude) < 0.01) {
                         dom.citySelect.value = opt.value;
                     }
                 }
             });
        }
    }
}

// Location Handling
function requestLocation() {
    dom.locationText.textContent = translations[state.lang].detecting_location;
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            state.coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            localStorage.setItem('user_location', JSON.stringify(state.coords));
            updatePrayerTimes();
            updateLocationName();
        },
        error => {
            console.error('Location error:', error);
            dom.locationText.textContent = "Location access denied. Using manual/default.";
        }
    );
}

// Reverse Geocoding UI Update
function updateLocationName() {
    if(state.coords) {
        // 1. Update Display Text (Main Screen)
        const storedName = localStorage.getItem('user_city_name');
        
        if (storedName && storedName !== 'undefined') {
             dom.locationText.textContent = storedName;
        } else {
             // Fallback to coordinates
             dom.locationText.textContent = `${state.coords.latitude.toFixed(4)}, ${state.coords.longitude.toFixed(4)}`;
        }

        // 2. Update Settings Inputs
        if (dom.latInput && dom.lngInput) {
            dom.latInput.value = state.coords.latitude;
            dom.lngInput.value = state.coords.longitude;
        }
    }
}

// Prayer Times Calculation
function updatePrayerTimes() {
    if (!state.coords) {
        console.error("No coordinates found");
        return;
    }
    
    // Fallback check for Adhan library
    if (!window.adhan) {
        console.error("Adhan library not loaded");
        // Retry logic could go here, or alert user
        return;
    }

    const coordinates = new adhan.Coordinates(state.coords.latitude, state.coords.longitude);
    const date = new Date();
    
    // Map string method to Adhan object
    const params = adhan.CalculationMethod[state.method]();
    params.madhab = adhan.Madhab.Shafi; // Default, maybe add setting later
    
    state.prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
    
    // Update dates
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dom.gregorianDate.textContent = date.toLocaleDateString(state.lang === 'ar' ? 'ar-SA' : state.lang, dateOptions);
    
    // Simple approximate Hijri
    try {
        const hijriFormatter = new Intl.DateTimeFormat(state.lang + '-u-ca-islamic', dateOptions);
        dom.hijriDate.textContent = hijriFormatter.format(date);
    } catch(e) {
        console.log("Hijri date format error", e);
    }

    renderPrayerGrid();
    determineNextPrayer();
}

// Rendering
function renderPrayerGrid() {
    if (!state.prayerTimes) return;

    dom.prayerGrid.innerHTML = '';
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    prayers.forEach(prayer => {
        const time = state.prayerTimes[prayer];
        const formattedTime = formatTime(time);
        const name = translations[state.lang][prayer];
        const isNext = state.nextPrayer === prayer;
        
        const card = document.createElement('div');
        card.className = `prayer-card ${isNext ? 'next' : ''}`;
        if(isNext) card.classList.add('highlight'); // Ensure highlight style is applied
        
        card.innerHTML = `
            <div>
                <div class="prayer-name">${name}</div>
                <div class="prayer-time">${formattedTime}</div>
            </div>
            ${isNext ? '<div class="prayer-icon">➜</div>' : ''}
        `;
        dom.prayerGrid.appendChild(card);
    });
}

function determineNextPrayer() {
    if (!state.prayerTimes) return;
    
    // Recalculate 'now' to ensure freshness
    const now = new Date();
    let next = state.prayerTimes.nextPrayer();
    let nextTime = null;
    
    // If next is none (after Isha), tomorrow's Fajr
    if (next === 'none') {
        next = 'fajr';
        
        // Calculate tomorrow's times to get accurate Fajr calculation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Reset time part for cleaner init
        
        try {
            const tomorrowTimes = new adhan.PrayerTimes(
                new adhan.Coordinates(state.coords.latitude, state.coords.longitude),
                tomorrow,
                adhan.CalculationMethod[state.method]()
            );
            state.nextPrayerTime = tomorrowTimes.fajr;
        } catch(e) {
            console.error("Error calculating tomorrow", e);
            // Fallback: Add 24 hours to today's Fajr (rough estimate)
            const f = new Date(state.prayerTimes.fajr);
            f.setDate(f.getDate() + 1);
            state.nextPrayerTime = f;
        }
    } else {
        state.nextPrayerTime = state.prayerTimes[next];
    }
    
    state.nextPrayer = next;
    
    // Update UI
    if (state.nextPrayerTime) {
        dom.nextPrayerName.textContent = translations[state.lang][next];
        dom.nextPrayerTime.textContent = formatTime(state.nextPrayerTime);
        renderPrayerGrid();
    }
}

function updateTicker() {
    const now = new Date();
    
    // Update Current Time Display
    if (dom.currentTime) {
        dom.currentTime.textContent = formatTimeWithSeconds(now);
    } // If this is failing, check if dom.currentTime exists

    if (!state.prayerTimes || !state.nextPrayer || !state.nextPrayerTime) return;
    
    let targetTime = state.nextPrayerTime;
    
    const diff = targetTime - now;
    
    if (diff <= 0) {
       // Prayer time reached!
       triggerNotification(state.nextPrayer);
       // Add short delay to prevent thrashing
       setTimeout(() => updatePrayerTimes(), 2000); 
       return;
    }
    
    // Format H:M:S
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    if (dom.countdownTimer) {
        dom.countdownTimer.textContent = 
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}

// ... existing code ...

// Helpers
function formatTime(date) {
    // Robust Western Numeral Formatting
    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit', 
            minute: '2-digit',
            hour12: (state.lang === 'ar')
        }).format(date);
    } catch(e) {
        return date.toLocaleTimeString();
    }
}

function formatTimeWithSeconds(date) {
    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: (state.lang === 'ar')
        }).format(date);
    } catch(e) {
        return date.toLocaleTimeString();
    }
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    const sun = dom.darkModeToggle.querySelector('.sun-icon');
    const moon = dom.darkModeToggle.querySelector('.moon-icon');
    if (state.darkMode) {
        if(sun) sun.classList.add('hidden');
        if(moon) moon.classList.remove('hidden');
    } else {
        if(sun) sun.classList.remove('hidden');
        if(moon) moon.classList.add('hidden');
    }
}

function applyLanguage() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    dom.languageSelect.value = state.lang;
    if(dom.athanSelect) dom.athanSelect.value = state.audioSrc;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[state.lang][key]) {
            el.textContent = translations[state.lang][key];
        }
    });

    updatePrayerTimes();
}

// --- SECURE AUDIO & BACKGROUND HANDLING ---

// 1. Wake Lock API (Keep Screen On)
let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock active');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
        }
    } catch (err) {
        console.error('Wake Lock error:', err);
    }
}

// Re-acquire lock if visibility changes (browser releases it on minimize)
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
    
    // Check if we missed a prayer while backgrounded
    if (document.visibilityState === 'visible') {
        updatePrayerTimes();
        checkMissedPrayer(); 
    }
});

function checkMissedPrayer() {
    // Logic to check if now > prayerTime && < prayerTime + 15min
    // Simple version: updateTicker handles logic if called immediately
    updateTicker();
}

// 2. Service Worker Communication (The Bridge)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.action === 'play_athan') {
            console.log('Received play command from SW');
            playAthanSecurely();
        }
    });
}

function playAthanSecurely() {
    // This is called AFTER the user clicks notification (User Gesture context)
    if (!state.notificationsEnabled) return;

    state.audio.currentTime = 0;
    const playPromise = state.audio.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log('Audio playing securely');
        })
        .catch(error => {
            console.error('Audio playback failed:', error);
            // Fallback: visual alert
            alert(translations[state.lang].prayer_time);
        });
    }
}

// Events
function setupEventListeners() {
    setupCitySelection();
    
    dom.settingsBtn.addEventListener('click', () => {
        dom.settingsPanel.classList.remove('hidden');
    });
    
    dom.closeSettingsBtn.addEventListener('click', () => {
        dom.settingsPanel.classList.add('hidden');
    });
    
    dom.darkModeToggle.addEventListener('click', () => {
        state.darkMode = !state.darkMode;
        localStorage.setItem('dark_mode', state.darkMode);
        applyTheme();
    });
    
    dom.languageSelect.addEventListener('change', (e) => {
        state.lang = e.target.value;
        localStorage.setItem('user_lang', state.lang);
        applyLanguage();
    });
    
    dom.methodSelect.addEventListener('change', (e) => {
        state.method = e.target.value;
        localStorage.setItem('calc_method', state.method);
        updatePrayerTimes();
    });

    if (dom.athanSelect) {
        dom.athanSelect.addEventListener('change', (e) => {
            state.audioSrc = e.target.value;
            localStorage.setItem('athan_src', state.audioSrc);
            state.audio.src = state.audioSrc;
            
            // Optional: Play a snippet?
            state.audio.play().then(() => {
                setTimeout(() => state.audio.pause(), 3000);
            }).catch(err => console.log('Audio preview block', err));
        });
    }

    if(dom.testNotifyBtn) {
        dom.testNotifyBtn.addEventListener('click', () => {
            triggerNotification('test_notification'); // Use 'test_notification' key for translation
        });
    }
    
    dom.enableNotifyBtn.addEventListener('click', () => {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                state.notificationsEnabled = true;
                localStorage.setItem('notifications', 'true');
                alert(state.lang === 'ar' ? "تم تفعيل التنبيهات" : "Notifications enabled");
                
                // Pre-load audio
                state.audio.load();
                
                // Request Wake Lock on enable (optional user preference usually, forcing here for reliability)
                requestWakeLock();
            }
        });
    });
    
    dom.updateLocBtn.addEventListener('click', () => {
        const lat = parseFloat(dom.latInput.value);
        const lng = parseFloat(dom.lngInput.value);
        if(!isNaN(lat) && !isNaN(lng)) {
            state.coords = { latitude: lat, longitude: lng };
            localStorage.setItem('user_location', JSON.stringify(state.coords));
            updatePrayerTimes();
            dom.settingsPanel.classList.add('hidden');
        }
    });

    // PWA Install Prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        dom.installBtn.classList.remove('hidden');
        
        dom.installBtn.addEventListener('click', () => {
            dom.installBtn.classList.add('hidden');
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                   console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            });
        });
    });
}


// Start
document.addEventListener('DOMContentLoaded', init);
