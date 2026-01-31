/**
 * Salati Fi Waqtiha - Main Application Logic
 * Contains embedded Prayer Times Calculation Logic (formerly Adhan.js)
 */

// ==========================================
// EMBEDDED LIBRARY: ADHAN.JS logic
// ==========================================
var adhan = (function() {
    'use strict';

    var Coordinates = /** @class */ (function() {
        function Coordinates(latitude, longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
        return Coordinates;
    }());

    var Madhab;
    (function(Madhab) {
        Madhab[Madhab["Shafi"] = 1] = "Shafi";
        Madhab[Madhab["Hanafi"] = 2] = "Hanafi";
    })(Madhab || (Madhab = {}));
    
    var HighLatitudeRule;
    (function(HighLatitudeRule) {
        HighLatitudeRule[HighLatitudeRule["MiddleOfTheNight"] = 1] = "MiddleOfTheNight";
        HighLatitudeRule[HighLatitudeRule["SeventhOfTheNight"] = 2] = "SeventhOfTheNight";
        HighLatitudeRule[HighLatitudeRule["TwilightAngle"] = 3] = "TwilightAngle";
    })(HighLatitudeRule || (HighLatitudeRule = {}));

    var CalculationParameters = /** @class */ (function() {
        function CalculationParameters(methodName, fajrAngle, ishaAngle, ishaInterval, method) {
            this.method = methodName || "Other";
            this.fajrAngle = fajrAngle || 0;
            this.ishaAngle = ishaAngle || 0;
            this.ishaInterval = ishaInterval || 0;
            this.madhab = Madhab.Shafi;
            this.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
            this.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
            this.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
        }
        CalculationParameters.prototype.nightPortions = function() {
            switch (this.highLatitudeRule) {
                case HighLatitudeRule.MiddleOfTheNight: return { fajr: 1/2, isha: 1/2 };
                case HighLatitudeRule.SeventhOfTheNight: return { fajr: 1/7, isha: 1/7 };
                case HighLatitudeRule.TwilightAngle: return { fajr: this.fajrAngle/60, isha: this.ishaAngle/60 };
                default: throw "Invalid high latitude rule";
            }
        };
        return CalculationParameters;
    }());

    var CalculationMethod = /** @class */ (function() {
        function CalculationMethod() {}
        CalculationMethod.MuslimWorldLeague = function() {
            var params = new CalculationParameters("MuslimWorldLeague", 18, 17);
            params.methodAdjustments.dhuhr = 1; return params;
        };
        CalculationMethod.Egyptian = function() {
            var params = new CalculationParameters("Egyptian", 19.5, 17.5);
            params.methodAdjustments.dhuhr = 1; return params;
        };
        CalculationMethod.Karachi = function() {
            var params = new CalculationParameters("Karachi", 18, 18);
            params.methodAdjustments.dhuhr = 1; return params;
        };
        CalculationMethod.UmmAlQura = function() {
            var params = new CalculationParameters("UmmAlQura", 18.5);
            params.ishaInterval = 90; return params;
        };
        CalculationMethod.Dubai = function() {
            var params = new CalculationParameters("Dubai", 18.2, 18.2);
            params.methodAdjustments.sunrise = -3; params.methodAdjustments.dhuhr = 3; params.methodAdjustments.asr = 3; params.methodAdjustments.maghrib = 3; return params;
        };
        CalculationMethod.MoonsightingCommittee = function() {
            var params = new CalculationParameters("MoonsightingCommittee", 18, 18);
            params.methodAdjustments.dhuhr = 5; params.methodAdjustments.maghrib = 3; return params;
        };
        CalculationMethod.NorthAmerica = function() {
            var params = new CalculationParameters("NorthAmerica", 15, 15);
            params.methodAdjustments.dhuhr = 1; return params;
        };
        CalculationMethod.Kuwait = function() { return new CalculationParameters("Kuwait", 18, 17.5); };
        CalculationMethod.Qatar = function() { var params = new CalculationParameters("Qatar", 18); params.ishaInterval = 90; return params; };
        CalculationMethod.Singapore = function() { var params = new CalculationParameters("Singapore", 20, 18); params.methodAdjustments.dhuhr = 1; return params; };
        CalculationMethod.Tehran = function() { return new CalculationParameters("Tehran", 17.7, 14); };
        CalculationMethod.Turkey = function() {
             var params = new CalculationParameters("Turkey", 18, 17);
             params.methodAdjustments.sunrise = -7; params.methodAdjustments.dhuhr = 5; params.methodAdjustments.asr = 4; params.methodAdjustments.maghrib = 7; return params;
        };
        CalculationMethod.Other = function() { return new CalculationParameters("Other", 0, 0); };
        return CalculationMethod;
    }());

    
    // Math Utilities
    function radians(degrees) { return (degrees * Math.PI) / 180.0; }
    function degrees(radians) { return (radians * 180.0) / Math.PI; }
    function dsin(d) { return Math.sin(radians(d)); }
    function dcos(d) { return Math.cos(radians(d)); }
    function dtan(d) { return Math.tan(radians(d)); }
    function darctan(x) { return degrees(Math.atan(x)); }
    function darctan2(y, x) { return degrees(Math.atan2(y, x)); }
    function darccot(x) { return degrees(Math.atan2(1.0, x)); }
    function darcsin(x) { return degrees(Math.asin(x)); }
    function darccos(x) { return degrees(Math.acos(x)); }
    function unwindAngle(angle) { return angle - 360 * Math.floor(angle / 360.0); }
    function normalizeToScale(num, max) { return num - (max * Math.floor(num / max)); }

    function dateByAddingMinutes(date, minutes) {
        return new Date(date.getTime() + (minutes * 60000));
    }
    
    function getJulianDate(date) {
        var year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
        if (month <= 2) { year -= 1; month += 12; }
        var A = Math.floor(year / 100);
        var B = 2 - A + Math.floor(A / 4);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    }

    var SolarTime = /** @class */ (function() {
        function SolarTime(date, coordinates) {
            var julianDate = getJulianDate(date);
            var m = julianDate - 2451545.0;
            var Lo = unwindAngle(280.46607 + 0.98564736 * m);
            var M = unwindAngle(357.52911 + 0.98560028 * m);
            var C = (1.914602 - 0.004817 * m / 36525) * dsin(M) + (0.019993 - 0.000101 * m / 36525) * dsin(2 * M) + 0.000289 * dsin(3 * M);
            var trueLong = Lo + C;
            var Omega = 125.04 - 1934.136 * m / 36525;
            var Lambda = trueLong - 0.00569 - 0.00478 * dsin(Omega);
            var Obliquity = (23.4392911 - 0.01300416 * m / 36525) + 0.00256 * dcos(Omega);

            var alpha = darctan2(dcos(Obliquity) * dsin(Lambda), dcos(Lambda));
            alpha = unwindAngle(alpha);
            alpha = alpha + (Math.floor(Lambda/90)*90 - Math.floor(alpha/90)*90);
            alpha = alpha / 15;

            var delta = darcsin(dsin(Obliquity) * dsin(Lambda));
            this.declination = delta;

            var EquationOfTime = 4 * (Lo/15 - alpha); // Simplified EqT in minutes
            
            // Solar Noon (Transit)
            // Transit = 12h + ZoneOffset - Longitude/15 - EqT/60
            // We calculate purely in local time terms
            var noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
            
            // This 'transit' logic needs to be robust for the specific day
            // We use the 12 - (Lng/15 + TZ) logic
            var tf = 12 + (( noon.getTimezoneOffset() / -60 ) - coordinates.longitude / 15 ) - EquationOfTime/60;
            
            var transitDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            transitDate.setMinutes(tf * 60);
            this.transit = transitDate;
            this.sunrise = null; this.sunset = null; // Calculated in PrayerTimes
        }
        return SolarTime;
    }());

    var Prayer = { Fajr: "fajr", Sunrise: "sunrise", Dhuhr: "dhuhr", Asr: "asr", Maghrib: "maghrib", Isha: "isha", None: "none" };

    var PrayerTimes = /** @class */ (function() {
        function PrayerTimes(coordinates, date, params) {
            this.coordinates = coordinates;
            this.date = date;
            this.calculationParameters = params;
            
            var solar = new SolarTime(date, coordinates);
            this.solar = solar;
            
            var fajrTime, sunriseTime, dhuhrTime, asrTime, sunsetTime, ishaTime;
            
            dhuhrTime = solar.transit;
            
            // Calculate Sun Angle Times
            // T = Transit +/- (1/15) * arccos((-sin(alpha) - sin(phi)sin(delta)) / (cos(phi)cos(delta)))
            function getTimer(angle, isSunriseSunset) {
                var phi = radians(coordinates.latitude);
                var delta = radians(solar.declination);
                var alpha = isSunriseSunset ? 0.833 : angle;
                
                var top = -dsin(alpha) - Math.sin(phi)*Math.sin(delta);
                var bottom = Math.cos(phi)*Math.cos(delta);
                var cosH = top / bottom;
                
                if (cosH > 1 || cosH < -1) return null;
                var H = degrees(Math.acos(cosH));
                return H / 15; // Hours
            }
            
            var fajrDiff = getTimer(params.fajrAngle, false);
            var sunDiff = getTimer(0.833, true);
            var ishaDiff = getTimer(params.ishaAngle, false);

            if (fajrDiff) fajrTime = dateByAddingMinutes(dhuhrTime, -fajrDiff * 60);
            if (sunDiff) {
                sunriseTime = dateByAddingMinutes(dhuhrTime, -sunDiff * 60);
                sunsetTime = dateByAddingMinutes(dhuhrTime, sunDiff * 60); 
            }
            if (ishaDiff) ishaTime = dateByAddingMinutes(dhuhrTime, ishaDiff * 60);

            // Asr
            // A = arccot(shadow + tan(abs(phi - delta)))
            var shadow = params.madhab === Madhab.Shafi ? 1 : 2;
            var phi = radians(coordinates.latitude);
            var delta = radians(solar.declination);
            var angleAsr = darccot(shadow + Math.tan(Math.abs(phi - delta)));
            
            // 90 - angleAsr is the altitude
            var altitudeAsr = angleAsr; 
            // The formula above gives altitude? No, arccot(1+...) gives the angle Z (Zenith distance?)
            // A = arccot(s + tan(phi-delta)) is the altitude?
            // Let's use the standard equation: h = arccot(t + tan(abs(lat-dec)))
            var valIdx = shadow + Math.tan(Math.abs(phi - delta));
            var hAsr = degrees(Math.atan(1.0/valIdx)); // altitude
            
            // Then convert altitude to hour angle
            var cssTop = Math.sin(radians(hAsr)) - Math.sin(phi)*Math.sin(delta);
            var cssBot = Math.cos(phi)*Math.cos(delta);
            var cssH = cssTop/cssBot;
            if(cssH >= -1 && cssH <= 1) {
                var HAsr = degrees(Math.acos(cssH)) / 15;
                asrTime = dateByAddingMinutes(dhuhrTime, HAsr*60);
            }

            this.fajr = fajrTime;
            this.sunrise = sunriseTime;
            this.dhuhr = dhuhrTime;
            this.asr = asrTime;
            this.maghrib = sunsetTime;
            this.isha = ishaTime;

            if(params.ishaInterval > 0 && this.maghrib) {
                this.isha = dateByAddingMinutes(this.maghrib, params.ishaInterval);
            }

            // Adjustments
            var adj = params.adjustments;
            var mAdj = params.methodAdjustments;
            if(this.fajr) this.fajr = dateByAddingMinutes(this.fajr, adj.fajr + mAdj.fajr);
            if(this.sunrise) this.sunrise = dateByAddingMinutes(this.sunrise, adj.sunrise + mAdj.sunrise);
            if(this.dhuhr) this.dhuhr = dateByAddingMinutes(this.dhuhr, adj.dhuhr + mAdj.dhuhr);
            if(this.asr) this.asr = dateByAddingMinutes(this.asr, adj.asr + mAdj.asr);
            if(this.maghrib) this.maghrib = dateByAddingMinutes(this.maghrib, adj.maghrib + mAdj.maghrib);
            if(this.isha) this.isha = dateByAddingMinutes(this.isha, adj.isha + mAdj.isha);
        }
        return PrayerTimes;
    }());

    return {
        Coordinates: Coordinates,
        Madhab: Madhab,
        HighLatitudeRule: HighLatitudeRule,
        CalculationMethod: CalculationMethod,
        PrayerTimes: PrayerTimes,
        Prayer: Prayer
    };
})();

// Initialize Main App (Check if Adhan loaded - now it is always loaded)
if (typeof adhan === 'undefined') {
    // This should never happen now
    alert('Critical Logic Error: Embedded Library Failed');
}

// Translations and App Logic follows...
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
        manual_selection: "تحديد يدوي",
        qibla_finder: "اتجاه القبلة",
        move_phone: "حرك هاتفك لمعايرة البوصلة",
        electronic_tasbeeh: "السبحة الإلكترونية",
        reset: "تصفير",
        share_with_loved: "شارك التطبيق مع أحبابك",
        share_text: "أدعوكم لتجربة تطبيق (صلاتي في وقتها) بأذان الشيخ أحمد ملا ومنبه الصلوات للأبد. حمله الآن: "
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
        manual_selection: "Manual Selection",
        qibla_finder: "Qibla Finder",
        move_phone: "Move your phone to calibrate",
        electronic_tasbeeh: "Digital Tasbeeh",
        reset: "Reset",
        share_with_loved: "Share with Loved Ones",
        share_text: "I invite you to try (Salati Fi Waqtiha) app with accurate prayer times and Athan. Download now: "
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
        manual_selection: "Sélection Manuelle",
        qibla_finder: "Boussole Qibla",
        move_phone: "Bougez votre téléphone pour calibrer",
        electronic_tasbeeh: "Tasbeeh Numérique",
        reset: "Réinitialiser",
        share_with_loved: "Partager avec vos proches",
        share_text: "Je vous invite à essayer l'application (Salati Fi Waqtiha) avec des horaires de prière précis. Téléchargez maintenant : "
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
    audioSrc: localStorage.getItem('athan_src') || './athan.mp3',
    audio: new Audio(localStorage.getItem('athan_src') || './athan.mp3'),
    tasbeehCount: parseInt(localStorage.getItem('tasbeeh_count') || '0'),
    autoTheme: true // Default to true for intelligent mode
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
    citySelect: document.getElementById('city-select'),
    testNotifyBtn: document.getElementById('test-notification'),
    enableNotifyBtn: document.getElementById('enable-notifications'),
    stopAthanBtn: document.getElementById('stop-athan'),
    installBtn: document.getElementById('install-pwa'),
    installBtn: document.getElementById('install-pwa'),
    updateLocBtn: document.getElementById('update-location'),
    // New Feature Elements
    qiblaSection: document.getElementById('qibla-section'),
    compassArrow: document.getElementById('qibla-arrow'),
    qiblaStatus: document.getElementById('qibla-status'),
    tasbeehCount: document.getElementById('tasbeeh-count'),
    tasbeehBtn: document.getElementById('tasbeeh-click-btn'),
    tasbeehReset: document.getElementById('tasbeeh-reset-btn'),
    shareBtn: document.getElementById('share-app-btn')
};

