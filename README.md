# صلاتي في وقتها - Prayer Times PWA

> **Accurate Prayer Times with Advanced Alarm System**  
> أوقات الصلاة الدقيقة مع نظام تنبيهات متقدم

A Progressive Web App (PWA) that provides accurate Islamic prayer times with an advanced alarm system, offline functionality, and multi-language support.

## ✨ Features

### 🕌 Prayer Times

- **Accurate Calculations** using Adhan.js library
- **Multiple Calculation Methods** (Muslim World League, Egyptian, Karachi, etc.)
- **High-Accuracy Geolocation** with automatic city detection
- **Manual City Selection** with pre-populated major cities
- **Real-time Countdown** to next prayer (HH:MM:SS)
- **Midnight Crossover Logic** - correctly shows tomorrow's Fajr after Isha

### ⏰ Advanced Alarm System

#### 1. Lifetime Recurring Alarms (كل الصلوات دائماً)

- Generate .ics calendar files for all 5 prayers
- Includes `RRULE:FREQ=DAILY` for permanent daily recurrence
- Import once into your calendar app and alarms repeat forever

#### 2. Specific Prayer Selection (تحديد صلوات معينة)

- Individual toggle switches for each prayer
- Generate .ics files for selected prayers only
- Visual bell indicator (🔔) on enabled prayers

#### 3. Today Only (صلوات اليوم فقط)

- Browser notifications for today's prayers only
- No calendar integration required
- Expires after today

### 🌐 Offline Support

- **100% Offline Functionality** after first load
- Cache-first Service Worker strategy
- Pre-cached audio files and prayer calculation library
- Works without internet connection

### 🎨 UI/UX

- **Dark Mode** support
- **Multi-language** (Arabic, English, French)
- **Responsive Design** for all screen sizes
- **RTL/LTR** support
- **Smooth Animations** and transitions

## 🚀 Quick Start

### For Users

1. **Visit the App**: Open the PWA in your browser
2. **Allow Location**: Grant location permission for accurate prayer times
3. **Enable Notifications**: Click "تفعيل التنبيهات" in settings
4. **Set Alarms**: Choose your preferred alarm mode:
   - Click "تفعيل لكل الصلوات دائماً" for all prayers
   - Toggle individual prayers for specific alarms
   - Click "صلوات اليوم فقط" for today only
5. **Import .ics Files**: Open downloaded .ics files and add to your calendar

### For Developers

#### Prerequisites

- Web server (for local testing) or GitHub Pages
- Audio files: `athan.mp3`, `athan_madina.mp3`, `athan_quds.mp3` in root directory

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/salati-fi-waqtiha.git
cd salati-fi-waqtiha

# Serve locally (Python example)
python -m http.server 8000

# Or use any web server
npx serve .
```

#### File Structure

```
salati-fi-waqtiha/
├── index.html          # Main HTML file
├── app.js              # Application logic
├── styles.css          # Styling
├── sw.js               # Service Worker
├── manifest.json       # PWA manifest
├── athan.mp3           # Default athan audio
├── athan_madina.mp3    # Madina athan audio
├── athan_quds.mp3      # Al-Quds athan audio
├── icon-192.png        # App icon (192x192)
├── icon-512.png        # App icon (512x512)
├── sitemap.xml         # SEO sitemap
└── robots.txt          # SEO robots file
```

## 📱 Deployment to GitHub Pages

1. **Ensure audio files are in root directory**
2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy PWA"
   git push origin main
   ```
3. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`

## 🔧 Configuration

### Prayer Calculation Methods

Available in Settings panel:

- Muslim World League
- Egyptian General Authority
- University of Islamic Sciences, Karachi
- Umm Al-Qura University, Makkah
- Dubai, Qatar, Kuwait
- Moonsighting Committee
- Singapore
- Islamic Society of North America

### Supported Cities

Pre-configured cities include:

- Makkah, Madina, Al-Quds
- Riyadh, Cairo, Dubai
- Istanbul, London, New York
- Paris, Kuala Lumpur, Jakarta

## 🛠️ Technical Details

### Technologies Used

- **Vanilla JavaScript** (ES6+)
- **Adhan.js** for prayer calculations
- **Service Worker API** for offline support
- **Web Notifications API** for alerts
- **Geolocation API** with high accuracy
- **iCalendar (.ics)** format for alarms

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with PWA support

### Key Features Implementation

#### Geolocation

```javascript
const options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};
navigator.geolocation.getCurrentPosition(success, error, options);
```

#### .ics File Generation

```javascript
const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatICSDate(prayerTime)}
RRULE:FREQ=DAILY
SUMMARY:${prayerName} - Prayer Time
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:AUDIO
END:VALARM
END:VEVENT
END:VCALENDAR`;
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for the Muslim community**  
صُنع بحب للمجتمع الإسلامي
