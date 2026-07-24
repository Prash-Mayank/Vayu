if (!window.VAYU_CONFIG) {
  console.warn(
    '[Vayu] config.js not found or loaded after script.js. ' +
    'Copy config.example.js to config.js and add your API keys. ' +
    'The app will still run on the no-key fallbacks (Open-Meteo).'
  );
}
const CONFIG = window.VAYU_CONFIG || { OWM_KEY: '', IQAIR_KEY: '', UNSPLASH_KEY: '' };

const ENDPOINTS = {
  GEOCODE: 'https://geocoding-api.open-meteo.com/v1/search',
  OWM_CURRENT: 'https://api.openweathermap.org/data/2.5/weather',
  OWM_FORECAST: 'https://api.openweathermap.org/data/2.5/forecast',
  OPEN_METEO: 'https://api.open-meteo.com/v1/forecast',
  IQAIR: 'https://api.airvisual.com/v2/nearest_city',
  OPEN_METEO_AQI: 'https://air-quality-api.open-meteo.com/v1/air-quality',
  SUNRISE_SUNSET: 'https://api.sunrise-sunset.org/json',
  UNSPLASH_SEARCH: 'https://api.unsplash.com/search/photos',
  BIGDATACLOUD_REVERSE: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
  EONET: 'https://eonet.gsfc.nasa.gov/api/v3/events',
};

const LIMITS = {
  MAX_FAVORITES: 5,
  MAX_RECENT: 7,
  SEARCH_DEBOUNCE_MS: 800,
  PHOTO_CACHE_MS: 24 * 60 * 60 * 1000,
  ALERT_RADIUS_KM: 500,
  EVENT_RADIUS_KM: 1500,
  EVENT_LIMIT: 12,
};

const state = {
  city: 'New Delhi',
  country: 'IN',
  lat: 28.6139,
  lon: 77.2090,
  unit: localStorage.getItem('vayuUnit') || 'C',
  theme: localStorage.getItem('vayuTheme') || 'dark',
  weather: null,    
  aqi: null,
  astro: null,
  events: [],
  compareA: null,
  compareB: null,
};