// Initialization
async function init() {
    applyTheme();
    applyLanguage();
    setupEventListeners();
    setupEventListeners();
    setupAlarmListeners(); // Initialize alarm system
    
    // Initialize New Features
    initQibla();
    initTasbeeh();
    initShare();
    checkAutoTheme();
    setInterval(checkAutoTheme, 60000); // Check theme every minute
    
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

// Location Handling with High Accuracy
function requestLocation() {
    dom.locationText.textContent = translations[state.lang].detecting_location;
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    // High accuracy options with timeout
    const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0 // Don't use cached position
    };

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
            let errorMsg = "Location access denied. Please select city manually.";
            if (error.code === error.TIMEOUT) {
                errorMsg = "Location timeout. Please select city manually.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = "Location unavailable. Please select city manually.";
            }
            dom.locationText.textContent = errorMsg;
            // Open settings to show city selector
            if (dom.settingsPanel) {
                dom.settingsPanel.classList.remove('hidden');
            }
        },
        options
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
    console.log("Updating Prayer Times...");
    
    // Safety 1: Check Coordinates
    if (!state.coords) {
        console.error("Coordinates missing. Cannot calculate.");
        dom.locationText.textContent = "يرجى تحديد المدينة / Select City";
        return;
    }
    
    // Safety 2: Check Library
    if (!window.adhan) {
        console.error("Adhan.js library not loaded yet.");
        // Retry in 1 second
        setTimeout(updatePrayerTimes, 1000);
        return;
    }

    try {
        const coordinates = new adhan.Coordinates(state.coords.latitude, state.coords.longitude);
        const date = new Date();
        
        // Map string method to Adhan object
        const params = adhan.CalculationMethod[state.method]();
        params.madhab = adhan.Madhab.Shafi; 
        
        state.prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
        
        if (!state.prayerTimes.fajr) { 
            throw new Error("Calculation failed"); 
        }

        console.log("Calculation Successful", state.prayerTimes);

        // Update dates
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dom.gregorianDate.textContent = date.toLocaleDateString(state.lang === 'ar' ? 'ar-SA' : state.lang, dateOptions);
        
        // Simple approximate Hijri
        try {
            const hijriFormatter = new Intl.DateTimeFormat(state.lang + '-u-ca-islamic', dateOptions);
            dom.hijriDate.textContent = hijriFormatter.format(date);
        } catch(e) { /* Ignore old browser error */ }

        // CRITICAL: Determine next prayer FIRST
        determineNextPrayer();
        
        // Then render the grid with the next prayer highlighted
        renderPrayerGrid();
        
    } catch (err) {
        console.error("Critical calculation error:", err);
        dom.locationText.textContent = "Error calculating times. Please refresh.";
    }
}

