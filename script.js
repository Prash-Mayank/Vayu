// API Configuration
const API_KEY = '933b4d1a405374b6b0e9092e2b62932e';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const themeToggle = document.getElementById('themeToggle');
const shareBtn = document.getElementById('shareBtn');
const notificationBtn = document.getElementById('notificationBtn');
const notificationBadge = document.getElementById('notificationBadge');
const loadingState = document.getElementById('loadingState');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const mainContent = document.getElementById('mainContent');
const emptyState = document.getElementById('emptyState');
const greetingSection = document.getElementById('greetingSection');
const greetingText = document.getElementById('greetingText');
const greetingSubtitle = document.getElementById('greetingSubtitle');
const quickAccess = document.getElementById('quickAccess');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesList = document.getElementById('favoritesList');
const recentSection = document.getElementById('recentSection');
const recentList = document.getElementById('recentList');
const favoriteToggle = document.getElementById('favoriteToggle');

// Weather Display Elements
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const windDirection = document.getElementById('windDirection');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastGrid = document.getElementById('forecastGrid');

// Hourly Forecast Elements
const hourlyForecastSection = document.getElementById('hourlyForecastSection');
const dailyForecastSection = document.getElementById('dailyForecastSection');
const hourlyForecastGrid = document.getElementById('hourlyForecastGrid');
const hourlyScrollContainer = document.getElementById('hourlyScrollContainer');
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');
const forecastToggle = document.getElementById('forecastToggle');
const forecastToggle2 = document.getElementById('forecastToggle2');
let currentForecastView = 'daily'; // 'hourly' or 'daily'
let currentForecastData = null;

// Air Quality Elements
const airQualitySection = document.getElementById('airQualitySection');
const aqiValue = document.getElementById('aqiValue');
const aqiLabel = document.getElementById('aqiLabel');
const aqiDescription = document.getElementById('aqiDescription');
const pm25 = document.getElementById('pm25');
const pm10 = document.getElementById('pm10');
const o3 = document.getElementById('o3');
const no2 = document.getElementById('no2');
const so2 = document.getElementById('so2');
const co = document.getElementById('co');

// PWA Elements
const pwaPrompt = document.getElementById('pwaPrompt');
const pwaInstallBtn = document.getElementById('pwaInstallBtn');
const pwaDismissBtn = document.getElementById('pwaDismissBtn');

// State
let currentTheme = 'light';
let searchTimeout = null;
let currentCity = '';
let currentWeatherData = null;
let deferredPrompt = null;

// Storage Keys
const STORAGE_KEYS = {
    THEME: 'vayuTheme',
    LAST_CITY: 'vayuLastCity',
    FAVORITES: 'vayuFavorites',
    RECENT: 'vayuRecentSearches',
    PWA_DISMISSED: 'vayuPWADismissed',
    NOTIFICATIONS_ENABLED: 'vayuNotificationsEnabled'
};

// Initialize App
function init() {
    // Check for saved theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    setTheme(savedTheme);
    
    // Set greeting
    updateGreeting();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    locationBtn.addEventListener('click', handleLocationRequest);
    themeToggle.addEventListener('click', toggleTheme);
    shareBtn.addEventListener('click', handleShare);
    notificationBtn?.addEventListener('click', toggleNotifications);
    favoriteToggle?.addEventListener('click', toggleFavorite);
    
    // Forecast toggle event listeners
    forecastToggle?.addEventListener('click', toggleForecastView);
    forecastToggle2?.addEventListener('click', toggleForecastView);
    
    // Scroll button event listeners
    scrollLeftBtn?.addEventListener('click', () => scrollHourlyForecast('left'));
    scrollRightBtn?.addEventListener('click', () => scrollHourlyForecast('right'));
    
    // Update scroll button states on scroll
    hourlyScrollContainer?.addEventListener('scroll', updateScrollButtonStates);
    
    // Load quick access data
    loadQuickAccessData();
    
    // Check for last searched city
    const lastCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    if (lastCity) {
        cityInput.value = lastCity;
        fetchWeatherByCity(lastCity);
    } else {
        showEmptyState();
    }
    
    // PWA Install Prompt
    setupPWA();
}

