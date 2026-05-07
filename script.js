// === MULTI-TIME ===
const urlParams = new URLSearchParams(window.location.search);
let timeId = urlParams.get('time');

if (!timeId) {
  timeId = 'time_' + Date.now();
  history.replaceState(null, '', '?time=' + timeId);
}

let todosTimes = JSON.parse(localStorage.getItem('todos_times')) || {};
if (!todosTimes[timeId]) {
  todosTimes[timeId] = {
    id: timeId,
    nome: 'Time ' + (Object.keys(todosTimes).length + 1),
    jogadores: [],
    criado: Date.now(),
    atualizado: Date.now()
  };
}

// USA SÓ ESSE ARRAY
let jogadores = todosTimes[timeId].jogadores;
let nextId = 1;

function salvar() {
  todosTimes[timeId].jogadores = jogadores;
  todosTimes[timeId].atualizado = Date.now();
  localStorage.setItem('todos_times', JSON.stringify(todosTimes));
}

// Mostra nome do time no header quando carregar
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.app-header h1').textContent = todosTimes[timeId].nome;
});
// === FIM MULTI-TIME ===

// ── SENHAS ─────────────────────────────────────────────────────────────────
const SENHA_MESTRE = '130162';
let senhaAcesso = localStorage.getItem('tatica_senha') || '0905';

// ── STATE ──────────────────────────────────────────────────────────────────
let selectedPlayerId = null;
let fDragEl = null;
let fOffX = 0, fOffY = 0;
let startX = 0, startY = 0;

// ── LOGIN ──────────────────────────────────────────────────────────────────
let loginEntry = '';
function renderLoginDots() {
  const c = document.getElementById('login-dots');
  c.innerHTML = '';
  for (let i = 0; i < senhaAcesso.length; i++) {
    const d = document.createElement('div');
    d.className = 'pin-dot' + (i < loginEntry.length? ' filled' : '');
    c.appendChild(d);
  }
}
function loginPress(digit) {
  if (loginEntry.length >= senhaAcesso.length) return;
  loginEntry += digit;
  renderLoginDots();
  if (loginEntry.length === senhaAcesso.length) {
    setTimeout(() => {
      if (loginEntry === senhaAcesso) {
        document.querySelectorAll('#login-dots.pin-dot').forEach(d => d.classList.add('success'));
        document.getElementById('login-msg').textContent = 'Acesso liberado!';
        document.getElementById('login-msg').className = 'pin-msg success';
        setTimeout(() => {
          document.getElementById('login-screen').classList.add('hidden');
          document.querySelector('.app').classList.remove('hidden');
          renderAll();
        }, 500);
      } else {
        document.querySelectorAll('#login-dots.pin-dot').forEach(d => d.classList.add('error'));
        document.getElementById('login-msg').textContent = 'Senha incorreta';
        document.getElementById('login-msg').className = 'pin-msg error';
        setTimeout(() => {
          loginEntry = '';
          renderLoginDots();
          document.getElementById('login-msg').textContent = '';
          document.getElementById('login-msg').className = 'pin-msg';
        }, 900);
      }
    }, 100);
  }
}
function loginDel() {
  loginEntry = loginEntry.slice(0, -1);
  renderLoginDots();
  document.getElementById('login-msg').textContent = '';
}