// CRITICAL: Determine Next Prayer with Midnight Crossover Logic
function determineNextPrayer() {
    if (!state.prayerTimes) {
        console.warn("determineNextPrayer called with no prayer times");
        return;
    }

    const now = new Date();
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    // Find the next prayer by comparing current time with each prayer time
    let nextPrayer = null;
    let nextPrayerTime = null;
    
    for (const prayer of prayers) {
        const prayerTime = state.prayerTimes[prayer];
        if (prayerTime && prayerTime > now) {
            nextPrayer = prayer;
            nextPrayerTime = prayerTime;
            break;
        }
    }
    
    // Midnight Crossover: If no prayer found today, next is tomorrow's Fajr
    if (!nextPrayer) {
        console.log("All prayers passed for today. Next prayer is tomorrow's Fajr.");
        
        // Calculate tomorrow's prayer times
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        try {
            const coordinates = new adhan.Coordinates(state.coords.latitude, state.coords.longitude);
            const params = adhan.CalculationMethod[state.method]();
            params.madhab = adhan.Madhab.Shafi;
            const tomorrowPrayers = new adhan.PrayerTimes(coordinates, tomorrow, params);
            
            nextPrayer = 'fajr';
            nextPrayerTime = tomorrowPrayers.fajr;
        } catch (err) {
            console.error("Error calculating tomorrow's Fajr:", err);
            return;
        }
    }
    
    // Update state
    state.nextPrayer = nextPrayer;
    state.nextPrayerTime = nextPrayerTime;
    
    // Update UI
    if (dom.nextPrayerName) {
        dom.nextPrayerName.textContent = translations[state.lang][nextPrayer];
    }
    if (dom.nextPrayerTime) {
        dom.nextPrayerTime.textContent = formatTime(nextPrayerTime);
    }
    
    console.log(`Next Prayer: ${nextPrayer} at ${formatTime(nextPrayerTime)}`);
}

