(function () {
  "use strict";

  var DATA = (typeof LANDSLIDE_DATA !== "undefined") ? LANDSLIDE_DATA : [];

  var STATE_COLORS = {
    "Mizoram": "#C1503D",
    "Nagaland": "#C98A3B",
    "Manipur": "#B08A5A",
    "Arunachal Pradesh": "#93BBCF",
    "Meghalaya": "#4C7A5E",
    "Assam": "#6E97AC",
    "Sikkim": "#E0A855",
    "Tripura": "#7FBB98"
  };
  var MATERIAL_COLORS = {
    "Debris": "#E8735D", "Rock": "#93BBCF", "Earth": "#7FBB98", "Soil": "#E0A855",
    "Rock cum Debris": "#C1503D", "Regolith": "#B08A5A"
  };
  var DEFAULT_COLOR = "#5E6D74";
  var MOVEMENT_COLORS = {
    "Slide": "#E0A855", "Fall": "#E8735D", "Flow": "#93BBCF", "Subsidence": "#7FBB98", "Complex": "#B08A5A"
  };

  function colorFor(mode, rec) {
    if (mode === "state") return STATE_COLORS[rec.state] || DEFAULT_COLOR;
    if (mode === "material") return MATERIAL_COLORS[rec.material] || DEFAULT_COLOR;
    return MOVEMENT_COLORS[rec.movement] || DEFAULT_COLOR;
  }

  function count(arr, keyFn) {
    var m = new Map();
    arr.forEach(function (r) {
      var k = keyFn(r);
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }
  function sortedEntries(m) {
    return Array.from(m.entries()).sort(function (a, b) { return b[1] - a[1]; });
  }
  function fmt(n) { return n.toLocaleString("en-IN"); }

  // ---------------- header stats ----------------
  var stateCounts = sortedEntries(count(DATA, function (r) { return r.state; }));
  var districtKeySet = new Set(DATA.map(function (r) { return r.state + "||" + r.district; }));
  var topState = stateCounts[0];

  document.getElementById("statTotal").textContent = fmt(DATA.length);
  document.getElementById("statStates").textContent = stateCounts.length;
  document.getElementById("statDistricts").textContent = fmt(districtKeySet.size);
  document.getElementById("statTopState").textContent = topState ? topState[0] + " (" + fmt(topState[1]) + ")" : "\u2014";
  document.getElementById("pillCount").textContent = fmt(DATA.length) + " recorded incidents";

  // ---------------- map ----------------
  var canvas = document.getElementById("mapCanvas");
  var ctx = canvas.getContext("2d");
  var tooltip = document.getElementById("mapTooltip");
  var mapWrap = document.getElementById("mapCanvasWrap");
  var currentMode = "state";
  var projected = []; // {x,y,rec}
  var grid = new Map();
  var CELL = 16;

  var bounds = (function () {
    var minLat = 90, maxLat = -90, minLon = 200, maxLon = -200;
    DATA.forEach(function (r) {
      if (r.lat < minLat) minLat = r.lat;
      if (r.lat > maxLat) maxLat = r.lat;
      if (r.lon < minLon) minLon = r.lon;
      if (r.lon > maxLon) maxLon = r.lon;
    });
    var padLat = (maxLat - minLat) * 0.06, padLon = (maxLon - minLon) * 0.06;
    return { minLat: minLat - padLat, maxLat: maxLat + padLat, minLon: minLon - padLon, maxLon: maxLon + padLon };
  })();

  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function sizeCanvas() {
    var w = mapWrap.clientWidth;
    var meanLat = (bounds.minLat + bounds.maxLat) / 2;
    var lonSpanAdj = (bounds.maxLon - bounds.minLon) * Math.cos(meanLat * Math.PI / 180);
    var latSpan = bounds.maxLat - bounds.minLat;
    var aspect = lonSpanAdj / latSpan;
    var h = w / aspect;
    h = Math.max(420, Math.min(700, h));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    return { w: w, h: h };
  }

  function project(lat, lon, w, h, pad) {
    var x = pad + (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * (w - 2 * pad);
    var y = pad + (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * (h - 2 * pad);
    return [x, y];
  }

  function buildProjection(w, h) {
    var pad = 34;
    projected = DATA.map(function (r) {
      var p = project(r.lat, r.lon, w, h, pad);
      return { x: p[0], y: p[1], rec: r };
    });
    grid = new Map();
    projected.forEach(function (p, i) {
      var cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL);
      var key = cx + "," + cy;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    });
    return pad;
  }

  function drawGraticule(w, h, pad) {
    ctx.strokeStyle = "rgba(237,239,239,0.07)";
    ctx.fillStyle = "rgba(237,239,239,0.28)";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.lineWidth = 1;
    for (var lat = Math.ceil(bounds.minLat); lat <= Math.floor(bounds.maxLat); lat++) {
      var y = project(lat, bounds.minLon, w, h, pad)[1];
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
      ctx.fillText(lat + "\u00B0N", 4, y + 3);
    }
    for (var lon = Math.ceil(bounds.minLon); lon <= Math.floor(bounds.maxLon); lon++) {
      var x = project(bounds.minLat, lon, w, h, pad)[0];
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
      ctx.fillText(lon + "\u00B0E", x + 3, h - 6);
    }
  }

  function drawMap() {
    var size = sizeCanvas();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var w = size.w, h = size.h;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0C1116";
    ctx.fillRect(0, 0, w, h);
    var pad = buildProjection(w, h);
    drawGraticule(w, h, pad);

    var byColor = new Map();
    projected.forEach(function (p) {
      var c = colorFor(currentMode, p.rec);
      if (!byColor.has(c)) byColor.set(c, []);
      byColor.get(c).push(p);
    });
    byColor.forEach(function (pts, c) {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      pts.forEach(function (p) {
        ctx.moveTo(p.x + 1.5, p.y);
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      });
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function renderLegend() {
    var el = document.getElementById("mapLegend");
    el.innerHTML = "";
    var map = currentMode === "state" ? STATE_COLORS : (currentMode === "material" ? MATERIAL_COLORS : MOVEMENT_COLORS);
    Object.keys(map).forEach(function (k) {
      var item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = '<span class="legend-dot" style="background:' + map[k] + '"></span>' + k;
      el.appendChild(item);
    });
    var other = document.createElement("div");
    other.className = "legend-item";
    other.innerHTML = '<span class="legend-dot" style="background:' + DEFAULT_COLOR + '"></span>Other';
    el.appendChild(other);
  }

  function findNearest(mx, my) {
    var cx = Math.floor(mx / CELL), cy = Math.floor(my / CELL);
    var best = null, bestD = 6 * 6;
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = -1; dy <= 1; dy++) {
        var arr = grid.get((cx + dx) + "," + (cy + dy));
        if (!arr) continue;
        for (var i = 0; i < arr.length; i++) {
          var p = projected[arr[i]];
          var d = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
          if (d < bestD) { bestD = d; best = p; }
        }
      }
    }
    return best;
  }

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var p = findNearest(mx, my);
    if (!p) { tooltip.classList.remove("show"); return; }
    var r = p.rec;
    tooltip.innerHTML =
      '<div class="t-place">' + escapeHtml(r.place) + '</div>' +
      '<div class="t-meta">' + escapeHtml(r.district) + ', ' + escapeHtml(r.state) + '</div>' +
      '<span class="t-tag">' + escapeHtml(r.material) + '</span> <span class="t-tag">' + escapeHtml(r.movement) + '</span>' +
      (r.year ? '<div class="t-meta">Recorded ' + r.year + '</div>' : '');
    tooltip.style.left = mx + "px";
    tooltip.style.top = my + "px";
    tooltip.classList.add("show");
  });
  canvas.addEventListener("mouseleave", function () { tooltip.classList.remove("show"); });

  document.querySelectorAll("#mapModeToggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#mapModeToggle button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      currentMode = btn.getAttribute("data-mode");
      drawMap();
      renderLegend();
    });
  });

  window.addEventListener("resize", debounce(drawMap, 150));
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  drawMap();
  renderLegend();

  // ---------------- state bar chart ----------------
  (function renderStateBars() {
    var el = document.getElementById("stateBars");
    var max = stateCounts[0][1];
    stateCounts.forEach(function (entry) {
      var row = document.createElement("div");
      row.className = "bar-row";
      var pct = (entry[1] / max * 100).toFixed(1);
      row.innerHTML =
        '<span class="bar-label">' + entry[0] + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%;background:' + (STATE_COLORS[entry[0]] || DEFAULT_COLOR) + '"></span></span>' +
        '<span class="bar-count">' + fmt(entry[1]) + '</span>';
      el.appendChild(row);
    });
  })();

  // ---------------- hotspot districts ----------------
  (function renderHotspots() {
    var el = document.getElementById("hotspotList");
    var m = count(DATA, function (r) { return r.state + "||" + r.district; });
    var top = sortedEntries(m).slice(0, 12);
    top.forEach(function (entry, i) {
      var parts = entry[0].split("||");
      var row = document.createElement("div");
      row.className = "hotspot-row";
      row.innerHTML =
        '<span class="hotspot-rank">' + (i + 1) + '</span>' +
        '<span class="hotspot-name">' + parts[1] + '<span class="state">' + parts[0] + '</span></span>' +
        '<span class="hotspot-count">' + fmt(entry[1]) + '</span>';
      el.appendChild(row);
    });
  })();

  // ---------------- material / movement mini bars ----------------
  function renderMiniBars(elId, keyFn, colorMap) {
    var el = document.getElementById(elId);
    var entries = sortedEntries(count(DATA, keyFn)).slice(0, 6);
    var max = entries[0][1];
    entries.forEach(function (entry) {
      var row = document.createElement("div");
      row.className = "bar-row";
      var pct = (entry[1] / max * 100).toFixed(1);
      row.innerHTML =
        '<span class="bar-label">' + entry[0] + '</span>' +
        '<span class="bar-track"><span class="bar-fill" style="width:' + pct + '%;background:' + (colorMap[entry[0]] || DEFAULT_COLOR) + '"></span></span>' +
        '<span class="bar-count">' + fmt(entry[1]) + '</span>';
      el.appendChild(row);
    });
  }
  renderMiniBars("materialBars", function (r) { return r.material; }, MATERIAL_COLORS);
  renderMiniBars("movementBars", function (r) { return r.movement; }, MOVEMENT_COLORS);

  // ---------------- year trend chart ----------------
  (function renderYearChart() {
    var withYear = DATA.filter(function (r) { return r.year && r.year >= 2005 && r.year <= 2026; });
    var m = count(withYear, function (r) { return r.year; });
    var years = Array.from(m.keys()).sort(function (a, b) { return a - b; });
    var counts = years.map(function (y) { return m.get(y); });
    var maxC = Math.max.apply(null, counts);

    var canvasY = document.getElementById("yearCanvas");
    var wrap = canvasY.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = wrap.clientWidth, h = 150;
    canvasY.style.width = w + "px"; canvasY.style.height = h + "px";
    canvasY.width = w * dpr; canvasY.height = h * dpr;
    var yctx = canvasY.getContext("2d");
    yctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    yctx.clearRect(0, 0, w, h);

    var padB = 18, padT = 6, padL = 4, padR = 4;
    var barW = (w - padL - padR) / years.length * 0.68;
    var gap = (w - padL - padR) / years.length;

    yctx.fillStyle = "#C98A3B";
    years.forEach(function (y, i) {
      var val = m.get(y);
      var barH = (val / maxC) * (h - padB - padT);
      var x = padL + i * gap + (gap - barW) / 2;
      var yTop = h - padB - barH;
      yctx.fillRect(x, yTop, barW, barH);
    });

    yctx.fillStyle = "#5E6D74";
    yctx.font = "9px 'IBM Plex Mono', monospace";
    years.forEach(function (y, i) {
      if (y % 3 === 0 || i === years.length - 1) {
        var x = padL + i * gap + gap / 2;
        yctx.save();
        yctx.textAlign = "center";
        yctx.fillText(String(y), x, h - 5);
        yctx.restore();
      }
    });
    document.getElementById("yearCaption").textContent =
      fmt(withYear.length) + " of " + fmt(DATA.length) + " records carry a usable date. Undated field-survey entries are excluded from this chart.";
  })();

  // ---------------- hotspot advisories (real, derived) ----------------
  (function renderAdvisories() {
    var el = document.getElementById("advisoryList");
    var m = count(DATA, function (r) { return r.state + "||" + r.district; });
    var top = sortedEntries(m).slice(0, 4);
    var icons = {
      warn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L2.6 18a1.5 1.5 0 001.3 2.2h16.2a1.5 1.5 0 001.3-2.2L13.7 3.9a1.5 1.5 0 00-2.4 0z"/></svg>'
    };
    top.forEach(function (entry) {
      var parts = entry[0].split("||");
      var district = parts[1], state = parts[0], n = entry[1];
      var row = document.createElement("div");
      row.className = "advisory-item";
      row.innerHTML =
        '<span class="advisory-icon">' + icons.warn + '</span>' +
        '<div>' +
        '<div class="advisory-top"><span class="advisory-tag" style="color:#E8735D;border-color:rgba(193,80,61,0.4)">Historical hotspot</span></div>' +
        '<div class="advisory-text">' + district + ' district, ' + state + ' holds ' + fmt(n) + ' recorded landslide events in the inventory, the ' +
        (top.indexOf(entry) === 0 ? 'highest count of any district covered' : 'next-highest concentration') + '. A deployed system would weight this district for closer sensor and rainfall coverage.</div>' +
        '<div class="advisory-meta">Derived from the historical inventory, not a live reading</div>' +
        '</div>';
      el.appendChild(row);
    });
  })();

  // ---------------- explorer ----------------
  var stateSelect = document.getElementById("filterState");
  var districtSelect = document.getElementById("filterDistrict");
  var materialSelect = document.getElementById("filterMaterial");
  var movementSelect = document.getElementById("filterMovement");
  var searchInput = document.getElementById("filterSearch");
  var resetBtn = document.getElementById("filterReset");
  var tbody = document.getElementById("resultsBody");
  var resultMetaEl = document.getElementById("resultMeta");
  var pageInfoEl = document.getElementById("pageInfo");
  var prevBtn = document.getElementById("prevPage");
  var nextBtn = document.getElementById("nextPage");

  var PAGE_SIZE = 50;
  var page = 1;
  var filtered = DATA;

  function uniqueSorted(arr) { return Array.from(new Set(arr)).sort(); }

  function fillSelect(sel, values, placeholder) {
    sel.innerHTML = "";
    var opt = document.createElement("option");
    opt.value = ""; opt.textContent = placeholder;
    sel.appendChild(opt);
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = v; o.textContent = v;
      sel.appendChild(o);
    });
  }

  fillSelect(stateSelect, stateCounts.map(function (e) { return e[0]; }), "All states");
  fillSelect(materialSelect, sortedEntries(count(DATA, function (r) { return r.material; })).map(function (e) { return e[0]; }), "All materials");
  fillSelect(movementSelect, sortedEntries(count(DATA, function (r) { return r.movement; })).map(function (e) { return e[0]; }), "All movement types");

  function updateDistrictOptions() {
    var st = stateSelect.value;
    var pool = st ? DATA.filter(function (r) { return r.state === st; }) : DATA;
    fillSelect(districtSelect, uniqueSorted(pool.map(function (r) { return r.district; })), "All districts");
  }
  updateDistrictOptions();

  function applyFilters() {
    var st = stateSelect.value, di = districtSelect.value, mat = materialSelect.value, mov = movementSelect.value;
    var q = searchInput.value.trim().toLowerCase();
    filtered = DATA.filter(function (r) {
      if (st && r.state !== st) return false;
      if (di && r.district !== di) return false;
      if (mat && r.material !== mat) return false;
      if (mov && r.movement !== mov) return false;
      if (q && (r.place + " " + r.location).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    page = 1;
    renderPage();
  }

  function renderPage() {
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * PAGE_SIZE;
    var rows = filtered.slice(start, start + PAGE_SIZE);
    tbody.innerHTML = "";
    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td>' + escapeHtml(r.state) + '</td>' +
        '<td>' + escapeHtml(r.district) + '</td>' +
        '<td class="place">' + escapeHtml(r.place) + '</td>' +
        '<td><span class="chip">' + escapeHtml(r.material) + '</span></td>' +
        '<td><span class="chip">' + escapeHtml(r.movement) + '</span></td>' +
        '<td>' + escapeHtml(r.history) + '</td>' +
        '<td class="mono">' + r.lat.toFixed(3) + ', ' + r.lon.toFixed(3) + '</td>';
      tbody.appendChild(tr);
    });
    resultMetaEl.textContent = fmt(filtered.length) + " matching records";
    pageInfoEl.textContent = "Page " + page + " of " + totalPages;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  }

  stateSelect.addEventListener("change", function () { updateDistrictOptions(); applyFilters(); });
  [districtSelect, materialSelect, movementSelect].forEach(function (s) { s.addEventListener("change", applyFilters); });
  searchInput.addEventListener("input", debounce(applyFilters, 220));
  resetBtn.addEventListener("click", function () {
    stateSelect.value = ""; updateDistrictOptions(); materialSelect.value = ""; movementSelect.value = ""; searchInput.value = "";
    applyFilters();
  });
  prevBtn.addEventListener("click", function () { if (page > 1) { page--; renderPage(); } });
  nextBtn.addEventListener("click", function () { page++; renderPage(); });

  renderPage();

  // ---------------- language toggle ----------------
  var i18n = {
    en: {
      tag: "Landslide inventory & early warning, North Eastern Region",
      nav1: "Overview", nav2: "Map", nav3: "Hotspots", nav4: "Explorer", nav5: "Demo",
      h1: "Every recorded landslide in the Northeast, in one place.",
      lede: "This prototype is built on a field-validated landslide inventory covering all eight north-eastern states, combined with a proposed real-time layer for rainfall, sensors, field reports and alerts.",
      cta1: "Explore the map", cta2: "Browse the inventory"
    },
    hi: {
      tag: "\u092d\u0942\u0938\u094d\u0916\u0932\u0928 \u0938\u0942\u091a\u0940 \u0914\u0930 \u092a\u0942\u0930\u094d\u0935 \u091a\u0947\u0924\u093e\u0935\u0928\u0940, \u092a\u0942\u0930\u094d\u0935\u094b\u0924\u094d\u0924\u0930 \u0915\u094d\u0937\u0947\u0924\u094d\u0930",
      nav1: "\u0905\u0935\u0932\u094b\u0915\u0928", nav2: "\u092e\u093e\u0928\u091a\u093f\u0924\u094d\u0930", nav3: "\u0939\u0949\u091f\u0938\u094d\u092a\u0949\u091f", nav4: "\u090f\u0915\u094d\u0938\u092a\u094d\u0932\u094b\u0930\u0930", nav5: "\u0921\u0947\u092e\u094b",
      h1: "\u092a\u0942\u0930\u094d\u0935\u094b\u0924\u094d\u0924\u0930 \u0915\u093e \u0939\u0930 \u0926\u0930\u094d\u091c \u092d\u0942\u0938\u094d\u0916\u0932\u0928, \u090f\u0915 \u091c\u0917\u0939 \u092a\u0930\u0964",
      lede: "\u092f\u0939 \u092a\u094d\u0930\u094b\u091f\u094b\u091f\u093e\u0907\u092a \u0906\u0920\u094b\u0902 \u092a\u0942\u0930\u094d\u0935\u094b\u0924\u094d\u0924\u0930 \u0930\u093e\u091c\u094d\u092f\u094b\u0902 \u0915\u0940 \u092d\u0942\u0938\u094d\u0916\u0932\u0928 \u0938\u0942\u091a\u0940 \u092a\u0930 \u0906\u0927\u093e\u0930\u093f\u0924 \u0939\u0948\u0964",
      cta1: "\u092e\u093e\u0928\u091a\u093f\u0924\u094d\u0930 \u0926\u0947\u0916\u0947\u0902", cta2: "\u0938\u0942\u091a\u0940 \u0926\u0947\u0916\u0947\u0902"
    },
    kha: {
      tag: "Ka Jingpynbna Naduh Lyngkhap, North East India",
      nav1: "Overview", nav2: "Ka Map", nav3: "Ki Hotspot", nav4: "Explorer", nav5: "Demo",
      h1: "Baroh ki jingkyllum lum, ha North East, ha ka jaka wei.",
      lede: "Ka platform kane ka la thung na ka rekord jong ki jingkyllum lum na baroh ki state jong North East.",
      cta1: "Peit ka Map", cta2: "Peit ka Rekord"
    }
  };
  document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".lang-toggle button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var dict = i18n[btn.getAttribute("data-lang")] || i18n.en;
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (dict[key]) el.textContent = dict[key];
      });
    });
  });

  // ---------------- field report demo ----------------
  var uploadInput = document.getElementById("uploadInput");
  var uploadLabel = document.getElementById("uploadLabel");
  if (uploadInput) {
    uploadInput.addEventListener("change", function () {
      if (uploadInput.files && uploadInput.files[0]) {
        uploadLabel.innerHTML = 'Attached: <span class="fname">' + escapeHtml(uploadInput.files[0].name) + '</span>';
      }
    });
  }

  var geoTag = document.getElementById("geoTag");
  if (geoTag && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      geoTag.textContent = pos.coords.latitude.toFixed(4) + "\u00B0 N, " + pos.coords.longitude.toFixed(4) + "\u00B0 E \u00B7 captured automatically";
    }, function () { }, { timeout: 4000 });
  }

  var reportForm = document.getElementById("reportForm");
  if (reportForm) {
    var ticketNum = 4021;
    var ticketList = document.getElementById("ticketList");
    var offlineToggle = document.getElementById("offlineToggle");
    var category = document.getElementById("category");
    var note = document.getElementById("note");

    reportForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var offline = offlineToggle.checked;
      var ticket = document.createElement("div");
      ticket.className = "ticket";
      ticket.style.opacity = "0";
      var body = category.value + (note.value ? " \u2014 " + note.value : "") + " \u00B7 Aizawl, Mizoram";
      ticket.innerHTML =
        '<div class="ticket-top"><span class="ticket-id">NER-' + (ticketNum++) + '</span><span class="ticket-time">just now</span></div>' +
        '<div class="ticket-body">' + escapeHtml(body) + '</div>' +
        '<span class="ticket-tag">' + (offline ? "Queued, will sync when connected" : "Routed: Aizawl district control room") + '</span>';
      ticketList.insertBefore(ticket, ticketList.firstChild);
      requestAnimationFrame(function () { ticket.style.transition = "opacity .35s ease"; ticket.style.opacity = "1"; });
      if (!offline && typeof fetch === "function") {
        fetch("/reports/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district: "Aizawl",
            description: category.value + (note.value ? " \u2014 " + note.value : ""),
            severity: "Medium"
          })
        }).catch(function () {});
      }
      reportForm.reset();
      uploadLabel.textContent = "Tap to attach, or drop a file here";
    });
  }
})();