// ── CHANGE PASSWORD ────────────────────────────────────────────────────────
let changeStep = 'master';
let changeEntry = '', newSenhaTemp = '';
const STEP_LEN = { master: SENHA_MESTRE.length, new: 4, confirm: 4 };
function renderChangeDots() {
  const c = document.getElementById('change-dots');
  c.innerHTML = '';
  for (let i = 0; i < STEP_LEN[changeStep]; i++) {
    const d = document.createElement('div');
    d.className = 'pin-dot' + (i < changeEntry.length? ' filled' : '');
    c.appendChild(d);
  }
}
function openChangePassword() {
  changeStep = 'master'; changeEntry = ''; newSenhaTemp = '';
  document.getElementById('change-icon').textContent = '🔐';
  document.getElementById('change-subtitle').textContent = 'Digite a senha mestre para confirmar';
  document.getElementById('change-msg').textContent = '';
  document.getElementById('change-msg').className = 'pin-msg';
  renderChangeDots();
  document.getElementById('change-screen').classList.remove('hidden');
}
function closeChangePassword() {
  document.getElementById('change-screen').classList.add('hidden');
}
function changePress(digit) {
  if (changeEntry.length >= STEP_LEN[changeStep]) return;
  changeEntry += digit;
  renderChangeDots();
  if (changeEntry.length === STEP_LEN[changeStep]) setTimeout(() => checkChangeStep(), 150);
}
function changeDel() {
  changeEntry = changeEntry.slice(0, -1);
  renderChangeDots();
  document.getElementById('change-msg').textContent = '';
}
function checkChangeStep() {
  const msg = document.getElementById('change-msg');
  if (changeStep === 'master') {
    if (changeEntry === SENHA_MESTRE) {
      changeStep = 'new'; changeEntry = '';
      document.getElementById('change-icon').textContent = '🆕';
      document.getElementById('change-subtitle').textContent = 'Digite a nova senha (4 dígitos)';
      msg.textContent = ''; renderChangeDots();
    } else {
      errorShake('change-dots'); msg.className = 'pin-msg error'; msg.textContent = 'Senha mestre incorreta';
      setTimeout(() => { changeEntry = ''; renderChangeDots(); msg.textContent = ''; }, 900);
    }
  } else if (changeStep === 'new') {
    newSenhaTemp = changeEntry; changeStep = 'confirm'; changeEntry = '';
    document.getElementById('change-icon').textContent = '✅';
    document.getElementById('change-subtitle').textContent = 'Confirme a nova senha';
    msg.textContent = ''; renderChangeDots();
  } else if (changeStep === 'confirm') {
    if (changeEntry === newSenhaTemp) {
      senhaAcesso = newSenhaTemp;
      localStorage.setItem('tatica_senha', senhaAcesso);
      msg.className = 'pin-msg success'; msg.textContent = '✅ Senha alterada com sucesso!';
      document.querySelectorAll('#change-dots.pin-dot').forEach(d => { d.classList.remove('filled'); d.classList.add('success'); });
      setTimeout(() => closeChangePassword(), 1500);
    } else {
      errorShake('change-dots'); msg.className = 'pin-msg error'; msg.textContent = 'Senhas não coincidem. Tente de novo.';
      setTimeout(() => {
        changeStep = 'new'; changeEntry = ''; newSenhaTemp = '';
        document.getElementById('change-icon').textContent = '🆕';
        document.getElementById('change-subtitle').textContent = 'Digite a nova senha (4 dígitos)';
        msg.textContent = ''; renderChangeDots();
      }, 1000);
    }
  }
}
function errorShake(dotsId) {
  document.querySelectorAll('#' + dotsId + '.pin-dot').forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
  setTimeout(() => document.querySelectorAll('#' + dotsId + '.pin-dot').forEach(d => d.classList.remove('error')), 700);
}

// ── FORMATIONS ─────────────────────────────────────────────────────────────
const FORMATIONS = {
  "4-4-2": [[1,[50]],[4,[20,38,62,80]],[4,[20,38,62,80]],[2,[35,65]]],
  "4-3-3": [[1,[50]],[4,[20,38,62,80]],[3,[28,50,72]],[3,[25,50,75]]],
  "4-2-3-1": [[1,[50]],[4,[20,38,62,80]],[2,[35,65]],[3,[25,50,75]],[1,[50]]],
  "4-5-1": [[1,[50]],[4,[20,38,62,80]],[5,[16,31,50,69,84]],[1,[50]]],
  "3-5-2": [[1,[50]],[3,[28,50,72]],[5,[16,31,50,69,84]],[2,[35,65]]],
  "3-4-3": [[1,[50]],[3,[28,50,72]],[4,[20,38,62,80]],[3,[25,50,75]]],
  "5-3-2": [[1,[50]],[5,[16,31,50,69,84]],[3,[28,50,72]],[2,[35,65]]],
  "5-4-1": [[1,[50]],[5,[16,31,50,69,84]],[4,[20,38,62,80]],[1,[50]]],
  "4-1-4-1": [[1,[50]],[4,[20,38,62,80]],[1,[50]],[4,[20,38,62,80]],[1,[50]]],
  "4-3-2-1": [[1,[50]],[4,[20,38,62,80]],[3,[28,50,72]],[2,[35,65]],[1,[50]]]
};