const $ = (id) => document.getElementById(id);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const WMO = {
  0:['fa-sun','Clear sky'], 1:['fa-cloud-sun','Mainly clear'], 2:['fa-cloud-sun','Partly cloudy'], 3:['fa-cloud','Overcast'],
  45:['fa-smog','Fog'], 48:['fa-smog','Depositing rime fog'],
  51:['fa-cloud-rain','Light drizzle'], 53:['fa-cloud-rain','Drizzle'], 55:['fa-cloud-rain','Dense drizzle'],
  56:['fa-cloud-rain','Freezing drizzle'], 57:['fa-cloud-rain','Dense freezing drizzle'],
  61:['fa-cloud-showers-heavy','Slight rain'], 63:['fa-cloud-showers-heavy','Rain'], 65:['fa-cloud-showers-heavy','Heavy rain'],
  66:['fa-cloud-showers-heavy','Freezing rain'], 67:['fa-cloud-showers-heavy','Heavy freezing rain'],
  71:['fa-snowflake','Slight snow'], 73:['fa-snowflake','Snow'], 75:['fa-snowflake','Heavy snow'], 77:['fa-snowflake','Snow grains'],
  80:['fa-cloud-rain','Rain showers'], 81:['fa-cloud-rain','Rain showers'], 82:['fa-cloud-showers-heavy','Violent showers'],
  85:['fa-snowflake','Snow showers'], 86:['fa-snowflake','Heavy snow showers'],
  95:['fa-bolt','Thunderstorm'], 96:['fa-bolt','Thunderstorm + hail'], 99:['fa-bolt','Severe thunderstorm'],
};
function wmoIcon(code){ return (WMO[code] || ['fa-cloud','—'])[0]; }
function wmoLabel(code){ return (WMO[code] || ['fa-cloud','—'])[1]; }
function nightIcon(icon){
  const map = { 'fa-sun':'fa-moon', 'fa-cloud-sun':'fa-cloud-moon' };
  return map[icon] || icon;
}
async function fetchJSON(url, opts){
  const res = await fetch(url, opts);
  if(!res.ok) throw new Error('HTTP ' + res.status + ' on ' + url);
  return res.json();
}
async function geocodeCity(name){
  const url = `${ENDPOINTS.GEOCODE}?name=${encodeURIComponent(name)}&count=6&language=en&format=json`;
  const data = await fetchJSON(url);
  return (data.results || []).map(r => ({
    name: r.name, country: r.country_code, admin1: r.admin1,
    lat: r.latitude, lon: r.longitude,
  }));
}
async function fetchOWM(lat, lon){
  if(!CONFIG.OWM_KEY) throw new Error('No OWM key configured');
  const cur = await fetchJSON(`${ENDPOINTS.OWM_CURRENT}?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.OWM_KEY}`);
  const fc = await fetchJSON(`${ENDPOINTS.OWM_FORECAST}?lat=${lat}&lon=${lon}&units=metric&appid=${CONFIG.OWM_KEY}`);
  return { source:'owm', current: cur, forecast: fc };
}
async function fetchOpenMeteo(lat, lon){
  const url = `${ENDPOINTS.OPEN_METEO}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility` +
    `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=8`;
  const data = await fetchJSON(url);
  return { source:'open-meteo', data };
}
async function fetchIQAir(lat, lon){
  if(!CONFIG.IQAIR_KEY) throw new Error('No IQAir key configured');
  return fetchJSON(`${ENDPOINTS.IQAIR}?lat=${lat}&lon=${lon}&key=${CONFIG.IQAIR_KEY}`);
}
async function fetchOpenMeteoAQI(lat, lon){
  const url = `${ENDPOINTS.OPEN_METEO_AQI}?latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide`;
  return fetchJSON(url);
}
async function fetchSunriseSunset(lat, lon){
  const url = `${ENDPOINTS.SUNRISE_SUNSET}?lat=${lat}&lng=${lon}&formatted=0`;
  const data = await fetchJSON(url);
  return data.results;
}
async function fetchUnsplash(city, condition, country){
  if(!CONFIG.UNSPLASH_KEY) throw new Error('No Unsplash key configured');
  const cacheKey = `vayuPhoto:${city.toLowerCase()}:${(country || '').toLowerCase()}`;
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  if(cached && Date.now() - cached.ts < LIMITS.PHOTO_CACHE_MS) return cached;

  const queries = [
    `${city} ${condition} skyline`,
    `${city} skyline`,
    `${city} city`,
    country ? `${country} city` : null,
  ].filter(Boolean);

  let photo = null;
  let lastErr = null;
  for(const q of queries){
    try{
      const url = `${ENDPOINTS.UNSPLASH_SEARCH}?query=${encodeURIComponent(q)}&per_page=1&orientation=landscape&client_id=${CONFIG.UNSPLASH_KEY}`;
      const res = await fetch(url);
      if(res.status === 401){
        lastErr = new Error('Unsplash 401 Unauthorized — check UNSPLASH_KEY in config.js');
        console.error(`[Vayu/Unsplash] "${city}":`, lastErr.message);
        break;
      }
      if(res.status === 403){
        lastErr = new Error('Unsplash 403 — likely the 50 req/hour free-tier rate limit. Wait an hour or cache more aggressively.');
        console.error(`[Vayu/Unsplash] "${city}":`, lastErr.message);
        break;
      }
      if(!res.ok){
        lastErr = new Error(`Unsplash HTTP ${res.status} for query "${q}"`);
        console.warn(`[Vayu/Unsplash] "${city}":`, lastErr.message);
        continue;
      }
      const data = await res.json();
      photo = data.results && data.results[0];
      if(photo){ 
        break; }
      console.warn(`[Vayu/Unsplash] "${city}": no results for query "${q}", trying next fallback…`);
    }catch(e){
      lastErr = e;
      console.warn(`[Vayu/Unsplash] "${city}": network error on query "${q}"`, e);
    }
  }
  if(!photo){
    throw lastErr || new Error(`No Unsplash result for "${city}" across all fallback queries`);
  }

  const result = {
    ts: Date.now(),
    url: photo.urls.regular,
    photographer: photo.user.name,
    link: photo.user.links.html,
  };
  localStorage.setItem(cacheKey, JSON.stringify(result));
  localStorage.setItem('vayuUnsplashCredit', JSON.stringify(result));
  return result;
}
async function fetchEonet(){
  const cached = sessionStorage.getItem('vayuEonet');
  if(cached) return JSON.parse(cached);
  const data = await fetchJSON(`${ENDPOINTS.EONET}?status=open&limit=60`);
  sessionStorage.setItem('vayuEonet', JSON.stringify(data.events || []));
  return data.events || [];
}

