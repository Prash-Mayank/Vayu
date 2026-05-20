# Vayu Weather Application 🌤️

A modern, feature-rich weather forecasting application with glassmorphism design, dynamic backgrounds, and PWA support.

## ✨ Features Implemented

### 🎨 Core Design Features

- **Enhanced Glassmorphism Design** - Beautiful frosted glass effect with improved backdrop blur and gradient overlays
- **Dynamic Weather Backgrounds** - Different backgrounds for light/dark themes and weather conditions
- **Dark/Light Theme Toggle** - Seamless theme switching with auto-save preference
- **Responsive Design** - Perfect experience on desktop, tablet, and mobile devices

### 🚀 New Features

#### 1. **Time-Based Greetings**

- Personalized greetings based on time of day (Morning/Afternoon/Evening)
- Dynamic subtitles that change throughout the day

#### 2. **Enhanced Recent Searches & Favorites**

- **Improved Visual Design** - Beautiful glassmorphic cards with gradient effects
- **Hover Animations** - Smooth transformations and color transitions
- **Recent Searches** - Automatic saving of last 7 searched cities with quick access chips
- **Favorite Locations** - Save up to 5 favorite cities with star button
- **One-Click Access** - Click any chip to instantly view weather
- **Persistent Storage** - All data saved across sessions

#### 3. **7-Day Forecast (FIXED)**

- Now properly displays all 7 days of forecast
- Accurate temperature ranges for each day
- Smart date handling for partial days

#### 4. **24-Hour Forecast with Horizontal Scroll**

- Smooth horizontal scrolling for hourly forecast
- Beautiful custom scrollbar with gradient styling
- Touch-friendly swipe navigation on mobile
- Shows weather every 2 hours for next 24 hours

#### 5. **Weather Notifications** 🔔

- **Toggle Notifications** - Enable/disable via notification bell icon in header
- **Weather Updates** - Get notified when checking weather for new locations
- **Severe Weather Alerts** - Automatic notifications for:
  - Extreme heat (>40°C)
  - Freezing temperatures (<0°C)
  - Thunderstorms
  - Snow conditions
- **Smart Permission Handling** - Non-intrusive permission requests
- **Visual Indicators** - Active notification button shows enabled state

#### 6. **PWA (Progressive Web App) Support**

- Install app on any device
- Offline capability with service worker
- App-like experience with standalone mode
- Smart install prompt that can be dismissed
- Works without internet once cached

#### 7. **Share Feature**

- Native share API integration
- Share current weather to social media, messages, etc.
- Fallback to clipboard copy on unsupported browsers
- Visual feedback on successful copy

#### 8. **Empty State**

- Beautiful illustration when no city is searched
- Friendly welcome message for first-time users
- Guides users to search or use location

### 🌈 Weather-Specific Backgrounds

#### Light Theme:

- ☀️ Clear: Bright mountain landscape
- ☁️ Cloudy: Slightly dimmed with contrast
- 🌧️ Rainy: Darker, desaturated tones
- ❄️ Snowy: Bright, low saturation
- ⛈️ Thunderstorm: Dark, high contrast
- 🌫️ Misty/Foggy: Blurred effect

#### Dark Theme:

- 🌙 All conditions with night sky background
- Automatic adjustments for each weather condition

### 📊 Weather Data Displayed

- Current temperature with "feels like"
- **7-day weather forecast** (properly displays all 7 days)
- **24-hour forecast** with horizontal scroll
- Hourly temperature, precipitation chance, and wind speed
- Humidity, wind speed & direction
- Atmospheric pressure
- Visibility range
- Sunrise & sunset times
- Air Quality Index (AQI) with pollutant breakdown
- Weather condition descriptions
- Real-time weather notifications

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Advanced styling with glassmorphism, animations, and responsive design
- **Vanilla JavaScript** - No frameworks, pure JS for better performance
- **OpenWeatherMap API** - Real-time weather data
- **Service Workers** - PWA offline functionality
- **Local Storage** - Persistent data storage
- **Geolocation API** - Current location weather

## 📱 Installation & Usage

### Online Use:

1. Open `index.html` in a modern web browser
2. Search for a city or use current location
3. Enjoy real-time weather updates!

### Install as PWA:

1. Visit the site on mobile or desktop
2. Look for the install prompt
3. Click "Install" to add to home screen
4. Use like a native app!

### Development Setup:

```bash
# No build process needed! Just serve the files
# Using Python's built-in server:
python -m http.server 8000

# Or using Node.js http-server:
npx http-server
```

## 🔑 API Key Setup

The app uses OpenWeatherMap API. To use your own API key:

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Replace the API key in `script.js`:
   ```javascript
   const API_KEY = "your_api_key_here";
   ```

## 🎯 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📂 File Structure

```
vayu-weather/
├── index.html          # Main HTML file
├── style.css           # Glassmorphism styles & animations
├── script.js           # Core functionality & API integration
├── manifest.json       # PWA manifest
├── sw.js              # Service worker for offline support
├── logo_of_vayu.png   # App logo/icon
├── bg.webp            # Light theme background
├── bg-night.avif      # Dark theme background
└── README.md          # This file
```

## 🌟 Key Features Breakdown

### Local Storage Usage:

- `vayuTheme` - User's theme preference (light/dark)
- `vayuLastCity` - Last searched city
- `vayuFavorites` - Array of favorite cities (max 5)
- `vayuRecentSearches` - Recent search history (max 7)
- `vayuPWADismissed` - PWA install prompt dismissed status
- `vayuNotificationsEnabled` - Weather notification preference

### Performance Optimizations:

- Debounced search (800ms delay)
- Cached API responses via service worker
- Lazy background image loading
- CSS animations with `prefers-reduced-motion` support
- Efficient DOM updates

## 🎨 Design Philosophy

- **Glassmorphism** - Modern frosted glass aesthetic
- **Minimalist** - Clean, uncluttered interface
- **Contextual** - Backgrounds match weather conditions
- **Accessible** - Keyboard navigation, focus states, ARIA labels
- **Responsive** - Mobile-first approach

## 🚀 Future Enhancement Ideas

- Hourly forecast graphs
- Weather alerts & notifications
- Multiple language support
- Weather radar maps
- Historical weather data
- Widget mode for embedding

## 👨‍💻 Developer

**Mayank Prashar**

## 📝 License

This project is open source and available for personal and educational use.

---

**Enjoy the weather! ⛅**