// Rendering
function renderPrayerGrid() {
    if (!state.prayerTimes) {
        console.warn("renderPrayerGrid called with no times");
        return;
    }

    console.log("Rendering Prayer List...");
    dom.prayerGrid.innerHTML = '';
    
    // Explicit list to ensure order
    const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    const nextPrayerKey = state.nextPrayer; // Calculated by determineNextPrayer

    prayers.forEach(prayer => {
        const time = state.prayerTimes[prayer];
        
        if (!time) return; // Skip invalid times
        
        const formattedTime = formatTime(time);
        const name = translations[state.lang][prayer];
        
        // Determine if this is the next prayer being waited for
        const isNext = (prayer === nextPrayerKey);
        
        const row = document.createElement('div');
        // Use 'prayer-row' class instead of card
        row.className = `prayer-row ${isNext ? 'next highlight' : ''}`;
        
        // Simple Row Layout: Name on one side, Time on other
        row.innerHTML = `
            <div class="prayer-name">
                ${name}
                ${isNext ? '<span class="prayer-icon">⏳</span>' : ''}
            </div>
            <div class="prayer-time" dir="ltr">${formattedTime}</div>
        `;
        dom.prayerGrid.appendChild(row);
    });
}

function updateTicker() {
    const now = new Date();
    
    // Update Current Time Display
    if (dom.currentTime) {
        dom.currentTime.textContent = formatTimeWithSeconds(now);
    }

    if (!state.prayerTimes || !state.nextPrayer || !state.nextPrayerTime) return;
    
    let targetTime = state.nextPrayerTime;
    
    const diff = targetTime - now;
    
    if (diff <= 0) {
       // Prayer time reached!
       triggerNotification(state.nextPrayer);
       
       // CRITICAL FIX: Re-determine next prayer instead of recalculating all times
       // This allows the next prayer to update automatically
       setTimeout(() => {
           determineNextPrayer(); // This will find the next prayer
           renderPrayerGrid(); // Update the UI to highlight the new next prayer
       }, 2000);
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

// Trigger Notification Function
function triggerNotification(prayerName) {
    if (!state.notificationsEnabled) return;
    
    const title = translations[state.lang].prayer_time || "Prayer Time";
    const body = `${translations[state.lang][prayerName] || prayerName}`;
    
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: 'icon-192.png',
            badge: 'icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'prayer-notification',
            requireInteraction: true
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
            playAthanSecurely();
        };
        
        // Auto-play athan if enabled
        playAthanSecurely();
    }
}

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