function haversine(lat1, lon1, lat2, lon2){
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function normalizeWeather(owmResult, omResult){
  if(owmResult && owmResult.status === 'fulfilled'){
    const { current, forecast } = owmResult.value;
    const dailyMap = {};
    forecast.list.forEach(item => {
      const day = item.dt_txt.split(' ')[0];
      if(!dailyMap[day]) dailyMap[day] = { temps:[], pops:[], icons:[] };
      dailyMap[day].temps.push(item.main.temp);
      dailyMap[day].pops.push(item.pop || 0);
      dailyMap[day].icons.push(item.weather[0].id);
    });
    const daily = Object.entries(dailyMap).slice(0,7).map(([date, v]) => ({
      date, hi: Math.max(...v.temps), lo: Math.min(...v.temps),
      pop: Math.round(Math.max(...v.pops) * 100),
      icon: owmCodeToIcon(v.icons[Math.floor(v.icons.length/2)]),
    }));
    const hourly = forecast.list.slice(0,8).map(item => ({
      time: item.dt_txt, temp: item.main.temp, pop: Math.round((item.pop||0)*100),
      icon: owmCodeToIcon(item.weather[0].id), wind: item.wind.speed,
    }));
    return {
      source:'OpenWeatherMap + Open-Meteo (backup)',
      current:{
        temp: current.main.temp, feels: current.main.feels_like,
        hi: current.main.temp_max, lo: current.main.temp_min,
        humidity: current.main.humidity, wind: Math.round(current.wind.speed*3.6),
        pressure: current.main.pressure, visibility: Math.round((current.visibility||10000)/1000),
        condition: current.weather[0].description, icon: owmCodeToIcon(current.weather[0].id),
      },
      hourly, daily,
    };
  }
  if(omResult && omResult.status === 'fulfilled'){
    const d = omResult.value.data;
    const hourly = d.hourly.time.slice(0,8).map((t,i) => ({
      time:t, temp:d.hourly.temperature_2m[i], pop:d.hourly.precipitation_probability[i],
      icon: wmoIcon(d.hourly.weather_code[i]), wind: d.hourly.wind_speed_10m[i],
    }));
    const daily = d.daily.time.slice(0,7).map((date,i) => ({
      date, hi:d.daily.temperature_2m_max[i], lo:d.daily.temperature_2m_min[i],
      pop: d.daily.precipitation_probability_max[i] || 0,
      icon: wmoIcon(d.daily.weather_code[i]),
    }));
    return {
      source:'Open-Meteo (fallback — add an OpenWeatherMap key for primary source)',
      current:{
        temp:d.current.temperature_2m, feels:d.current.apparent_temperature,
        hi: daily[0]?.hi ?? d.current.temperature_2m, lo: daily[0]?.lo ?? d.current.temperature_2m,
        humidity:d.current.relative_humidity_2m, wind: Math.round(d.current.wind_speed_10m),
        pressure: Math.round(d.current.surface_pressure), visibility: Math.round((d.current.visibility||10000)/1000),
        condition: wmoLabel(d.current.weather_code), icon: wmoIcon(d.current.weather_code),
      },
      hourly, daily, uv: d.daily.uv_index_max ? d.daily.uv_index_max[0] : null,
    };
  }
  throw new Error('Both weather sources failed');
}

function owmCodeToIcon(id){
  if(id >= 200 && id < 300) return 'fa-bolt';
  if(id >= 300 && id < 400) return 'fa-cloud-rain';
  if(id >= 500 && id < 600) return 'fa-cloud-showers-heavy';
  if(id >= 600 && id < 700) return 'fa-snowflake';
  if(id >= 700 && id < 800) return 'fa-smog';
  if(id === 800) return 'fa-sun';
  if(id === 801 || id === 802) return 'fa-cloud-sun';
  return 'fa-cloud';
}
function fmtTemp(c){
  if(c === null || c === undefined || isNaN(c)) return '--°';
  const v = state.unit === 'F' ? (c*9/5+32) : c;
  return Math.round(v) + '°';
}
function setGreeting(){
  const h = new Date().getHours();
  const g = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : h < 21 ? 'Good Evening' : 'Good Night';
  $('greeting').textContent = `${g} 👋`;
}

function renderHero(){
  const w = state.weather;
  if(!w) return;
  $('cityName').textContent = `${state.city}, ${state.country}`;
  $('loc-pill-city').textContent = `${state.city}, ${state.country}`;
  $('cityDate').textContent = new Date().toLocaleString('en-US', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  $('tempHigh').textContent = fmtTemp(w.current.hi);
  $('tempLow').textContent = fmtTemp(w.current.lo);
  $('currentTemp').textContent = fmtTemp(w.current.temp);
  $('feelsLike').textContent = `Feels like ${fmtTemp(w.current.feels)}`;
  $('currentCondition').textContent = capitalize(w.current.condition);
  const icon = $('currentIcon');
  icon.className = 'fa-solid ' + w.current.icon + ' weather-icon';
  $('statHumidity').textContent = `${w.current.humidity}%`;
  $('statWind').textContent = `${w.current.wind} km/h`;
  $('statPressure').textContent = `${w.current.pressure} hPa`;
  $('statVisibility').textContent = `${w.current.visibility} km`;
}

function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function renderHourly(){
  const w = state.weather;
  if(!w) return;
  const html = w.hourly.map(h => {
    const d = new Date(h.time);
    const label = d.toLocaleTimeString('en-US', { hour:'numeric' });
    return `<div class="hour-card">
      <span class="hour-label">${label}</span>
      <i class="fa-solid ${h.icon}"></i>
      <span class="hour-temp mono">${fmtTemp(h.temp)}</span>
      <span class="hour-pop"><i class="fa-solid fa-droplet"></i>${Math.round(h.pop)}%</span>
    </div>`;
  }).join('');
  $('hourlyScroll').innerHTML = html;
  $('hourlyScrollFull').innerHTML = html;
}

function renderDaily(){
  const w = state.weather;
  if(!w) return;
  const html = w.daily.map((d,i) => {
    const date = new Date(d.date);
    const label = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday:'short' });
    const sub = date.toLocaleDateString('en-US', { day:'2-digit', month:'short' });
    return `<li class="daily-row">
      <span class="day-label">${label}<small>${sub}</small></span>
      <i class="fa-solid ${d.icon}"></i>
      <span class="day-pop"><i class="fa-solid fa-droplet"></i> ${Math.round(d.pop)}%</span>
      <span class="day-temps">${fmtTemp(d.hi)}<span class="lo">${fmtTemp(d.lo)}</span></span>
    </li>`;
  }).join('');
  $('dailyList').innerHTML = html;
  $('dailyListFull').innerHTML = html;
}