// Setup PWA
function setupPWA() {
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEYS.PWA_DISMISSED);
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt if not dismissed and not standalone
        if (!dismissed && !window.matchMedia('(display-mode: standalone)').matches) {
            setTimeout(() => {
                pwaPrompt.style.display = 'block';
            }, 5000); // Show after 5 seconds
        }
    });
    
    pwaInstallBtn?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('PWA installed');
        }
        
        deferredPrompt = null;
        pwaPrompt.style.display = 'none';
    });
    
    pwaDismissBtn?.addEventListener('click', () => {
        pwaPrompt.style.display = 'none';
        localStorage.setItem(STORAGE_KEYS.PWA_DISMISSED, 'true');
    });
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
}

// Theme Management
function setTheme(theme) {
    currentTheme = theme;
    document.body.className = `${theme}-theme`;
    
    if (currentWeatherData) {
        updateWeatherBackground(currentWeatherData.weather[0].main);
    }
    
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Greeting Management
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting, subtitle;
    
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
        subtitle = 'Start your day with the latest weather';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
        subtitle = 'Check the weather for your plans';
    } else if (hour >= 17 && hour < 22) {
        greeting = 'Good Evening';
        subtitle = 'Plan your evening with weather updates';
    } else {
        greeting = 'Good Night';
        subtitle = 'Check tomorrow\'s forecast';
    }
    
    greetingText.textContent = greeting;
    greetingSubtitle.textContent = subtitle;
}

// Quick Access Data Management
function loadQuickAccessData() {
    loadFavorites();
    loadRecentSearches();
}

function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    
    if (favorites.length > 0) {
        favoritesSection.style.display = 'block';
        quickAccess.style.display = 'block';
        favoritesList.innerHTML = '';
        
        favorites.forEach(city => {
            const chip = document.createElement('button');
            chip.className = 'quick-access-chip';
            chip.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                ${city}
            `;
            chip.addEventListener('click', () => {
                cityInput.value = city;
                fetchWeatherByCity(city);
            });
            favoritesList.appendChild(chip);
        });
    } else {
        favoritesSection.style.display = 'none';
        checkQuickAccessVisibility();
    }
}

function loadRecentSearches() {
    const recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT) || '[]');
    
    if (recent.length > 0) {
        recentSection.style.display = 'block';
        quickAccess.style.display = 'block';
        recentList.innerHTML = '';
        
        recent.forEach(city => {
            const chip = document.createElement('button');
            chip.className = 'quick-access-chip';
            chip.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${city}
            `;
            chip.addEventListener('click', () => {
                cityInput.value = city;
                fetchWeatherByCity(city);
            });
            recentList.appendChild(chip);
        });
    } else {
        recentSection.style.display = 'none';
        checkQuickAccessVisibility();
    }
}

function checkQuickAccessVisibility() {
    const hasFavorites = favoritesSection.style.display !== 'none';
    const hasRecent = recentSection.style.display !== 'none';
    
    if (!hasFavorites && !hasRecent) {
        quickAccess.style.display = 'none';
    }
}

function addToRecentSearches(city) {
    let recent = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT) || '[]');
    
    // Remove if already exists
    recent = recent.filter(c => c.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    recent.unshift(city);
    
    // Keep only last 7
    recent = recent.slice(0, 7);
    
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent));
    loadRecentSearches();
}

// Favorite Management
function isFavorite(city) {
    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    return favorites.some(c => c.toLowerCase() === city.toLowerCase());
}

function toggleFavorite() {
    if (!currentCity) return;
    
    let favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
    const cityLower = currentCity.toLowerCase();
    const index = favorites.findIndex(c => c.toLowerCase() === cityLower);
    
    if (index > -1) {
        // Remove from favorites
        favorites.splice(index, 1);
    } else {
        // Add to favorites (max 5)
        if (favorites.length >= 5) {
            showError('Maximum 5 favorite locations allowed');
            return;
        }
        favorites.push(currentCity);
    }
    
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    updateFavoriteToggle();
    loadFavorites();
}

function updateFavoriteToggle() {
    if (!favoriteToggle || !currentCity) return;
    
    const isFav = isFavorite(currentCity);
    
    if (isFav) {
        favoriteToggle.classList.add('active');
        favoriteToggle.setAttribute('aria-label', 'Remove from favorites');
    } else {
        favoriteToggle.classList.remove('active');
        favoriteToggle.setAttribute('aria-label', 'Add to favorites');
    }
}