function stopAthan() {
    if (state.audio) {
        state.audio.pause();
        state.audio.currentTime = 0;
        console.log('Athan stopped');
    }
}

function playAthanSecurely() {
    // This is called AFTER the user clicks notification (User Gesture context)
    if (!state.notificationsEnabled) return;

    state.audio.currentTime = 0;
    const playPromise = state.audio.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log('Audio playing securely');
            // Show stop button if it exists
            if (dom.stopAthanBtn) {
                dom.stopAthanBtn.style.display = 'block';
            }
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
    
    if (dom.updateLocBtn) {
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
    }

    // Stop Athan Button
    if (dom.stopAthanBtn) {
        dom.stopAthanBtn.addEventListener('click', () => {
            stopAthan();
            dom.stopAthanBtn.style.display = 'none';
        });
    }

    // PWA Install Prompt
    let deferredPrompt;
    
    // Add header button to logic
    const headerInstallBtn = document.getElementById('header-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        
        // Update UI to notify the user they can add to home screen
        if (dom.installBtn) dom.installBtn.classList.remove('hidden');
        if (headerInstallBtn) headerInstallBtn.classList.remove('hidden');
        
        const installHandler = () => {
            // Hide the app provided install promotion
            if (dom.installBtn) dom.installBtn.classList.add('hidden');
            if (headerInstallBtn) headerInstallBtn.classList.add('hidden');
            
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                   console.log('User accepted the install prompt');
                } else {
                   console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
            });
        };

        if (dom.installBtn) dom.installBtn.addEventListener('click', installHandler);
        if (headerInstallBtn) headerInstallBtn.addEventListener('click', installHandler);
    });
}

// ============================================
// ALARM SYSTEM - Advanced Features
// ============================================

// Alarm State Management
const alarmState = {
    enabled: JSON.parse(localStorage.getItem('alarm_settings')) || {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
    },
    mode: localStorage.getItem('alarm_mode') || 'none' // 'lifetime', 'specific', 'today', 'none'
};

// Save alarm settings to localStorage
function saveAlarmSettings() {
    localStorage.setItem('alarm_settings', JSON.stringify(alarmState.enabled));
    localStorage.setItem('alarm_mode', alarmState.mode);
}