function getFormationPositions(key) {
  const lines = FORMATIONS[key];
  if (!lines) return [];
  const n = lines.length;
  const top = 0.08, bot = 0.92, span = bot - top;
  return lines.flatMap(([,xs], li) => xs.map(x => ({
    x: x,
    y: (bot - (li/(n-1))*span) * 100
  })));
}

// ── FIELD MANAGEMENT ───────────────────────────────────────────────────────
function changeFormation() {
  const key = document.getElementById('formation-select').value;
  const positions = getFormationPositions(key);
  const emCampo = jogadores.filter(p => p.emCampo);

  emCampo.forEach((p, i) => {
    if (positions[i]) {
      p.x = positions[i].x;
      p.y = positions[i].y;
    }
  });

  salvar();
  renderField();
}

function selectPlayerOnField(playerId) {
  selectedPlayerId = playerId;
  const player = jogadores.find(p => p.id === playerId);
  const input = document.getElementById('edit-name-input');
  const btn = document.getElementById('save-name-btn');

  if (player) {
    input.value = player.name;
    input.disabled = false;
    btn.disabled = false;
    input.focus();
  }

  document.querySelectorAll('.field-player').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.id) === playerId);
  });
}

function savePlayerName() {
  if (!selectedPlayerId) return;
  const player = jogadores.find(p => p.id === selectedPlayerId);
  const newName = document.getElementById('edit-name-input').value.trim();
  if (player && newName) {
    player.name = newName;
    salvar();
    renderAll();
    document.getElementById('edit-name-input').value = '';
    document.getElementById('edit-name-input').disabled = true;
    document.getElementById('save-name-btn').disabled = true;
    selectedPlayerId = null;
  }
}

function togglePlayerStatus(playerId) {
  const player = jogadores.find(p => p.id === playerId);
  if (!player) return;

  if (player.status === 'faltou') {
    player.status = 'indefinido';
    player.emCampo = false;
    player.x = null;
    player.y = null;
  } else {
    player.status = 'faltou';
    player.emCampo = false;
    player.x = null;
    player.y = null;
  }

  salvar();
  renderAll();
}

function sendToBench(playerId) {
  const player = jogadores.find(p => p.id === playerId);
  if (player) {
    player.emCampo = false;
    player.x = null;
    player.y = null;
    salvar();
    renderAll();
  }
}

function posicionarMenu(menu, x, y) {
  const menuW = 170;
  const menuH = 100;
  const padding = 10;

  if (x + menuW > window.innerWidth - padding) {
    x = window.innerWidth - menuW - padding;
  }
  if (x < padding) x = padding;
  if (y + menuH > window.innerHeight - padding) {
    y = window.innerHeight - menuH - padding;
  }
  if (y < padding) y = padding;

  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function showContextMenu(e, playerId) {
  e.preventDefault();
  e.stopPropagation();
  const oldMenu = document.getElementById('context-menu');
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.innerHTML = `
    <div class="context-item" onclick="sendToBench(${playerId}); closeContextMenu();">
      📤 Enviar pro banco
    </div>
    <div class="context-item" onclick="togglePlayerStatus(${playerId}); closeContextMenu();">
      ❌ Marcar ausente
    </div>
  `;

  const x = e.clientX || (e.touches && e.touches[0].clientX);
  const y = e.clientY || (e.touches && e.touches[0].clientY);

  document.body.appendChild(menu);
  posicionarMenu(menu, x, y);

  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  }, 10);
}

function closeContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.remove();
}

// ── DRAG & DROP ────────────────────────────────────────────────────────────
function allowDrop(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) {
  ev.currentTarget.classList.remove('drag-over');
}

function dropNoCampo(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');

  const id = parseInt(ev.dataTransfer.getData("text/plain"));
  const player = jogadores.find(p => p.id === id);

  if (!player || player.emCampo || player.status === 'faltou') return;

  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou').length;
  if (emCampo >= 11) {
    alert('Máximo de 11 jogadores em campo!');
    return;
  }

  const clientX = ev.clientX || (ev.changedTouches && ev.changedTouches[0].clientX);
  const clientY = ev.clientY || (ev.changedTouches && ev.changedTouches[0].clientY);

  if (!clientX ||!clientY) return;

  const rect = ev.currentTarget.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;

  player.x = Math.max(5, Math.min(95, x));
  player.y = Math.max(5, Math.min(95, y));
  player.emCampo = true;

  salvar();
  renderAll();
}

function dropToBench(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  ev.currentTarget.classList.remove('drag-over');

  const playerId = parseInt(ev.dataTransfer.getData("text/plain"));
  const player = jogadores.find(p => p.id === playerId);

  if (player) {
    player.emCampo = false;
    player.x = null;
    player.y = null;
    salvar();
    renderAll();
  }
}

function dropToAusentes(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');

  const playerId = parseInt(ev.dataTransfer.getData("text/plain"));
  const player = jogadores.find(p => p.id === playerId);

  if (player) {
    player.emCampo = false;
    player.x = null;
    player.y = null;
    player.status = 'faltou';
    salvar();
    renderAll();
  }
}

// ── PLAYERS ────────────────────────────────────────────────────────────────
function addPlayer() {
  const inputName = document.getElementById('new-player-input');
  const inputNumber = document.getElementById('new-player-number');
  const name = inputName.value.trim();
  const number = parseInt(inputNumber.value);

  if (!name) {
    alert('Digite o nome do jogador');
    return;
  }

  if (!number || number < 1 || number > 99) {
    alert('Digite um número de camisa válido entre 1 e 99');
    return;
  }

  if (jogadores.some(p => p.number === number)) {
    alert('Já existe um jogador com a camisa ' + number);
    return;
  }

  jogadores.push({
    id: nextId++,
    name: name,
    number: number,
    status: 'indefinido',
    emCampo: false,
    x: null,
    y: null
  });

  inputName.value = '';
  inputNumber.value = '';
  salvar();
  renderAll();
  inputName.focus();
}

document.getElementById('new-player-number').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('new-player-input').focus();
});

document.getElementById('new-player-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addPlayer();
});

function removePlayer(id) {
  if (!confirm('Remover jogador?')) return;
  jogadores = jogadores.filter(p => p.id!== id);
  salvar();
  renderAll();
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── RENDER ─────────────────────────────────────────────────────────────────
function renderAll() {
  renderField();
  renderBench();
  renderAusentes();
}

function renderField() {
  const fp = document.getElementById('field-players');
  fp.innerHTML = '';

  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou');

  emCampo.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'field-player' + (i === 0? ' gk' : '');
    el.dataset.id = p.id;
    el.draggable = true;

    if (p.x == null || p.y == null) {
      p.x = 50;
      p.y = 80;
    }

    el.style.left = p.x + '%';
    el.style.top = p.y + '%';

    el.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', String(p.id));
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setDragImage(el, 25, 25);
      el.classList.add('is-dragging');
    };
    el.ondragend = (e) => {
      el.classList.remove('is-dragging');
    };

    el.onclick = (e) => {
      e.stopPropagation();
      selectPlayerOnField(p.id);
    };

    el.oncontextmenu = (e) => {
      showContextMenu(e, p.id);
    };

    let pressTimer;
    el.ontouchstart = (e) => {
      pressTimer = setTimeout(() => {
        showContextMenu(e, p.id);
      }, 500);
    };
    el.ontouchend = () => clearTimeout(pressTimer);
    el.ontouchmove = () => clearTimeout(pressTimer);

    el.innerHTML = `
      <div class="field-dot">${p.number || i + 1}</div>
      <div class="field-name">${esc(p.name)}</div>
    `;

    attachFieldDrag(el);
    fp.appendChild(el);
  });

  if (!emCampo.length) {
    fp.innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:rgba(255,255,255,.4);font-size:13px;font-weight:600;pointer-events:none;">Arraste jogadores<br>do banco pra cá</div>`;
  }
}