function aqiBand(aqi){
  if(aqi <= 50) return { cls:'good', label:'Good', advisory:'Air quality is satisfactory and poses little or no risk.' };
  if(aqi <= 100) return { cls:'moderate', label:'Moderate', advisory:'Air quality is acceptable; sensitive groups should reduce prolonged outdoor exertion.' };
  if(aqi <= 150) return { cls:'unhealthy', label:'Unhealthy (Sensitive)', advisory:'Sensitive groups may experience health effects. Limit prolonged outdoor exertion.' };
  if(aqi <= 200) return { cls:'unhealthy', label:'Unhealthy', advisory:'Everyone may begin to experience health effects. Avoid prolonged outdoor exertion.' };
  return { cls:'unhealthy', label:'Very Unhealthy', advisory:'Health warning: avoid outdoor activity where possible.' };
}

function renderAQI(){
  const a = state.aqi;
  $('iqairKeyNote').hidden = !!CONFIG.IQAIR_KEY;
  if(!a){
    $('aqiValue').textContent = '--';
    $('healthAdvisory').textContent = 'Air quality data will appear once a city is loaded.';
    return;
  }
  const band = aqiBand(a.aqi);
  $('aqiValue').textContent = a.aqi;
  $('aqiValue').style.color = `var(--${band.cls === 'good' ? 'good' : band.cls === 'moderate' ? 'moderate' : 'unhealthy'})`;
  const badge = $('aqiBadge');
  badge.textContent = band.label;
  badge.className = 'pill ' + band.cls;
  $('aqiDot').style.left = Math.min(100, (a.aqi/500)*100) + '%';
  $('pm25').textContent = a.pm25 ?? '--';
  $('pm10').textContent = a.pm10 ?? '--';
  $('o3').textContent = a.o3 ?? '--';
  $('no2').textContent = a.no2 ?? '--';
  $('so2').textContent = a.so2 ?? '--';
  $('co').textContent = a.co ?? '--';
  $('healthAdvisory').textContent = band.advisory;
  $('aqiCityLabel').textContent = `${state.city}, ${state.country}`;
}

function timeFromISO(iso){
  return new Date(iso).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
}