// Generate .ics file for calendar integration
function generateICSFile(prayerName, prayerTime, recurring = true) {
    const now = new Date();
    const dtstart = formatICSDate(prayerTime);
    const dtstamp = formatICSDate(now);
    
    // Create unique UID
    const uid = `prayer-${prayerName}-${Date.now()}@salati-fi-waqtiha.app`;
    
    // Build RRULE for daily recurrence
    const rrule = recurring ? 'RRULE:FREQ=DAILY' : '';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Salati Fi Waqtiha//Prayer Times//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:صلاتي في وقتها
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
${rrule}
SUMMARY:${translations[state.lang][prayerName]} - Prayer Time
DESCRIPTION:Time for ${translations[state.lang][prayerName]} prayer
LOCATION:${state.cityName || 'Your Location'}
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:${translations[state.lang][prayerName]} prayer time
END:VALARM
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:AUDIO
DESCRIPTION:Athan
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

// Format date for ICS file (YYYYMMDDTHHMMSS)
function formatICSDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

// Download .ics file
function downloadICSFile(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// Enable Lifetime Recurring Alarms (All Prayers)
function enableLifetimeAlarms() {
    if (!state.prayerTimes) {
        alert(state.lang === 'ar' ? 'يرجى الانتظار حتى يتم حساب أوقات الصلاة' : 'Please wait for prayer times to be calculated');
        return;
    }
    
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    prayers.forEach(prayer => {
        const prayerTime = state.prayerTimes[prayer];
        if (prayerTime) {
            const icsContent = generateICSFile(prayer, prayerTime, true);
            const filename = `${prayer}-daily-alarm.ics`;
            downloadICSFile(icsContent, filename);
            
            // Mark as enabled
            alarmState.enabled[prayer] = true;
        }
    });
    
    alarmState.mode = 'lifetime';
    saveAlarmSettings();
    updateAlarmUI();
    
    alert(state.lang === 'ar' 
        ? 'تم إنشاء ملفات التنبيه لجميع الصلوات. يرجى فتح الملفات وإضافتها إلى التقويم.' 
        : 'Alarm files created for all prayers. Please open the files and add them to your calendar.');
}

// Enable Specific Prayer Alarm
function enableSpecificPrayerAlarm(prayerName) {
    if (!state.prayerTimes || !state.prayerTimes[prayerName]) {
        alert(state.lang === 'ar' ? 'خطأ في حساب وقت الصلاة' : 'Error calculating prayer time');
        return;
    }
    
    const prayerTime = state.prayerTimes[prayerName];
    const icsContent = generateICSFile(prayerName, prayerTime, true);
    const filename = `${prayerName}-daily-alarm.ics`;
    downloadICSFile(icsContent, filename);
    
    alarmState.enabled[prayerName] = true;
    alarmState.mode = 'specific';
    saveAlarmSettings();
    updateAlarmUI();
    
    alert(state.lang === 'ar' 
        ? `تم إنشاء تنبيه ${translations[state.lang][prayerName]}. يرجى إضافته إلى التقويم.`
        : `${translations[state.lang][prayerName]} alarm created. Please add it to your calendar.`);
}

// Disable Specific Prayer Alarm
function disableSpecificPrayerAlarm(prayerName) {
    alarmState.enabled[prayerName] = false;
    saveAlarmSettings();
    updateAlarmUI();
    
    alert(state.lang === 'ar' 
        ? `تم تعطيل تنبيه ${translations[state.lang][prayerName]}. يرجى حذفه من التقويم يدوياً.`
        : `${translations[state.lang][prayerName]} alarm disabled. Please remove it from your calendar manually.`);
}

// Enable Today Only Alarms
function enableTodayOnlyAlarms() {
    if (!state.prayerTimes) {
        alert(state.lang === 'ar' ? 'يرجى الانتظار حتى يتم حساب أوقات الصلاة' : 'Please wait for prayer times to be calculated');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        alert(state.lang === 'ar' ? 'يرجى تفعيل التنبيهات أولاً' : 'Please enable notifications first');
        return;
    }
    
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const now = new Date();
    
    prayers.forEach(prayer => {
        const prayerTime = state.prayerTimes[prayer];
        if (prayerTime && prayerTime > now) {
            alarmState.enabled[prayer] = true;
        }
    });
    
    alarmState.mode = 'today';
    saveAlarmSettings();
    updateAlarmUI();
    
    alert(state.lang === 'ar' 
        ? 'تم تفعيل التنبيهات لصلوات اليوم فقط'
        : 'Notifications enabled for today\'s prayers only');
}

// Update Alarm UI
function updateAlarmUI() {
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    prayers.forEach(prayer => {
        const toggle = document.getElementById(`alarm-toggle-${prayer}`);
        if (toggle) {
            toggle.checked = alarmState.enabled[prayer];
        }
        
        // Add visual indicator to prayer card
        const prayerCards = dom.prayerGrid.querySelectorAll('.prayer-card');
        prayerCards.forEach(card => {
            const prayerNameEl = card.querySelector('.prayer-name');
            if (prayerNameEl && prayerNameEl.textContent === translations[state.lang][prayer]) {
                if (alarmState.enabled[prayer]) {
                    card.classList.add('alarm-enabled');
                } else {
                    card.classList.remove('alarm-enabled');
                }
            }
        });
    });
}

// Setup Alarm Event Listeners
function setupAlarmListeners() {
    // Lifetime Alarms Button
    const lifetimeBtn = document.getElementById('enable-lifetime-alarms');
    if (lifetimeBtn) {
        lifetimeBtn.addEventListener('click', enableLifetimeAlarms);
    }
    
    // Today Only Button
    const todayBtn = document.getElementById('enable-today-alarms');
    if (todayBtn) {
        todayBtn.addEventListener('click', enableTodayOnlyAlarms);
    }
    
    // Individual Prayer Toggles
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    prayers.forEach(prayer => {
        const toggle = document.getElementById(`alarm-toggle-${prayer}`);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    enableSpecificPrayerAlarm(prayer);
                } else {
                    disableSpecificPrayerAlarm(prayer);
                }
            });
        }
    });
    
    // Select All Prayers Toggle
    const selectAllBtn = document.getElementById('select-all-alarms');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const allEnabled = Object.values(alarmState.enabled).every(v => v);
            const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            
            prayers.forEach(prayer => {
                alarmState.enabled[prayer] = !allEnabled;
                const toggle = document.getElementById(`alarm-toggle-${prayer}`);
                if (toggle) {
                    toggle.checked = !allEnabled;
                }
            });
            
            saveAlarmSettings();
            updateAlarmUI();
        });
    }
}