// Weather Icon Mapping
function getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

// Date Formatting
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function formatForecastDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

// Wind Direction
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// AQI Information
function getAQIInfo(aqi) {
    const info = {
        1: { label: 'Good', description: 'Air quality is satisfactory, and air pollution poses little or no risk.', color: '#50C878' },
        2: { label: 'Fair', description: 'Air quality is acceptable. However, there may be a risk for some people.', color: '#FFD700' },
        3: { label: 'Moderate', description: 'Members of sensitive groups may experience health effects.', color: '#FFA500' },
        4: { label: 'Poor', description: 'Everyone may begin to experience health effects.', color: '#FF6347' },
        5: { label: 'Very Poor', description: 'Health alert: everyone may experience serious health effects.', color: '#DC143C' }
    };
    return info[aqi] || info[1];
}

// Fetch Air Quality
async function fetchAirQuality(lat, lon) {
    try {
        const url = `${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Air quality fetch error:', error);
        return null;
    }
}

// Update Air Quality Display
function updateAirQuality(data) {
    if (!data || !data.list || data.list.length === 0) {
        airQualitySection.style.display = 'none';
        return;
    }
    
    const aqi = data.list[0].main.aqi;
    const components = data.list[0].components;
    const aqiInfo = getAQIInfo(aqi);
    
    airQualitySection.style.display = 'block';
    aqiValue.textContent = aqi;
    aqiLabel.textContent = aqiInfo.label;
    aqiLabel.style.color = aqiInfo.color;
    aqiDescription.textContent = aqiInfo.description;
    
    pm25.textContent = components.pm2_5.toFixed(1);
    pm10.textContent = components.pm10.toFixed(1);
    o3.textContent = components.o3.toFixed(1);
    no2.textContent = components.no2.toFixed(1);
    so2.textContent = components.so2.toFixed(1);
    co.textContent = (components.co / 1000).toFixed(2);
}

// UI State Management
function showLoading() {
    loadingState.classList.add('active');
    errorMessage.classList.remove('active');
    mainContent.classList.remove('active');
    emptyState.classList.remove('active');
    shareBtn.style.display = 'none';
}

function hideLoading() {
    loadingState.classList.remove('active');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('active');
    hideLoading();
    mainContent.classList.remove('active');
    emptyState.classList.remove('active');
    shareBtn.style.display = 'none';
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

function showContent() {
    mainContent.classList.add('active');
    errorMessage.classList.remove('active');
    emptyState.classList.remove('active');
    hideLoading();
    shareBtn.style.display = 'flex';
}

function showEmptyState() {
    emptyState.classList.add('active');
    mainContent.classList.remove('active');
    errorMessage.classList.remove('active');
    hideLoading();
    shareBtn.style.display = 'none';
}

// Search Handler
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
}

// Location Handler
function handleLocationRequest() {
    if ('geolocation' in navigator) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                showError('Unable to access your location. Please enable location services or search for a city.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

// Share Handler
async function handleShare() {
    if (!currentWeatherData) return;
    
    const shareData = {
        title: 'Vayu Weather',
        text: `${currentCity}: ${Math.round(currentWeatherData.main.temp)}°C, ${currentWeatherData.weather[0].description}`,
        url: window.location.href
    };
    
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
            // Show temporary feedback
            const originalHTML = shareBtn.innerHTML;
            shareBtn.innerHTML = '<span style="font-size: 0.8rem;">✓ Copied!</span>';
            setTimeout(() => {
                shareBtn.innerHTML = originalHTML;
            }, 2000);
        }
    } catch (error) {
        console.log('Share failed:', error);
    }
}

// Fetch Weather by City
async function fetchWeatherByCity(city) {
    try {
        showLoading();
        
        // Fetch current weather
        const currentWeatherUrl = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            if (currentResponse.status === 404) {
                throw new Error('City not found. Please check the spelling and try again.');
            } else if (currentResponse.status === 401) {
                throw new Error('API key error. Please check your configuration.');
            } else if (currentResponse.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            } else {
                throw new Error('Unable to fetch weather data. Please try again later.');
            }
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastUrl = `${API_BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (!forecastResponse.ok) {
            throw new Error('Unable to fetch forecast data');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Fetch air quality data
        const { coord } = currentData;
        const aqiData = await fetchAirQuality(coord.lat, coord.lon);
        
        // Save to recent searches
        addToRecentSearches(currentData.name);
        
        // Save last searched city
        localStorage.setItem(STORAGE_KEYS.LAST_CITY, currentData.name);
        
        // Update current city
        currentCity = currentData.name;
        currentWeatherData = currentData;
        
        // Update UI
        updateWeatherDisplay(currentData, forecastData);
        if (aqiData) {
            updateAirQuality(aqiData);
        }
        updateFavoriteToggle();
        showContent();
        
        // Send notifications for weather updates and severe weather
        sendWeatherUpdateNotification(currentData);
        checkForSevereWeather(currentData);
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        showError(error.message);
    }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoordinates(lat, lon) {
    try {
        // Fetch current weather
        const currentWeatherUrl = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
            throw new Error('Unable to fetch weather data for your location');
        }
        
        const currentData = await currentResponse.json();
        
        // Fetch forecast
        const forecastUrl = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const forecastResponse = await fetch(forecastUrl);
        
        if (!forecastResponse.ok) {
            throw new Error('Unable to fetch forecast data');
        }
        
        const forecastData = await forecastResponse.json();
        
        // Fetch air quality data
        const aqiData = await fetchAirQuality(lat, lon);
        
        // Update city input with found location
        cityInput.value = currentData.name;
        
        // Save to recent searches
        addToRecentSearches(currentData.name);
        
        // Save location
        localStorage.setItem(STORAGE_KEYS.LAST_CITY, currentData.name);
        
        // Update current city
        currentCity = currentData.name;
        currentWeatherData = currentData;
        
        // Update UI
        updateWeatherDisplay(currentData, forecastData);
        if (aqiData) {
            updateAirQuality(aqiData);
        }
        updateFavoriteToggle();
        showContent();
        
        // Send notifications for weather updates and severe weather
        sendWeatherUpdateNotification(currentData);
        checkForSevereWeather(currentData);
        
    } catch (error) {
        console.error('Weather fetch error:', error);
        showError(error.message);
    }
}

// Update Weather Display
function updateWeatherDisplay(current, forecast) {
    // Update current weather
    cityName.textContent = current.name;
    currentDate.textContent = formatDate(current.dt);
    temperature.textContent = `${Math.round(current.main.temp)}°`;
    weatherIcon.src = getWeatherIcon(current.weather[0].icon);
    weatherIcon.alt = current.weather[0].description;
    weatherDescription.textContent = current.weather[0].description.charAt(0).toUpperCase() + 
                                      current.weather[0].description.slice(1);
    
    // Update metrics
    feelsLike.textContent = `${Math.round(current.main.feels_like)}°C`;
    humidity.textContent = `${current.main.humidity}%`;
    windSpeed.textContent = `${current.wind.speed} m/s`;
    windDirection.textContent = getWindDirection(current.wind.deg);
    pressure.textContent = `${current.main.pressure} hPa`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    sunrise.textContent = formatTime(current.sys.sunrise);
    sunset.textContent = formatTime(current.sys.sunset);
    
    // Store forecast data for toggle functionality
    currentForecastData = forecast;
    updateForecast(forecast);
    
    // Update background based on weather condition
    updateWeatherBackground(current.weather[0].main);
}

// Update Weather Background
function updateWeatherBackground(condition) {
    const body = document.body;
    body.classList.remove('weather-clear', 'weather-clouds', 'weather-rain', 'weather-snow', 'weather-thunderstorm', 'weather-mist', 'weather-fog');
    
    switch(condition.toLowerCase()) {
        case 'clear':
            body.classList.add('weather-clear');
            break;
        case 'clouds':
            body.classList.add('weather-clouds');
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('weather-rain');
            break;
        case 'snow':
            body.classList.add('weather-snow');
            break;
        case 'thunderstorm':
            body.classList.add('weather-thunderstorm');
            break;
        case 'mist':
        case 'fog':
        case 'haze':
            body.classList.add('weather-mist');
            break;
    }
}

// Update Forecast Display - Shows all available forecast days
function updateForecast(forecastData) {
    forecastGrid.innerHTML = '';
    
    // Group forecasts by date and calculate min/max for each day
    const dailyData = {};
    
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyData[dateKey]) {
            dailyData[dateKey] = {
                date: item.dt,
                temps: [],
                icons: [],
                descriptions: []
            };
        }
        
        dailyData[dateKey].temps.push(item.main.temp);
        dailyData[dateKey].icons.push(item.weather[0].icon);
        dailyData[dateKey].descriptions.push(item.weather[0].description);
    });
    
    // Convert to array - OpenWeatherMap free API provides ~5 days of data
    const allDays = Object.values(dailyData);
    
    // Skip the first day if it has less than 3 data points (partial day)
    const startIndex = allDays[0]?.temps.length < 3 ? 1 : 0;
    
    // Get all available forecast days (typically 5-6 days)
    const dailyForecasts = allDays.slice(startIndex);
    
    console.log(`Displaying ${dailyForecasts.length} days of forecast data`);
    
    // Create forecast cards for all available days
    dailyForecasts.forEach((day, index) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        const date = formatForecastDate(day.date);
        const maxTemp = Math.round(Math.max(...day.temps));
        const minTemp = Math.round(Math.min(...day.temps));
        
        // Use the most common icon for the day (typically midday)
        const midIndex = Math.floor(day.icons.length / 2);
        const iconCode = day.icons[midIndex];
        
        card.innerHTML = `
            <div class="forecast-date">${date}</div>
            <div class="forecast-icon-container">
                <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" 
                     alt="${day.descriptions[midIndex]}" 
                     class="forecast-icon">
            </div>
            <div class="forecast-temp">
                <span class="temp-max">${maxTemp}°</span>
                <span class="temp-min">${minTemp}°</span>
            </div>
        `;
        
        forecastGrid.appendChild(card);
    });
}