function renderBench() {
  const bench = document.getElementById('bench-list');
  if (!bench) return;

  const banco = jogadores.filter(p =>!p.emCampo && p.status!== 'faltou');

  bench.innerHTML = banco.length? banco.map(p => `
    <div class="bench-chip" draggable="true" data-id="${p.id}"
         ondragstart="event.dataTransfer.setData('text/plain', '${p.id}'); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setDragImage(event.target, 10, 10);">
      <span class="status-btn indefinido"></span>
      ${p.number? '#' + p.number + ' ' : ''}${esc(p.name)}
      <button class="btn-remove" onclick="removePlayer(${p.id})">✕</button>
    </div>
  `).join('') : '<span class="bench-empty">Banco vazio</span>';

  document.querySelectorAll('#bench-list.bench-chip').forEach(el => {
    const playerId = parseInt(el.dataset.id);
    el.oncontextmenu = (e) => showContextMenuBench(e, playerId);
    let pressTimer;
    el.ontouchstart = (e) => {
      pressTimer = setTimeout(() => showContextMenuBench(e, playerId), 500);
    };
    el.ontouchend = () => clearTimeout(pressTimer);
    el.ontouchmove = () => clearTimeout(pressTimer);
  });
}

function renderAusentes() {
  const ausentes = document.getElementById('ausentes-list');
  const faltaram = jogadores.filter(p => p.status === 'faltou');

  ausentes.innerHTML = faltaram.length? faltaram.map(p => `
    <div class="bench-chip ausente" draggable="true" data-id="${p.id}"
         ondragstart="event.dataTransfer.setData('text/plain', '${p.id}'); event.dataTransfer.effectAllowed = 'move';">
      <span class="status-btn faltou"></span>
      <span class="player-name">${p.number? '#' + p.number + ' ' : ''}${esc(p.name)}</span>
      <button class="btn-action" onclick="voltarProBanco(${p.id})">Banco</button>
      <button class="btn-remove" onclick="removePlayer(${p.id})">✕</button>
    </div>
  `).join('') : '<span class="bench-empty">Todos presentes</span>';
}

function showContextMenuBench(e, playerId) {
  e.preventDefault();
  e.stopPropagation();
  const oldMenu = document.getElementById('context-menu');
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.innerHTML = `
    <div class="context-item" onclick="togglePlayerStatus(${playerId}); closeContextMenu();">
      ❌ Marcar ausente
    </div>
  `;

  const x = e.clientX || (e.touches && e.touches[0].clientX);
  const y = e.clientY || (e.touches && e.touches[0].clientY);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  }, 10);
}

function voltarProBanco(playerId) {
  const player = jogadores.find(p => p.id === playerId);
  if (player) {
    player.status = 'indefinido';
    player.emCampo = false;
    player.x = null;
    player.y = null;
    salvar();
    renderAll();
  }
}

