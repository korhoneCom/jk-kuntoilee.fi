/* JK Kuntoilee — painotuksen seurantasivu */
(function () {
  'use strict';

  var D = window.PAINOTUS_DATA || { summary: {}, data: [] };
  var S = D.summary || {};
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var fmt = function (v) {
    if (v == null || isNaN(v)) return '—';
    return String(v).replace('.', ',');
  };
  var pvmFi = function (iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('fi-FI');
  };

  if ($('#vuosi')) $('#vuosi').textContent = new Date().getFullYear();
  if ($('#generoitu')) {
    $('#generoitu').textContent = 'Seurattu ' + pvmFi(S.alkupvm) + ' – ' +
      pvmFi(S.viimeisinPvm) + ' · ' + S.paivat + ' päivää · ' +
      S.kuukaudet + ' kuukautta · 124 punnerrusta';
  }

  /* ---- Kortit ---- */
  var kortit = [
    ['Alkupaino', fmt(S.alkupaino) + ' kg'],
    ['Alin paino', fmt(S.alinpaino) + ' kg'],
    ['Viimeisin', fmt(S.viimeisin) + ' kg'],
    ['Pudotettu alusta', fmt(S.pudotettuAlusta) + ' kg'],
    ['Eniten pudotettu', fmt(S.enitenPudotettu) + ' kg'],
    ['Nousua alimmasta', fmt(S.nousuaAlimmasta) + ' kg'],
    ['Seurattu', S.paivat + ' päivää'],
    ['Keskimäärin', fmt(S.viikottain) + ' kg / vko'],
  ];
  var kc = $('#kortit');
  if (kc) {
    kc.innerHTML = kortit.map(function (k) {
      return '<div class="card"><div class="n">' + esc(k[1]) + '</div><div class="l">' + esc(k[0]) + '</div></div>';
    }).join('');
  }

  /* ---- Painokaavio ---- */
  function lineChart(svgId, series, opts) {
    var svg = $(svgId);
    if (!svg) return;
    var W = 900, H = opts.h || 320;
    var padL = 56, padR = 20, padT = 20, padB = 34;
    var iw = W - padL - padR, ih = H - padT - padB;
    var vals = series.reduce(function (acc, s) {
      return acc.concat(s.values.filter(function (v) { return v != null; }));
    }, []);
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (opts.min != null) min = Math.min(min, opts.min);
    if (opts.max != null) max = Math.max(max, opts.max);
    var span = (max - min) || 1;
    min -= span * 0.08; max += span * 0.08; span = max - min;
    var all = series.reduce(function (acc, s) { return acc.concat(s.values.map(function (v, i) { return i; })); }, []);
    var n = Math.max.apply(null, all) + 1;

    function x(i) { return padL + (n <= 1 ? 0 : (i / (n - 1)) * iw); }
    function y(v) { return padT + ih - ((v - min) / span) * ih; }

    var out = '';
    // ruudukko
    var steps = 6;
    for (var g = 0; g <= steps; g++) {
      var v = min + (span * g) / steps;
      out += '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) +
        '" stroke="rgba(255,255,255,.12)" stroke-width="1"/>';
      out += '<text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" fill="#A79C8F" font-size="11" ' +
        'text-anchor="end" font-family="Public Sans, sans-serif">' + v.toFixed(0) + '</text>';
    }
    // x-akseli: vuoden vaihdat
    var t = 0;
    for (var i = 0; i < n; i++) {
      var d = series[0].dates && series[0].dates[i];
      if (!d) continue;
      var month = new Date(d).getMonth();
      if (month === 0 && i > 0) {
        out += '<text x="' + x(i) + '" y="' + (H - 12) + '" fill="#A79C8F" font-size="11" ' +
          'text-anchor="middle" font-family="Public Sans, sans-serif">' + new Date(d).getFullYear() + '</text>';
      }
    }
    // viivat
    series.forEach(function (s) {
      var pts = [];
      s.values.forEach(function (v, i) {
        if (v != null) pts.push(x(i) + ',' + y(v));
      });
      if (pts.length > 1) {
        out += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color +
          '" stroke-width="' + (s.width || 2.5) + '" stroke-linejoin="round" stroke-linecap="round"/>';
      }
    });
    // alin kohta
    if (opts.markMin && series[0].values.length) {
      var mi = 0, mv = Infinity;
      series[0].values.forEach(function (v, i) { if (v != null && v < mv) { mv = v; mi = i; } });
      out += '<circle cx="' + x(mi) + '" cy="' + y(mv) + '" r="5" fill="#C9772A"/>' +
        '<text x="' + x(mi) + '" y="' + (y(mv) - 10) + '" fill="#E8A371" font-size="12" ' +
        'text-anchor="middle" font-weight="600" font-family="Archivo, sans-serif">' + fmt(mv) + ' kg</text>';
    }
    svg.innerHTML = out;
  }

  var data = (D.data || []).slice().sort(function (a, b) { return a.pvm < b.pvm ? -1 : 1; });
  var alinIdx = 0;
  data.forEach(function (r, i) { if (r.kg < data[alinIdx].kg) alinIdx = i; });

  lineChart('#painokaavio', [
    { values: data.map(function (r) { return r.kg; }), dates: data.map(function (r) { return r.pvm; }),
      color: '#E8A371', width: 2.2 },
    { values: data.map(function (r, i) {
        // kuukausikeskiarvo tähän päivään asti
        var kk = r.pvm.slice(0, 7);
        var vals = [];
        for (var j = 0; j <= i; j++) if (data[j].pvm.slice(0, 7) === kk) vals.push(data[j].kg);
        return vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : null;
      }), color: '#8FD0D4', width: 3 },
  ], { min: 88, max: 150, markMin: true, h: 320 });

  lineChart('#bmikaavio', [
    { values: data.map(function (r) { return r.bmi; }), color: '#E8A371', width: 2.5 },
    { values: data.map(function (r) { return r.rasva; }), color: '#8FD0D4', width: 2.5 },
  ], { min: 20, max: 46, h: 280 });

  /* ---- Merkkipaalut ---- */
  var ms = $('#milestones');
  if (ms && S.merkkipaalut) {
    ms.innerHTML = S.merkkipaalut.map(function (m) {
      return '<li>' +
        '<span class="ms-n">' + esc(m.tavoite) + '</span>' +
        '<div><h3>' + esc(m.tavoite) + ' kg pudotettu</h3>' +
        '<p>' + pvmFi(m.pvm) + ' · paino ' + fmt(m.kg) + ' kg</p></div>' +
        '</li>';
    }).join('');
  }

  /* ---- Kuukaudet ---- */
  var ktb = $('#kk-tbody');
  if (ktb && S.kuukaudetData) {
    ktb.innerHTML = S.kuukaudetData.map(function (k) {
      var muutos = k.loppu - k.alku;
      var cls = muutos < 0 ? 'down' : (muutos > 0 ? 'up' : '');
      var merkki = muutos < 0 ? '−' : (muutos > 0 ? '+' : '±');
      var kkNimi = new Date(k.kk + '-01').toLocaleDateString('fi-FI', { month: 'long', year: 'numeric' });
      return '<tr>' +
        '<td>' + kkNimi + '</td>' +
        '<td class="mono">' + k.kpl + '</td>' +
        '<td class="mono">' + fmt(k.keskiarvo) + ' kg</td>' +
        '<td class="mono">' + fmt(k.alku) + ' kg</td>' +
        '<td class="mono">' + fmt(k.loppu) + ' kg</td>' +
        '<td class="mono ' + cls + '">' + merkki + fmt(Math.abs(muutos)).replace('.', ',') + ' kg</td>' +
        '</tr>';
    }).join('');
  }

  /* ---- Raakadata ---- */
  var COLS = [
    ['pvm', 'Päivämäärä'], ['kg', 'Paino (kg)'], ['pudotus', 'Pudotus'], ['pudotusYht', 'Yhteensä'],
    ['bmi', 'BMI'], ['rasva', 'Rasva (%)'], ['luustolihas', 'Luustolihas'], ['lihasmassa', 'Lihasmassa'],
    ['viscera', 'Viskeraalinen rasva'], ['perusaineenv', 'Perusaineenvaihdunta'], ['neste', 'Nestetasapaino'],
  ];
  var thead = $('#data-thead');
  var tbody = $('#data-tbody');
  if (thead && tbody) {
    function renderHead(kunta) {
      var cols = COLS;
      if (kunta === 'perus') cols = COLS.slice(0, 5);
      if (kunta === 'koostumus') cols = [COLS[0], COLS[5], COLS[6], COLS[7], COLS[8]];
      thead.innerHTML = '<tr>' + cols.map(function (c) {
        return '<th>' + esc(c[1]) + '</th>';
      }).join('') + '</tr>';
      renderBody(kunta);
    }
    function renderBody(kunta) {
      var q = ($('#q').value || '').trim().toLowerCase();
      var cols = COLS;
      if (kunta === 'perus') cols = COLS.slice(0, 5);
      if (kunta === 'koostumus') cols = [COLS[0], COLS[5], COLS[6], COLS[7], COLS[8]];
      var out = data.filter(function (r) {
        if (!q) return true;
        return cols.some(function (c) {
          return String(r[c[0]] == null ? '' : r[c[0]]).toLowerCase().indexOf(q) >= 0;
        }) || r.pvm.indexOf(q) >= 0;
      });
      tbody.innerHTML = out.map(function (r) {
        return '<tr>' + cols.map(function (c) {
          var v = r[c[0]];
          if (c[0] === 'pvm') return '<td class="mono">' + pvmFi(v) + '</td>';
          return '<td class="mono">' + fmt(v) + '</td>';
        }).join('') + '</tr>';
      }).join('');
      var tm = $('#tulosmaara');
      if (tm) tm.textContent = out.length + ' / ' + data.length + ' punnerrusta';
    }
    var q = $('#q'), fk = $('#fKunta');
    if (q) q.addEventListener('input', function () { renderBody(fk.value); });
    if (fk) fk.addEventListener('change', function () { renderHead(fk.value); });
    renderHead('');

    var csv = $('#csv');
    if (csv) {
      csv.addEventListener('click', function () {
        var head = ['Päivämäärä', 'Paino (kg)', 'Pudotus', 'Pudotus yhteensä', 'BMI', 'Rasva (%)',
          'Luustolihasmassa', 'Lihasmassa', 'Viskeraalinen rasva', 'Perusaineenvaihdunta', 'Nestetasapaino'];
        var lines = [head.join(';')];
        data.forEach(function (r) {
          lines.push([
            r.pvm, r.kg, r.pudotus, r.pudotusYht, r.bmi, r.rasva,
            r.luustolihas, r.lihasmassa, r.viscera, r.perusaineenv, r.neste
          ].map(function (v) {
            return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
          }).join(';'));
        });
        var blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'jk-kuntoilee-painotus.csv';
        a.click();
      });
    }
  }
})();