// Toggle between hourly and daily forecast views
function toggleForecastView() {
    if (!currentForecastData) return;
    
    currentForecastView = currentForecastView === 'daily' ? 'hourly' : 'daily';
    
    if (currentForecastView === 'hourly') {
        hourlyForecastSection.style.display = 'block';
        dailyForecastSection.style.display = 'none';
        updateHourlyForecast(currentForecastData);
    } else {
        hourlyForecastSection.style.display = 'none';
        dailyForecastSection.style.display = 'block';
    }
    
    // Update toggle button states
    updateToggleButtons();
}

// Update toggle button active states
function updateToggleButtons() {
    const allLabels = document.querySelectorAll('.toggle-label');
    allLabels.forEach(label => {
        if (label.dataset.view === currentForecastView) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });
}

// Format hour for hourly forecast
function formatHour(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    
    // Check if it's today
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        const hour = date.getHours();
        if (hour === now.getHours()) {
            return 'Now';
        }
    }
    
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        hour12: true 
    });
}

// Get day label for hourly forecast
function getDayLabel(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

// Update Hourly Forecast Display
function updateHourlyForecast(forecastData) {
    hourlyForecastGrid.innerHTML = '';
    
    // OpenWeatherMap provides data every 3 hours
    // We'll interpolate to create 2-hour intervals for next 24 hours (12 data points)
    const apiData = forecastData.list.slice(0, 9); // Get 9 points (27 hours of data)
    const interpolatedData = [];
    
    // Create interpolated data points every 2 hours
    for (let i = 0; i < apiData.length - 1; i++) {
        const current = apiData[i];
        const next = apiData[i + 1];
        
        // Add current point
        interpolatedData.push(current);
        
        // Calculate time difference (should be 3 hours = 10800 seconds)
        const timeDiff = next.dt - current.dt;
        const twoHourMark = current.dt + (timeDiff * 2 / 3); // 2 hours after current
        
        // Create interpolated point at 2-hour mark
        const interpolated = {
            dt: twoHourMark,
            main: {
                temp: (current.main.temp * 1 + next.main.temp * 2) / 3, // Weighted average
                feels_like: (current.main.feels_like * 1 + next.main.feels_like * 2) / 3,
                humidity: Math.round((current.main.humidity + next.main.humidity) / 2)
            },
            weather: [current.weather[0]], // Use current weather icon
            wind: {
                speed: (current.wind.speed + next.wind.speed) / 2
            },
            pop: (current.pop + next.pop) / 2 // Probability of precipitation
        };
        
        interpolatedData.push(interpolated);
    }
    
    // Get first 12 points (24 hours at 2-hour intervals)
    const hourlyData = interpolatedData.slice(0, 12);
    
    let currentDay = null;
    
    hourlyData.forEach((item, index) => {
        const dayLabel = getDayLabel(item.dt);
        
        // Add day divider if day changes
        if (dayLabel !== currentDay) {
            const divider = document.createElement('div');
            divider.className = 'hourly-day-divider';
            divider.innerHTML = `<span class="day-label">${dayLabel}</span>`;
            hourlyForecastGrid.appendChild(divider);
            currentDay = dayLabel;
        }
        
        const card = document.createElement('div');
        card.className = 'hourly-forecast-card';
        
        const time = formatHour(item.dt);
        const temp = Math.round(item.main.temp);
        const iconCode = item.weather[0].icon;
        const description = item.weather[0].description;
        const feelsLike = Math.round(item.main.feels_like);
        const humidity = item.main.humidity;
        const windSpeed = item.wind.speed.toFixed(1);
        const pop = Math.round(item.pop * 100); // Probability of precipitation
        
        card.innerHTML = `
            <div class="hourly-time">${time}</div>
            <div class="hourly-icon-container">
                <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" 
                     alt="${description}" 
                     class="hourly-icon">
            </div>
            <div class="hourly-temp">${temp}°</div>
            <div class="hourly-details">
                <div class="hourly-detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                    </svg>
                    <span>${pop}%</span>
                </div>
                <div class="hourly-detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
                    </svg>
                    <span>${windSpeed} m/s</span>
                </div>
            </div>
        `;
        
        hourlyForecastGrid.appendChild(card);
    });
    
    // Update scroll button states after rendering
    setTimeout(() => {
        updateScrollButtonStates();
    }, 100);
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Handle online/offline events
window.addEventListener('online', () => {
    const lastCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
    if (lastCity) {
        fetchWeatherByCity(lastCity);
    }
});

window.addEventListener('offline', () => {
    showError('You are currently offline. Please check your internet connection.');
});

// Notification Functions
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }
    
    // Check if already granted
    if (Notification.permission === 'granted') {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
        updateNotificationButtonState();
        return;
    }
    
    // Don't ask immediately, wait for user interaction
    if (Notification.permission === 'default') {
        // Wait for first weather fetch before asking
        setTimeout(() => {
            if (localStorage.getItem(STORAGE_KEYS.LAST_CITY)) {
                // Just update button state, don't auto-ask
                updateNotificationButtonState();
            }
        }, 2000);
    }
    
    updateNotificationButtonState();
}