// ============================================
// NEW FEATURES IMPLEMENTATION
// ============================================

// 1. Qibla Finder - Improved Logic
function initQibla() {
    const isIOS = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
    // iPad on iOS 13 detection
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    if (window.DeviceOrientationEvent) {
        // iOS 13+ permission support
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            dom.qiblaStatus.textContent = "اضغط على البوصلة لتفعيلها / Tap to Enable";
            dom.qiblaStatus.style.cursor = "pointer";
            
            dom.qiblaStatus.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            window.addEventListener('deviceorientation', (e) => handleOrientation(e, true));
                            dom.qiblaStatus.textContent = translations[state.lang].move_phone;
                        } else {
                            dom.qiblaStatus.textContent = "Permission denied. Reset permission in settings.";
                        }
                    })
                    .catch(console.error);
            }, { once: true });
            
            dom.qiblaSection.classList.remove('hidden');
        } else {
            // Android and non-iOS permissions devices
            // Try 'deviceorientationabsolute' for Android first which gives absolute north
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', (e) => handleOrientation(e, false));
            } else {
                // Fallback to standard
                window.addEventListener('deviceorientation', (e) => handleOrientation(e, false));
            }
            dom.qiblaSection.classList.remove('hidden');
        }
    } else {
        dom.qiblaStatus.textContent = "Compass not supported on this device";
    }
}

function handleOrientation(event, isIOS) {
    if (!state.coords) return;

    // Calculate Qibla Direction (Bearing) relative to True North
    // Kaaba: 21.4225, 39.8262
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;
    const lat = state.coords.latitude;
    const lng = state.coords.longitude;
    
    // Formula to find Qibla bearing from North
    const y = Math.sin(degToRad(makkahLng - lng));
    const x = Math.cos(degToRad(lat)) * Math.tan(degToRad(makkahLat)) - 
              Math.sin(degToRad(lat)) * Math.cos(degToRad(makkahLng - lng));
    
    let qiblaBearing = radToDeg(Math.atan2(y, x));
    qiblaBearing = (qiblaBearing + 360) % 360; // Normalize to 0-360

    // Get Device Heading (Alpha)
    // alpha is usually 0 when pointing North, but implementations vary
    let compassHeading = null;

    if (isIOS) {
        // iOS: webkitCompassHeading is relative to magnetic north
        // We usually want True North, but Magnetic is close enough for simple Qibla
        compassHeading = event.webkitCompassHeading; 
    } else {
        // Android/Standard
        // event.alpha is the direction the device is pointing (0=North, 90=West? No, 0=North, Anti-clockwise usually)
        // Standard: alpha is 0 at North, increasing anti-clockwise.
        // But in some browsers it's absolute, in others relative.
        
        if (event.absolute) {
           // On Chrome Android, alpha is 0 at North.
           // Direction = 360 - alpha
           compassHeading = event.alpha;
           // Adjust because alpha often grows anti-clockwise
           compassHeading = 360 - compassHeading; 
        } else {
           // Not absolute - likely meaningless for Qibla without calibration or GPS motion
           // Try to use it anyway
           if(event.alpha !== null) compassHeading = 360 - event.alpha;
        }
    }

    if (compassHeading === null) return;

    // Calculate Rotation
    // If I am facing 0° (North), and Qibla is 90° (East). Arrow should point 90° right.
    // CSS Rotation: 0 is Up. 90 is Right.
    // Arrow Rotation = QiblaBearing - DeviceHeading
    // Example: Heading 0 (North). Qibla 135. Arrow -> 135 deg.
    // Example: Heading 90 (East). Qibla 135. I need to turn 45 deg more right. Arrow -> 45 deg.
    
    // Adjust compass heading phase
    // Android alpha typically: North=0, East=270, South=180, West=90 (Counter-Clockwise)
    // We want North=0, East=90... (Clockwise)
    // So if Android gives us counter-clockwise, we do 360-alpha? Done above.
    
    let rotation = qiblaBearing - compassHeading;
    
    // Smooth transition
    dom.compassArrow.style.transition = 'transform 0.1s ease-out';
    dom.compassArrow.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
    
    dom.qiblaStatus.textContent = `${Math.round(qiblaBearing)}° Qibla | ${Math.round(compassHeading)}° Heading`;
}