function renderAstronomy(){
  const a = state.astro;
  if(!a) return;
  const sunrise = new Date(a.sunrise), sunset = new Date(a.sunset), noon = new Date(a.solar_noon);
  [['sunriseTime',sunrise],['solarNoonTime',noon],['sunsetTime',sunset],
   ['sunriseTimeFull',sunrise],['solarNoonTimeFull',noon],['sunsetTimeFull',sunset]].forEach(([id,d]) => {
    if($(id)) $(id).textContent = d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
  });

  const dayLenSec = a.day_length;
  const h = Math.floor(dayLenSec/3600), m = Math.floor((dayLenSec%3600)/60);
  const dayLenStr = `${h}h ${m}m`;
  $('dayLength').textContent = dayLenStr;
  $('dayLengthFull').textContent = dayLenStr;

  const goldenAMStart = new Date(sunrise.getTime());
  const goldenAMEnd = new Date(sunrise.getTime() + 60*60*1000);
  const goldenPMStart = new Date(sunset.getTime() - 60*60*1000);
  const goldenPMEnd = new Date(sunset.getTime());
  const amStr = `${timeFromISO(goldenAMStart)} - ${timeFromISO(goldenAMEnd)}`;
  const pmStr = `${timeFromISO(goldenPMStart)} - ${timeFromISO(goldenPMEnd)}`;
  $('goldenAM').textContent = amStr; $('goldenAMFull').textContent = amStr;
  $('goldenPM').textContent = pmStr; $('goldenPMFull').textContent = pmStr;
  const now = new Date();
  let frac = (now - sunrise) / (sunset - sunrise);
  frac = Math.max(0, Math.min(1, frac));
  const angle = Math.PI * (1 - frac);
  ['sunMarker','sunMarkerFull'].forEach(id => {
    const el = $(id);
    if(!el) return;
    const x = 50 - 50*Math.cos(angle); 
    const y = Math.sin(angle) * 100; 
    el.style.left = x + '%';
    el.style.bottom = y + '%';
  });

  if(state.weather && state.weather.uv != null){
    const uv = Math.round(state.weather.uv);
    $('uvIndex').textContent = uv;
    $('uvAdvisory').textContent = uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : uv <= 10 ? 'Very High' : 'Extreme';
  }
}

function renderEvents(){
  const list = $('eventList');
  if(!state.events.length){
    list.innerHTML = '<li class="empty-row muted">No active natural events found near this location.</li>';
    return;
  }
  list.innerHTML = state.events.map(e => `
    <li class="event-row">
      <span class="event-type"><i class="fa-solid ${eonetIcon(e.categories[0]?.id)}"></i></span>
      <span class="event-info"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(e.categories[0]?.title || 'Event')} · ${Math.round(e.distance)} km away</small></span>
      <a class="btn-link" href="${escapeHtml(e.sources[0]?.url || '#')}" target="_blank" rel="noopener">Source <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
    </li>`).join('');
}
function eonetIcon(catId){
  const map = { 8:'fa-fire', 10:'fa-house-flood-water', 12:'fa-hurricane', 16:'fa-mountain', 6:'fa-water', 15:'fa-snowflake' };
  return map[catId] || 'fa-triangle-exclamation';
}

function renderAlertBanner(){
  const nearby = state.events.find(e => e.distance <= LIMITS.ALERT_RADIUS_KM);
  if(nearby){
    $('alertCard').hidden = false;
    $('noAlertCard').style.display = 'none';
    $('alertTitle').textContent = nearby.title;
    $('alertMessage').textContent = `${nearby.categories[0]?.title || 'Active event'} reported within ${LIMITS.ALERT_RADIUS_KM}km of your location.`;
    $('alertSource').textContent = 'NASA EONET';
    $('alertDetailsBtn').onclick = () => switchView('alerts');
  } else {
    $('alertCard').hidden = true;
    $('noAlertCard').style.display = 'flex';
  }
}
let heroActiveLayer = 'A';
function setHeroBackground(bgImageCss){
  const a = $('heroBgA'), b = $('heroBgB');
  if(!a || !b) return;
  const showEl = heroActiveLayer === 'A' ? b : a;
  const hideEl = heroActiveLayer === 'A' ? a : b;
  showEl.style.backgroundImage = bgImageCss;
  requestAnimationFrame(() => {
    showEl.classList.add('is-active');
    hideEl.classList.remove('is-active');
  });
  heroActiveLayer = heroActiveLayer === 'A' ? 'B' : 'A';
}