// ── FIELD DRAG LIVRE ───────────────────────────────────────────────────────
function attachFieldDrag(el) {
  el.dataset.moved = 'false';

  el.addEventListener('mousedown', e => {
    if (e.button!== 0) return;
    e.preventDefault();
    e.stopPropagation();

    fDragEl = el;
    fDragEl.classList.add('is-dragging');

    const r = document.getElementById('pitch-container').getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    fOffX = e.clientX - r.left - parseFloat(fDragEl.style.left)/100 * r.width;
    fOffY = e.clientY - r.top - parseFloat(fDragEl.style.top) /100 * r.height;
  });

  el.addEventListener('touchstart', e => {
    e.stopPropagation();
    fDragEl = el;
    fDragEl.classList.add('is-dragging');

    const r = document.getElementById('pitch-container').getBoundingClientRect();
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    fOffX = t.clientX - r.left - parseFloat(fDragEl.style.left)/100 * r.width;
    fOffY = t.clientY - r.top - parseFloat(fDragEl.style.top) /100 * r.height;
  }, { passive: false });
}

function saveFieldPosition(el) {
  const id = parseInt(el.dataset.id);
  const player = jogadores.find(p => p.id === id);
  if (player) {
    player.x = parseFloat(el.style.left);
    player.y = parseFloat(el.style.top);
    salvar();
  }
}

document.addEventListener('mousemove', e => {
  if (!fDragEl) return;
  const moved = Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3;
  if (moved) fDragEl.dataset.moved = 'true';

  const pitch = document.getElementById('pitch-container');
  const r = pitch.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;

  if (inside) {
    e.preventDefault();
    const x = ((e.clientX - r.left - fOffX) / r.width) * 100;
    const y = ((e.clientY - r.top - fOffY) / r.height) * 100;
    fDragEl.style.left = Math.max(5, Math.min(95, x)) + '%';
    fDragEl.style.top = Math.max(5, Math.min(95, y)) + '%';
  }
});

document.addEventListener('touchmove', e => {
  if (!fDragEl) return;
  const t = e.touches[0];
  const moved = Math.abs(t.clientX - startX) > 3 || Math.abs(t.clientY - startY) > 3;
  if (moved) fDragEl.dataset.moved = 'true';

  const pitch = document.getElementById('pitch-container');
  const r = pitch.getBoundingClientRect();
  const inside = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;

  if (inside) {
    e.preventDefault();
    const x = ((t.clientX - r.left - fOffX) / r.width) * 100;
    const y = ((t.clientY - r.top - fOffY) / r.height) * 100;
    fDragEl.style.left = Math.max(5, Math.min(95, x)) + '%';
    fDragEl.style.top = Math.max(5, Math.min(95, y)) + '%';
  }
}, { passive: false });

document.addEventListener('mouseup', e => {
  if (fDragEl) {
    fDragEl.classList.remove('is-dragging');
    if (fDragEl.dataset.moved === 'true') {
      const pitch = document.getElementById('pitch-container');
      const r = pitch.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside) saveFieldPosition(fDragEl);
    }
    fDragEl.dataset.moved = 'false';
    fDragEl = null;
  }
});

document.addEventListener('touchend', e => {
  if (fDragEl) {
    fDragEl.classList.remove('is-dragging');
    if (fDragEl.dataset.moved === 'true') {
      const pitch = document.getElementById('pitch-container');
      const r = pitch.getBoundingClientRect();
      const t = e.changedTouches[0];
      const inside = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
      if (inside) saveFieldPosition(fDragEl);
    }
    fDragEl.dataset.moved = 'false';
    fDragEl = null;
  }
});

// ── INIT ──────────────────────────────────────────────────────────────────
try {
  const si = localStorage.getItem('tatica_nextId'); if (si) nextId = parseInt(si);
  const sf = localStorage.getItem('tatica_formation'); if (sf) document.getElementById('formation-select').value = sf;
} catch(e) {}

document.getElementById('formation-select').addEventListener('change', () => {
  changeFormation();
});

window.onload = function() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.querySelector('.app').classList.add('hidden');
  renderLoginDots();
  renderAll();
};

renderLoginDots();
