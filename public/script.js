// ARR Official REST API — script.js
// Frontend auto-render dari /api/endpoints

document.addEventListener('DOMContentLoaded', function () {

  // Clock
  function updateTime() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const s = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('jam').textContent = h+':'+m+':'+s;
  }
  function updateDate() {
    const now = new Date();
    const d = now.getDate().toString().padStart(2, '0');
    const mo = (now.getMonth()+1).toString().padStart(2,'0');
    const y = now.getFullYear();
    document.getElementById('tanggal').textContent = d+'/'+mo+'/'+y;
  }
  updateTime(); updateDate();
  setInterval(updateTime, 1000);

  // Copy Code
  const copyBtn = document.getElementById('copyButton');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(document.getElementById('codeBlock').innerText).then(() => {
        showToast('Kode berhasil disalin');
        this.textContent = 'Copied!';
        setTimeout(() => { this.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'; }, 2000);
      });
    });
  }

  // Copy Dana
  const danaBtn = document.getElementById('copyDanaBtn');
  if (danaBtn) {
    danaBtn.addEventListener('click', function () {
      navigator.clipboard.writeText('085262562560').then(() => {
        showToast('Nomor Dana disalin');
        this.textContent = 'Tersalin!';
        setTimeout(() => { this.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2v1"/></svg> Salin Nomor'; }, 2000);
      });
    });
  }

  // Auto-render endpoints
  loadEndpoints();
});

async function loadEndpoints() {
  const container = document.getElementById('accordion-container');
  const statEl = document.getElementById('stat-endpoints');

  try {
    const res = await fetch('/api/endpoints');
    const data = await res.json();

    if (statEl) statEl.textContent = data.totalEndpoints;

    container.innerHTML = '';
    data.categories.forEach(function(cat, i) {
      var accId = 'acc-auto-' + i;
      var hasEp = cat.endpoints && cat.endpoints.length > 0;
      var countText = hasEp ? cat.endpoints.length + ' endpoint' + (cat.endpoints.length > 1 ? 's' : '') : 'Coming soon';

      var cardsHTML = '';
      if (hasEp) {
        cardsHTML = '<div class="endpoint-grid">' + cat.endpoints.map(function(ep) {
          var paramsHTML = '';
          if (ep.params && ep.params.length > 0) {
            paramsHTML = '<div class="ep-params">' + ep.params.map(function(p) {
              return '<span class="ep-param ' + (p.required ? 'required' : 'optional') + '"><span class="param-name">' + p.name + '</span><span class="param-badge">' + (p.required ? 'required' : 'optional') + '</span></span>';
            }).join('') + '</div>';
          }
          return '<div class="ep-card"><div class="ep-head"><span class="ep-method">' + ep.method + '</span><code class="ep-path">' + ep.path + '</code></div><p class="ep-desc">' + ep.desc + '</p>' + paramsHTML + '<a href="' + ep.tryUrl + '" target="_blank" class="ep-try">Try It <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></a></div>';
        }).join('') + '</div>';
      } else {
        cardsHTML = '<div class="coming-soon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><p>Segera hadir</p></div>';
      }

      var accEl = document.createElement('div');
      accEl.className = 'accordion';
      accEl.id = accId;
      accEl.innerHTML = '<button class="acc-header" onclick="toggleAcc(\''+accId+'\')">'
        + '<div class="acc-left"><span class="acc-num">'+String(i+1).padStart(2,'0')+'</span>'
        + '<div><span class="acc-title">'+cat.category+'</span><span class="acc-count">'+countText+'</span></div></div>'
        + '<div class="acc-right"><span class="acc-tag">'+cat.tag+'</span>'
        + '<svg class="acc-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
        + '</div></button>'
        + '<div class="acc-body">'+cardsHTML+'</div>';
      container.appendChild(accEl);
    });

  } catch(err) {
    console.error('Gagal load endpoints:', err);
    container.innerHTML = '<div class="coming-soon" style="padding:40px"><p>Gagal memuat daftar endpoint</p></div>';
  }
}

function toggleAcc(accId) {
  var acc = document.getElementById(accId);
  var body = acc.querySelector('.acc-body');
  if (acc.classList.contains('open')) {
    body.classList.remove('open');
    acc.classList.remove('open');
  } else {
    body.classList.add('open');
    acc.classList.add('open');
  }
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2200);
}