function updateNotificationButtonState() {
    if (!notificationBtn) return;
    
    const isEnabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) === 'true';
    
    if (isEnabled && Notification.permission === 'granted') {
        notificationBtn.classList.add('active');
        notificationBtn.setAttribute('title', 'Notifications Enabled - Click to disable');
    } else {
        notificationBtn.classList.remove('active');
        notificationBtn.setAttribute('title', 'Enable Notifications');
    }
}

async function toggleNotifications() {
    if (!('Notification' in window)) {
        showError('Notifications are not supported in this browser');
        return;
    }
    
    const isEnabled = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) === 'true';
    
    if (isEnabled) {
        // Disable notifications
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
        updateNotificationButtonState();
        showNotificationMessage('Notifications disabled', false);
    } else {
        // Request permission and enable
        if (Notification.permission === 'granted') {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
            updateNotificationButtonState();
            showNotification('Notifications Enabled! 🔔', 'You will now receive weather alerts and updates');
        } else if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
                updateNotificationButtonState();
                showNotification('Notifications Enabled! 🔔', 'You will now receive weather alerts and updates');
            } else {
                showError('Notification permission denied. Please enable in browser settings.');
            }
        } else {
            showError('Notification permission denied. Please enable in browser settings.');
        }
    }
}

function showNotificationMessage(message, isEnabled) {
    // Create a temporary message element
    const msg = document.createElement('div');
    msg.className = 'notification-toast';
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${isEnabled ? 'linear-gradient(135deg, var(--accent-turquoise), var(--accent-navy))' : '#666'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

function showNotification(title, body, options = {}) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        const defaultOptions = {
            icon: 'logo_of_vayu.png',
            badge: 'logo_of_vayu.png',
            vibrate: [200, 100, 200],
            ...options
        };
        
        try {
            const notification = new Notification(title, {
                body: body,
                ...defaultOptions
            });
            
            notification.onclick = function() {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }
}

// Send weather update notification when weather is fetched
function sendWeatherUpdateNotification(weatherData) {
    if (localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'true') return;
    
    const temp = Math.round(weatherData.main.temp);
    const condition = weatherData.weather[0].description;
    const city = weatherData.name;
    
    showNotification(
        `Weather Update: ${city}`,
        `${temp}°C - ${condition.charAt(0).toUpperCase() + condition.slice(1)}`,
        {
            tag: 'weather-update',
            renotify: false
        }
    );
}

// Send severe weather alerts
function checkForSevereWeather(weatherData) {
    if (localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) !== 'true') return;
    
    const condition = weatherData.weather[0].main.toLowerCase();
    const temp = weatherData.main.temp;
    const city = weatherData.name;
    
    // Alert for extreme temperatures
    if (temp > 40) {
        showNotification(
            `⚠️ Extreme Heat Alert - ${city}`,
            `Temperature is ${Math.round(temp)}°C. Stay hydrated and avoid direct sunlight!`,
            { tag: 'severe-weather', requireInteraction: true }
        );
    } else if (temp < 0) {
        showNotification(
            `❄️ Freezing Temperature Alert - ${city}`,
            `Temperature is ${Math.round(temp)}°C. Bundle up and stay warm!`,
            { tag: 'severe-weather', requireInteraction: true }
        );
    }
    
    // Alert for severe weather conditions
    if (condition === 'thunderstorm') {
        showNotification(
            `⛈️ Thunderstorm Alert - ${city}`,
            'Thunderstorm detected. Stay indoors and avoid outdoor activities!',
            { tag: 'severe-weather', requireInteraction: true }
        );
    } else if (condition === 'snow') {
        showNotification(
            `🌨️ Snow Alert - ${city}`,
            'Snowy conditions detected. Drive carefully and dress warmly!',
            { tag: 'severe-weather' }
        );
    }
}

// Hourly Forecast Scroll Functions
function scrollHourlyForecast(direction) {
    console.log('scrollHourlyForecast called with direction:', direction);
    console.log('hourlyScrollContainer:', hourlyScrollContainer);
    
    if (!hourlyScrollContainer) {
        console.error('hourlyScrollContainer is null');
        return;
    }
    
    const scrollAmount = 300; // Scroll by 300px
    const currentScroll = hourlyScrollContainer.scrollLeft;
    
    console.log('Current scroll position:', currentScroll);
    console.log('Scroll width:', hourlyScrollContainer.scrollWidth);
    console.log('Client width:', hourlyScrollContainer.clientWidth);
    
    if (direction === 'left') {
        hourlyScrollContainer.scrollLeft = currentScroll - scrollAmount;
        console.log('Scrolling left to:', currentScroll - scrollAmount);
    } else {
        hourlyScrollContainer.scrollLeft = currentScroll + scrollAmount;
        console.log('Scrolling right to:', currentScroll + scrollAmount);
    }
    
    // Update button states after scroll
    setTimeout(() => {
        updateScrollButtonStates();
    }, 100);
}

function updateScrollButtonStates() {
    if (!hourlyScrollContainer || !scrollLeftBtn || !scrollRightBtn) {
        console.log('Missing elements for scroll buttons:', {
            container: !!hourlyScrollContainer,
            leftBtn: !!scrollLeftBtn,
            rightBtn: !!scrollRightBtn
        });
        return;
    }
    
    const scrollLeft = hourlyScrollContainer.scrollLeft;
    const maxScroll = hourlyScrollContainer.scrollWidth - hourlyScrollContainer.clientWidth;
    
    console.log('Updating button states - scrollLeft:', scrollLeft, 'maxScroll:', maxScroll);
    
    // Disable left button at start
    if (scrollLeft <= 10) {
        scrollLeftBtn.disabled = true;
        scrollLeftBtn.style.opacity = '0.3';
    } else {
        scrollLeftBtn.disabled = false;
        scrollLeftBtn.style.opacity = '1';
    }
    
    // Disable right button at end
    if (scrollLeft >= maxScroll - 10) {
        scrollRightBtn.disabled = true;
        scrollRightBtn.style.opacity = '0.3';
    } else {
        scrollRightBtn.disabled = false;
        scrollRightBtn.style.opacity = '1';
    }
}