function renderHeroBackground(photo){
  const overlay = 'linear-gradient(180deg, rgba(7,13,24,0.35), rgba(7,13,24,0.85))';
  if(photo && photo.url){
    setHeroBackground(`${overlay}, url('${photo.url}')`);
    $('photoCredit').hidden = false;
    $('photoCreditLink').textContent = photo.photographer;
    $('photoCreditLink').href = photo.link;
  } else {
    setHeroBackground(`${overlay}, linear-gradient(160deg,#0c2540,#0a1322)`);
    $('photoCredit').hidden = true;
  }
}
let loadToken = 0;
async function loadCity(lat, lon, name, country){
  const myToken = ++loadToken;
  state.lat = lat; state.lon = lon; state.city = name; state.country = country || '';
  toast(`Loading ${name}…`);
  const [owmRes, omRes] = await Promise.allSettled([ fetchOWM(lat, lon), fetchOpenMeteo(lat, lon) ]);
  if(myToken !== loadToken) return;
  try{
    state.weather = normalizeWeather(owmRes, omRes);
  }catch(err){
    toast('Could not load weather for this city.');
    console.error(err);
    return;
  }
  renderHero(); renderHourly(); renderDaily(); setGreeting();
  if(window.VAYU && window.VAYU.updateCharts) window.VAYU.updateCharts(state);
  saveRecent(name, country, lat, lon);
  saveLastCity();
  (async () => {
    try{
      const data = await fetchIQAir(lat, lon);
      const p = data.data.current.pollution;
      state.aqi = { aqi:p.aqius, pm25:p.p2 ? Math.round(p.p2*100)/100 : '--', pm10:'--', o3:'--', no2:'--', so2:'--', co:'--' };
    }catch(_){
      try{
        const fb = await fetchOpenMeteoAQI(lat, lon);
        const c = fb.current;
        state.aqi = { aqi: Math.round(c.us_aqi), pm25:Math.round(c.pm2_5), pm10:Math.round(c.pm10),
          o3:Math.round(c.ozone), no2:Math.round(c.nitrogen_dioxide), so2:Math.round(c.sulphur_dioxide),
          co:(c.carbon_monoxide/1000).toFixed(1) };
      }catch(e){ console.warn('AQI unavailable', e); }
    }
    if(myToken === loadToken){
      renderAQI();
      if(window.VAYU && window.VAYU.updateCharts) window.VAYU.updateCharts(state);
    }
  })();
  (async () => {
    try{
      state.astro = await fetchSunriseSunset(lat, lon);
      if(myToken === loadToken) renderAstronomy();
    }catch(e){ console.warn('Astronomy unavailable', e); }
  })();
  (async () => {
    try{
      const photo = await fetchUnsplash(name, state.weather.current.condition, country);
      if(myToken === loadToken) renderHeroBackground(photo);
    }catch(_){ if(myToken === loadToken) renderHeroBackground(null); }
  })();
  (async () => {
    try{
      const events = await fetchEonet();
      const near = events
        .map(e => {
          const geo = e.geometry[e.geometry.length-1];
          const [elon, elat] = geo.coordinates.length === 2 ? geo.coordinates : geo.coordinates[0][0];
          return { ...e, distance: haversine(lat, lon, elat, elon) };
        })
        .filter(e => e.distance <= LIMITS.EVENT_RADIUS_KM)
        .sort((a,b) => a.distance - b.distance)
        .slice(0, LIMITS.EVENT_LIMIT);
      state.events = near;
      if(myToken === loadToken){ renderEvents(); renderAlertBanner(); }
    }catch(e){ console.warn('EONET unavailable', e); }
  })();
}
function saveLastCity(){
  localStorage.setItem('vayuLastCity', JSON.stringify({ name:state.city, country:state.country, lat:state.lat, lon:state.lon }));
}
function saveRecent(name, country, lat, lon){
  let list = JSON.parse(localStorage.getItem('vayuRecentSearches') || '[]');
  list = list.filter(c => c.name !== name);
  list.unshift({ name, country, lat, lon });
  list = list.slice(0, LIMITS.MAX_RECENT);
  localStorage.setItem('vayuRecentSearches', JSON.stringify(list));
  renderRecent();
}
function renderRecent(){
  const list = JSON.parse(localStorage.getItem('vayuRecentSearches') || '[]');
  const el = $('recentList');
  if(!list.length){ el.innerHTML = '<li class="empty-row muted">No recent searches yet.</li>'; return; }
  el.innerHTML = list.map(c => cityRow(c)).join('');
  bindCityRows(el);
}
function getFavorites(){ return JSON.parse(localStorage.getItem('vayuFavorites') || '[]'); }
function isFavorite(name){ return getFavorites().some(c => c.name === name); }
function toggleFavorite(){
  let list = getFavorites();
  if(isFavorite(state.city)){
    list = list.filter(c => c.name !== state.city);
    toast('Removed from favourites');
  } else {
    if(list.length >= LIMITS.MAX_FAVORITES){ toast(`You can save up to ${LIMITS.MAX_FAVORITES} favourites`); return; }
    list.push({ name:state.city, country:state.country, lat:state.lat, lon:state.lon });
    toast('Added to favourites');
  }
  localStorage.setItem('vayuFavorites', JSON.stringify(list));
  renderFavorites();
  updateFavIcons();
}
function renderFavorites(){
  const list = getFavorites();
  const el = $('favouritesList');
  if(!list.length){ el.innerHTML = '<li class="empty-row muted">No favourites yet — tap the star on a city to save it.</li>'; return; }
  el.innerHTML = list.map(c => cityRow(c)).join('');
  bindCityRows(el);
}
function cityRow(c){
  return `<li class="city-row" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${escapeHtml(c.name)}" data-country="${escapeHtml(c.country||'')}" tabindex="0">
    <i class="fa-solid fa-location-dot"></i>
    <span class="city-row-name">${escapeHtml(c.name)}<small>${escapeHtml(c.country||'')}</small></span>
    <i class="fa-solid fa-chevron-right muted"></i>
  </li>`;
}
function bindCityRows(container){
  qsa('.city-row', container).forEach(row => {
    row.addEventListener('click', () => {
      const { lat, lon, name, country } = row.dataset;
      loadCity(parseFloat(lat), parseFloat(lon), name, country);
      switchView('dashboard');
    });
  });
}
function updateFavIcons(){
  const fav = isFavorite(state.city);
  qsa('#favBtn i, #favBtnMobile i').forEach(i => { i.className = fav ? 'fa-solid fa-star' : 'fa-regular fa-star'; });
}
function switchView(view){
  qsa('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  qsa('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  qsa('.bn-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  closeDrawer(); closeSheet();
  window.scrollTo({ top:0, behavior:'smooth' });
  if((view === 'dashboard' || view === 'airquality') && window.VAYU && window.VAYU.updateCharts){
    requestAnimationFrame(() => window.VAYU.updateCharts(state));
  }
}
let searchTimer = null;
function bindSearch(input, onPick){
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if(q.length < 2){ $('searchSuggestions') && ($('searchSuggestions').hidden = true); return; }
    searchTimer = setTimeout(async () => {
      try{
        const results = await geocodeCity(q);
        showSuggestions(results, onPick, input);
      }catch(e){ console.warn('Geocode failed', e); }
    }, LIMITS.SEARCH_DEBOUNCE_MS);
  });
}
function showSuggestions(results, onPick, input){
  const box = $('searchSuggestions');
  if(!box) return;
  if(!results.length){ box.hidden = true; return; }
  box.innerHTML = results.map((r,i) => `<button data-i="${i}"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(r.name)}${r.admin1 ? ', '+escapeHtml(r.admin1) : ''}, ${escapeHtml(r.country)}</button>`).join('');
  box.hidden = false;
  qsa('button', box).forEach((btn,i) => {
    btn.addEventListener('click', () => {
      const r = results[i];
      onPick(r);
      box.hidden = true;
      input.value = '';
    });
  });
}
async function loadCompare(slot, lat, lon, name, country){
  try{
    const om = await fetchOpenMeteo(lat, lon);
    const d = om.data;
    const data = {
      name, country,
      temp: d.current.temperature_2m, humidity: d.current.relative_humidity_2m,
      wind: Math.round(d.current.wind_speed_10m), condition: wmoLabel(d.current.weather_code),
      icon: wmoIcon(d.current.weather_code),
    };
    if(slot === 'A') state.compareA = data; else state.compareB = data;
    renderCompare();
  }catch(e){ toast('Could not load that city'); }
}
function renderCompare(){
  const a = state.compareA, b = state.compareB;
  $('compareCardA').innerHTML = a ? compareCardHTML(a, b) : '<p class="muted">Search a city to compare.</p>';
  $('compareCardB').innerHTML = b ? compareCardHTML(b, a) : '<p class="muted">Search a city to compare.</p>';
}
function compareCardHTML(c, other){
  const rows = [
    ['Condition', `<i class="fa-solid ${c.icon}"></i> ${c.condition}`, null],
    ['Temperature', fmtTemp(c.temp), other ? c.temp > other.temp : null],
    ['Humidity', c.humidity + '%', other ? c.humidity < other.humidity : null],
    ['Wind', c.wind + ' km/h', other ? c.wind < other.wind : null],
  ];
  return `<strong>${escapeHtml(c.name)}, ${escapeHtml(c.country)}</strong>` + rows.map(([label, val, better]) =>
    `<div class="compare-stat"><span>${label}</span><span class="${better===true?'better':better===false?'worse':''}">${val}</span></div>`
  ).join('');
}
function toast(msg){
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function openDrawer(){ $('drawer').classList.add('open'); $('drawerOverlay').classList.add('open'); }
function closeDrawer(){ $('drawer').classList.remove('open'); $('drawerOverlay').classList.remove('open'); }
function openSheet(){ $('moreSheet').classList.add('open'); $('sheetOverlay').classList.add('open'); }
function closeSheet(){ $('moreSheet').classList.remove('open'); $('sheetOverlay').classList.remove('open'); }

function applyTheme(){
  document.body.dataset.theme = state.theme;
  localStorage.setItem('vayuTheme', state.theme);
  qsa('.theme-switch').forEach(s => s.setAttribute('aria-checked', state.theme === 'dark'));
}
function toggleTheme(){
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
}

function applyUnit(){
  qsa('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === state.unit));
  localStorage.setItem('vayuUnit', state.unit);
  renderHero(); renderHourly(); renderDaily(); renderCompare();
}
function setUnit(u){ state.unit = u; applyUnit(); }
function init(){
  applyTheme();
  applyUnit();
  qsa('[data-view]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));

  $('menuToggle').addEventListener('click', openDrawer);
  $('drawerOverlay').addEventListener('click', closeDrawer);
  $('moreMenuBtn').addEventListener('click', openSheet);
  $('moreBtn').addEventListener('click', openSheet);
  $('sheetOverlay').addEventListener('click', closeSheet);

  qsa('.theme-switch').forEach(s => s.addEventListener('click', toggleTheme));
  $('themeToggleTop').addEventListener('click', toggleTheme);
  qsa('.seg-btn').forEach(b => b.addEventListener('click', () => setUnit(b.dataset.unit)));

  ['favBtn','favBtnMobile'].forEach(id => $(id).addEventListener('click', toggleFavorite));
  $('dismissAlert').addEventListener('click', () => { $('alertCard').hidden = true; });

  $('shareBtn').addEventListener('click', shareWeather);

  $('notifSwitch').addEventListener('click', () => {
    const enabled = $('notifSwitch').getAttribute('aria-checked') === 'true';
    if(!enabled){ requestNotifications(); } else {
      $('notifSwitch').setAttribute('aria-checked','false');
      localStorage.setItem('vayuNotificationsEnabled','false');
    }
  });
  bindSearch($('citySearch'), (r) => loadCity(r.lat, r.lon, r.name, r.country));
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-row')) { const s = $('searchSuggestions'); if(s) s.hidden = true; }
  });

  bindSearch($('compareCityA'), (r) => loadCompare('A', r.lat, r.lon, r.name, r.country));
  bindSearch($('compareCityB'), (r) => loadCompare('B', r.lat, r.lon, r.name, r.country));
  $('compareToggleBtn').addEventListener('click', () => switchView('compare'));
  ['useMyLocation','useLocBtnInline'].forEach(id => $(id).addEventListener('click', useMyLocation));
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredPrompt = e;
    const btn = $('installBtn'); btn.disabled = false;
    btn.addEventListener('click', () => { deferredPrompt.prompt(); }, { once:true });
  });
  const last = JSON.parse(localStorage.getItem('vayuLastCity') || 'null');
  renderFavorites(); renderRecent();
  if(last){ loadCity(last.lat, last.lon, last.name, last.country); }
  else { loadCity(state.lat, state.lon, state.city, state.country); }
  updateFavIcons();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