function degToRad(deg) { return deg * Math.PI / 180; }
function radToDeg(rad) { return rad * 180 / Math.PI; }

// 2. Digital Tasbeeh
function initTasbeeh() {
    dom.tasbeehCount.textContent = state.tasbeehCount;
    
    dom.tasbeehBtn.addEventListener('click', () => {
        state.tasbeehCount++;
        dom.tasbeehCount.textContent = state.tasbeehCount;
        localStorage.setItem('tasbeeh_count', state.tasbeehCount);
        
        // Vibrate
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    });
    
    dom.tasbeehReset.addEventListener('click', () => {
        if(confirm(state.lang === 'ar' ? 'هل أنت متأكد من التصفير؟' : 'Reset counter?')) {
            state.tasbeehCount = 0;
            dom.tasbeehCount.textContent = 0;
            localStorage.setItem('tasbeeh_count', 0);
        }
    });
}

// 3. Intelligent Dark Mode
function checkAutoTheme() {
    // Only auto-switch if user hasn't manually forced a mode recently 
    // OR if we want to enforce it. Let's enforce "Intelligent" behavior as default.
    // If user toggles manually, we could respect that until next app load or keep it.
    // For this implementation: "If current time between Maghrib and Fajr -> Dark"
    
    if (!state.prayerTimes) return;
    
    const now = new Date();
    const maghrib = state.prayerTimes.maghrib;
    const fajr = state.prayerTimes.fajr;
    
    // Logic: Dark if (Now > Maghrib) OR (Now < Fajr)
    // Note: Fajr is for "today", so if Now < Fajr, it's technically "early morning" which is dark.
    
    let shouldBeDark = false;
    
    if (now >= maghrib || now < fajr) {
        shouldBeDark = true;
    }
    
    // Only apply if it differs from current to avoid flickering or overriding manual too aggressively?
    // Requirement says: "Otherwise, use 'Light Theme'. Also, allow manual toggle."
    // We'll update state.darkMode but only apply if we haven't manually toggled in this session?
    // Let's just update the default state.
    
    // We already have state.darkMode loaded from localStorage. 
    // If we want "Intelligent" to be the default, we should perhaps only apply this if user HASN'T set a preference?
    // Or maybe we treat "Intelligent" as a separate setting?
    // The prompt says "Auto Dark Mode... auto switching... or follows phone settings".
    // Let's use the valid prayer times to suggest the mode.
    
    // We will Only override if the user hasn't explicitly set a preference in localStorage 
    // BUT the prompt implies dynamic switching. 
    // Let's implement dynamic switching that updates the UI, 
    // but the manual toggle updates localStorage which takes precedence on reload.
    // Actually, "Intelligent" implies it changes automatically. 
    
    if (shouldBeDark && !state.darkMode) {
         // It should be dark, but isn't. Switch it.
         state.darkMode = true;
         applyTheme();
    } else if (!shouldBeDark && state.darkMode) {
         // It should be light, but is dark. Switch it.
         // Wait, be careful not to override user manual toggle during the day.
         // Let's rely on the requirement: "Automatically... allow manual toggle".
         // Use a session flag to respect manual toggle?
         if (!window.manualThemeToggle) {
             state.darkMode = false;
             applyTheme();
         }
    }
}

// Hook into manual toggle to set flag
if (dom.darkModeToggle) {
    dom.darkModeToggle.addEventListener('click', () => {
        window.manualThemeToggle = true;
    });
}


// 4. PWA Share
function initShare() {
    if (navigator.share) {
        dom.shareBtn.style.display = 'flex';
        dom.shareBtn.addEventListener('click', () => {
            const shareData = {
                title: translations[state.lang].app_title,
                text: translations[state.lang].share_text,
                url: window.location.href
            };
            
            navigator.share(shareData)
                .then(() => console.log('Shared successfully'))
                .catch((err) => console.error('Error sharing:', err));
        });
    } else {
        dom.shareBtn.style.display = 'none'; // Hide if not supported
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
