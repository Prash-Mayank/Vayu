(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function theme() {
    return {
      accent: cssVar('--accent', '#22d3ee'),
      accent2: cssVar('--accent-2', '#3b82f6'),
      text1: cssVar('--text-1', '#f3f6fb'),
      text2: cssVar('--text-2', '#9fb0c3'),
      grid: cssVar('--card-border', 'rgba(255,255,255,0.09)'),
      good: cssVar('--good', '#22c55e'),
      moderate: cssVar('--moderate', '#eab308'),
      unhealthy: cssVar('--unhealthy', '#ef4444'),
    };
  }

  function hexToRGBA(hex, alpha) {
    if (hex.startsWith('rgb')) {
      const nums = hex.match(/[\d.]+/g);
      return `rgba(${nums[0]},${nums[1]},${nums[2]},${alpha})`;
    }
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function baseOptions(t, extra) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 600, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,18,32,0.92)',
          borderColor: t.grid,
          borderWidth: 1,
          titleColor: t.text1,
          bodyColor: t.text2,
          padding: 10,
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: { color: t.text2, font: { size: 11 }, maxRotation: 0 },
          grid: { color: 'transparent' },
          border: { color: t.grid },
        },
        y: {
          ticks: { color: t.text2, font: { size: 11 } },
          grid: { color: t.grid },
          border: { display: false },
        },
      },
    }, extra || {});
  }

  const charts = {};

  function destroyAll() {
    Object.values(charts).forEach((c) => c && c.destroy());
    Object.keys(charts).forEach((k) => delete charts[k]);
  }

  function hourLabel(timeStr) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric' });
  }

  function unitTemp(c, unit) {
    if (c === null || c === undefined || isNaN(c)) return null;
    return unit === 'F' ? Math.round((c * 9) / 5 + 32) : Math.round(c);
  }

  function renderTempTrend(canvasId, hourly, unit, t) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const labels = hourly.map((h) => hourLabel(h.time));
    const data = hourly.map((h) => unitTemp(h.temp, unit));

    if (charts[canvasId]) charts[canvasId].destroy();
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 220);
    gradient.addColorStop(0, hexToRGBA(t.accent2, 0.35));
    gradient.addColorStop(1, hexToRGBA(t.accent2, 0.02));

    charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: t.accent,
          backgroundColor: gradient,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: t.accent,
          pointBorderColor: 'transparent',
          tension: 0.4,
          fill: true,
        }],
      },
      options: baseOptions(t, {
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.92)',
            borderColor: t.grid,
            borderWidth: 1,
            titleColor: t.text1,
            bodyColor: t.text2,
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx2) => `${ctx2.parsed.y}°${unit}` },
          },
        },
        scales: {
          x: { ticks: { color: t.text2, font: { size: 11 } }, grid: { color: 'transparent' } },
          y: { ticks: { color: t.text2, font: { size: 11 }, callback: (v) => v + '°' }, grid: { color: t.grid } },
        },
      }),
    });
  }

  function renderPrecip(canvasId, hourly, t) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const labels = hourly.map((h) => hourLabel(h.time));
    const data = hourly.map((h) => h.pop ?? 0);

    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map((v) => v >= 60 ? t.unhealthy : v >= 30 ? t.moderate : hexToRGBA(t.accent2, 0.7)),
          borderRadius: 6,
          maxBarThickness: 26,
        }],
      },
      options: baseOptions(t, {
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.92)',
            borderColor: t.grid,
            borderWidth: 1,
            titleColor: t.text1,
            bodyColor: t.text2,
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx2) => `${ctx2.parsed.y}% chance` },
          },
        },
        scales: {
          x: { ticks: { color: t.text2, font: { size: 11 } }, grid: { color: 'transparent' } },
          y: { min: 0, max: 100, ticks: { color: t.text2, font: { size: 11 }, stepSize: 25, callback: (v) => v + '%' }, grid: { color: t.grid } },
        },
      }),
    });
  }

  function renderWindGust(canvasId, hourly, t) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const labels = hourly.map((h) => hourLabel(h.time));
    const data = hourly.map((h) => Math.round(h.gust ?? h.wind ?? 0));

    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#a855f7',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: '#a855f7',
          tension: 0.35,
          fill: false,
        }],
      },
      options: baseOptions(t, {
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.92)',
            borderColor: t.grid,
            borderWidth: 1,
            titleColor: t.text1,
            bodyColor: t.text2,
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx2) => `${ctx2.parsed.y} km/h` },
          },
        },
      }),
    });
  }

  function renderHumidity(canvasId, hourly, t) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const labels = hourly.map((h) => hourLabel(h.time));
    const data = hourly.map((h) => Math.round(h.humidity ?? 0));

    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: t.accent2,
          backgroundColor: hexToRGBA(t.accent2, 0.12),
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: t.accent2,
          tension: 0.35,
          fill: true,
        }],
      },
      options: baseOptions(t, {
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.92)',
            borderColor: t.grid,
            borderWidth: 1,
            titleColor: t.text1,
            bodyColor: t.text2,
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx2) => `${ctx2.parsed.y}%` },
          },
        },
        scales: {
          x: { ticks: { color: t.text2, font: { size: 11 } }, grid: { color: 'transparent' } },
          y: { min: 0, max: 100, ticks: { color: t.text2, font: { size: 11 }, callback: (v) => v + '%' }, grid: { color: t.grid } },
        },
      }),
    });
  }

  function renderAqiTrend(canvasId, hourly, currentAqi, t) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const labels = hourly.map((h) => hourLabel(h.time));
    const temps = hourly.map((h) => h.temp ?? 0);
    const minT = Math.min(...temps), maxT = Math.max(...temps);
    const range = maxT - minT || 1;
    const base = currentAqi ?? 50;
    const data = temps.map((tmp) => {
      const norm = (tmp - minT) / range;
      const wobble = (norm - 0.5) * 0.6;
      return Math.max(5, Math.round(base * (1 + wobble)));
    });

    function bandColor(v) {
      if (v <= 50) return t.good;
      if (v <= 100) return t.moderate;
      return t.unhealthy;
    }

    if (charts[canvasId]) charts[canvasId].destroy();
    charts[canvasId] = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data, backgroundColor: data.map(bandColor), borderRadius: 6, maxBarThickness: 26 }],
      },
      options: baseOptions(t, {
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,18,32,0.92)',
            borderColor: t.grid,
            borderWidth: 1,
            titleColor: t.text1,
            bodyColor: t.text2,
            padding: 10,
            displayColors: false,
            callbacks: { label: (ctx2) => `AQI ${ctx2.parsed.y} (US)` },
          },
        },
        scales: {
          x: { ticks: { color: t.text2, font: { size: 11 } }, grid: { color: 'transparent' } },
          y: { ticks: { color: t.text2, font: { size: 11 } }, grid: { color: t.grid }, beginAtZero: true },
        },
      }),
    });
  }

  function updateCharts(state) {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js failed to load — charts skipped.');
      return;
    }
    const w = state.weather;
    if (!w || !w.hourly || !w.hourly.length) return;

    const t = theme();
    const unit = state.unit || 'C';

    renderTempTrend('tempTrendChart', w.hourly, unit, t);
    renderTempTrend('tempTrendChartForecast', w.hourly, unit, t);
    renderPrecip('precipChart', w.hourly, t);
    renderWindGust('windChart', w.hourly, t);
    renderHumidity('humidityChart', w.hourly, t);
    renderAqiTrend('aqiTrendChart', w.hourly, state.aqi ? state.aqi.aqi : null, t);
  }

  function refreshTheme() {
    if (window.__vayuLastState) updateCharts(window.__vayuLastState);
  }

  window.VAYU = window.VAYU || {};
  window.VAYU.updateCharts = function (state) {
    window.__vayuLastState = state;
    updateCharts(state);
  };
  window.VAYU.refreshChartTheme = refreshTheme;
  window.VAYU._destroyCharts = destroyAll;
  window.VAYU.resizeCharts = function () {
    Object.values(charts).forEach((c) => c && c.resize());
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.switch, #themeToggleDesktop').forEach((el) => {
      el.addEventListener('click', () => setTimeout(refreshTheme, 50));
    });
  });
})();