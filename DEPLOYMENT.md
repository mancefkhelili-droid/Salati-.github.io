# Deployment Guide - صلاتي في وقتها

## 📋 Pre-Deployment Checklist

### ✅ Required Files in Root Directory

Ensure these files exist in the **root** directory (not in `assets/` folder):

- [ ] `athan.mp3` - Default Makkah athan audio
- [ ] `athan_madina.mp3` - Madina athan audio
- [ ] `athan_quds.mp3` - Al-Quds athan audio
- [ ] `icon-192.png` - App icon (192x192px)
- [ ] `icon-512.png` - App icon (512x512px)

> **Important:** Audio files MUST be in root directory for GitHub Pages to work correctly.

### ✅ File Structure Verification

```
salati-fi-waqtiha/
├── index.html
├── app.js
├── styles.css
├── sw.js
├── manifest.json
├── athan.mp3           ← Must be here
├── athan_madina.mp3    ← Must be here
├── athan_quds.mp3      ← Must be here
├── icon-192.png
├── icon-512.png
├── sitemap.xml
├── robots.txt
└── README.md
```

## 🚀 GitHub Pages Deployment

### Step 1: Prepare Repository

```bash
# Navigate to project directory
cd c:\Users\DELL\Desktop\project.code\salati-fi-waqtiha

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "feat: Add advanced alarm system and bug fixes"
```

### Step 2: Push to GitHub

```bash
# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/yourusername/salati-fi-waqtiha.git

# Push to main branch
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Step 4: Access Your App

Your app will be available at:

```
https://yourusername.github.io/salati-fi-waqtiha/
```

## 🧪 Testing After Deployment

### Test Checklist

1. **Basic Functionality**
   - [ ] App loads without errors
   - [ ] Prayer times display correctly
   - [ ] Current time updates every second
   - [ ] Next prayer countdown works

2. **Geolocation**
   - [ ] Location permission prompt appears
   - [ ] High-accuracy GPS works
   - [ ] Fallback to city selection works
   - [ ] Manual location input works

3. **Alarm System**
   - [ ] "تفعيل لكل الصلوات دائماً" button downloads 5 .ics files
   - [ ] Individual prayer toggles work
   - [ ] .ics files open in calendar app
   - [ ] Alarm settings persist after refresh

4. **Offline Functionality**
   - [ ] Service Worker registers successfully
   - [ ] App works offline after first load
   - [ ] Audio files play offline
   - [ ] Prayer calculations work offline

5. **Audio**
   - [ ] Athan audio files load correctly
   - [ ] Audio plays when notification clicked
   - [ ] Different athan selections work

6. **PWA Features**
   - [ ] "Install App" prompt appears
   - [ ] App installs as PWA
   - [ ] Notifications work
   - [ ] Dark mode toggles correctly

## 🐛 Troubleshooting

### Audio Files Not Playing

**Problem:** Audio files return 404 errors

**Solution:**

```bash
# Verify files are in root directory
ls athan*.mp3

# If in assets folder, move them:
mv assets/athan*.mp3 .
```

### Service Worker Not Updating

**Problem:** Old cached version still loading

**Solution:**

1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Click "Unregister"
4. Hard refresh (Ctrl+Shift+R)

### Geolocation Not Working

**Problem:** Location permission denied or timeout

**Solution:**

- Ensure HTTPS is enabled (GitHub Pages uses HTTPS by default)
- Check browser location permissions
- Use manual city selection as fallback

### .ics Files Not Downloading

**Problem:** Browser blocks downloads

**Solution:**

- Check browser download settings
- Allow downloads from your domain
- Try different browser

## 📊 Performance Optimization

### Lighthouse Scores Target

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100
- **PWA:** ✓ All checks passed

### Optimization Tips

1. **Images:** Icons are already optimized (PNG format)
2. **Caching:** Service Worker implements cache-first strategy
3. **Minification:** Consider minifying CSS/JS for production
4. **CDN:** Adhan.js loaded from jsDelivr CDN

## 🔒 Security Considerations

### Content Security Policy

Already implemented in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; ..." />
```

### HTTPS

GitHub Pages automatically provides HTTPS. Ensure:

- All external resources use HTTPS
- No mixed content warnings

## 📱 Mobile Testing

### iOS

1. Open Safari
2. Navigate to your app URL
3. Tap Share → Add to Home Screen
4. Test PWA functionality

### Android

1. Open Chrome
2. Navigate to your app URL
3. Tap menu → Install app
4. Test PWA functionality

## 🔄 Updates & Maintenance

### Updating Prayer Times

Prayer times are calculated dynamically - no updates needed.

### Updating Audio Files

1. Replace audio files in root directory
2. Update Service Worker cache version:
   ```javascript
   const CACHE_NAME = "salati-v3"; // Increment version
   ```
3. Commit and push changes

### Updating Calculation Methods

Edit `app.js` to add new methods:

```javascript
<option value="NewMethod">New Method Name</option>
```

## 📈 Analytics (Optional)

To add Google Analytics:

1. Add tracking code to `index.html`:

```html
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
></script>
```

2. Update Content Security Policy to allow analytics

## ✅ Post-Deployment Verification

Run this checklist 24 hours after deployment:

- [ ] App is accessible via GitHub Pages URL
- [ ] No console errors in browser DevTools
- [ ] Service Worker active and caching correctly
- [ ] All 5 prayer times display accurately
- [ ] Alarms generate and download successfully
- [ ] Mobile PWA install works on iOS and Android
- [ ] Offline mode works after first visit

---

**Deployment Complete! 🎉**

Your PWA is now live and ready to serve the Muslim community worldwide.
