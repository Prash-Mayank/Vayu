/* -----------------------------------------------------------
   VAYU 2.0 — config.example.js
   ---------------------------------------------------------------
   Template for config.js. This file IS committed to git — it
   contains no real secrets, just placeholders.

   Setup:
     1. Copy this file and rename the copy to "config.js".
     2. Fill in your own keys below (see README.md for signup links).
     3. config.js is already in .gitignore, so your real keys will
        never be committed.

   The app works without any keys (Open-Meteo covers weather + AQI
   as a free, no-key fallback) — adding keys just unlocks
   OpenWeatherMap as primary source, IQAir-branded AQI, and live
   Unsplash background photos. See README.md for details.
----------------------------------------------------------- */
window.VAYU_CONFIG = {
  OWM_KEY: "",      // https://openweathermap.org/api
  IQAIR_KEY: "",    // https://www.iqair.com/air-pollution-data-api
  UNSPLASH_KEY: "", // https://unsplash.com/developers
};