function useMyLocation(){
  if(!navigator.geolocation){ toast('Geolocation not supported on this device'); return; }
  toast('Locating you…');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    let name = 'My Location', country = '';
    try{
      const r = await fetchJSON(`${ENDPOINTS.BIGDATACLOUD_REVERSE}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
      name = r.city || r.locality || r.principalSubdivision || name;
      country = r.countryCode || '';
    }catch(e){ console.warn('Reverse geocoding unavailable, using generic location name', e); }
    loadCity(latitude, longitude, name, country);
  }, () => toast('Could not access your location'));
}

function shareWeather(){
  const w = state.weather;
  const text = w ? `${state.city}: ${fmtTemp(w.current.temp)}, ${capitalize(w.current.condition)} — via Vayu` : 'Check the weather on Vayu';
  if(navigator.share){
    navigator.share({ title:'Vayu Weather', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
    toast('Copied to clipboard');
  }
}

function requestNotifications(){
  if(!('Notification' in window)){ toast('Notifications not supported on this device'); return; }
  Notification.requestPermission().then(perm => {
    const granted = perm === 'granted';
    $('notifSwitch').setAttribute('aria-checked', String(granted));
    localStorage.setItem('vayuNotificationsEnabled', String(granted));
    if(granted){
      toast('Notifications enabled');
      new Notification('Vayu', { body:'You\'ll get severe weather alerts here.' });
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

window.VAYU = { state, fmtTemp, wmoIcon };