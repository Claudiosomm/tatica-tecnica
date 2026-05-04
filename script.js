// ── SENHAS ─────────────────────────────────────────────────────────────────
const SENHA_MESTRE = '130162';
let senhaAcesso = localStorage.getItem('tatica_senha') || '0905';

// ── STATE ──────────────────────────────────────────────────────────────────
let players = [], nextId = 1, dragSrcIndex = null;
let fSelected = null, fDragEl = null, fOffX = 0, fOffY = 0, fTouchMoved = false;
let isNativeDrag = false;
let lastTap = 0;
let longPressTimer = null, longPressEl = null, touchReadyToDrag = false;

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
        document.getElementById('login-screen').classList.add('hidden');
      } else {
        document.querySelectorAll('#login-dots.pin-dot').forEach(d => { d.classList.remove('filled'); d.classList.add('error'); });
        document.getElementById('login-msg').textContent = 'Senha incorreta';
        setTimeout(() => { loginEntry = ''; renderLoginDots(); document.getElementById('login-msg').textContent = ''; }, 900);
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
let changeStep = 'master', changeEntry = '', newSenhaTemp = '';
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

// ── TABS ───────────────────────────────────────────────────────────────────
function switchTab(tab, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');
  if (tab === 'campo') renderField();
}

// ── STATUS VEIO/FALTOU ─────────────────────────────────────────────────────
function toggleStatus(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;
  const estados = ['indefinido', 'veio', 'faltou'];
  let atual = player.status || 'indefinido';
  player.status = estados[(estados.indexOf(atual) + 1) % 3];
  saveData();
  renderPlayerList();
  renderField();
}

// ── PLAYERS ────────────────────────────────────────────────────────────────
function addPlayer() {
  const input = document.getElementById('new-player-input');
  const name = input.value.trim();
  if (!name) return;
  players.push({
    id: nextId++,
    name: name,
    status: 'indefinido',
    emCampo: false,
    x: 50,
    y: 50
  });
  input.value = '';
  renderPlayerList();
  saveData();
  input.focus();
}
document.getElementById('new-player-input').addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });

function removePlayer(id) {
  players = players.filter(p => p.id!== id);
  renderPlayerList();
  renderField();
  saveData();
}

function updatePlayerName(id, name) {
  const p = players.find(p => p.id === id);
  if (p) p.name = name;
  updateFieldNames();
  saveData();
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderPlayerList() {
  const list = document.getElementById('player-list');
  if (!players.length) {
    list.innerHTML = '<div class="empty-msg">Nenhum jogador. Adicione acima ☝️</div>';
    return;
  }
  list.innerHTML = players.map((p, i) => `
    <div class="player-item" draggable="true" data-index="${i}" data-status="${p.status || 'indefinido'}"
         ondragstart="dragStart(event,${i})" ondragover="dragOver(event,${i})"
         ondragend="dragEnd()" ondrop="drop(event,${i})">
      <span class="status-btn ${p.status || 'indefinido'}" onclick="toggleStatus(${p.id})"></span>
      <span class="player-num">${i+1}</span>
      <input class="player-name-input" type="text" value="${esc(p.name)}"
        placeholder="Nome..." oninput="updatePlayerName(${p.id},this.value)"
        autocomplete="off" autocorrect="off" spellcheck="false">
      <button class="btn-remove" onclick="removePlayer(${p.id})">✕</button>
    </div>`).join('');
}

// ── DRAG LIST ──────────────────────────────────────────────────────────────
function dragStart(e, i) { dragSrcIndex = i; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function dragOver(e, i) { e.preventDefault(); document.querySelectorAll('.player-item').forEach(el => el.classList.remove('drag-over')); if (i!== dragSrcIndex) e.currentTarget.classList.add('drag-over'); }
function dragEnd() { document.querySelectorAll('.player-item').forEach(el => el.classList.remove('dragging','drag-over')); }
function drop(e, ti) {
  e.preventDefault();
  if (dragSrcIndex === null || dragSrcIndex === ti) return;
  players.splice(ti, 0, players.splice(dragSrcIndex, 1)[0]);
  dragSrcIndex = null; renderPlayerList(); saveData();
}

// ── DRAG CAMPO ↔ BANCO ─────────────────────────────────────────────────────
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
  const id = parseInt(ev.dataTransfer.getData("id"));
  const player = players.find(p => p.id === id);

  // Se o jogador já está em campo, é só reposicionamento — ignora
  if (!player || player.emCampo) return;

  const emCampo = players.filter(p => p.emCampo).length;
  if (emCampo >= 11) {
    alert('Máximo de 11 jogadores em campo!');
    return;
  }

  player.emCampo = true;
  saveData();
  renderField();
}

function dropNaReserva(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  ev.currentTarget.classList.remove('drag-over');
  const id = parseInt(ev.dataTransfer.getData("id"));
  const player = players.find(p => p.id === id);
  if (player) {
    player.emCampo = false;
    saveData();
    renderField();
  }
}

// ── SUBSTITUIR JOGADOR = VOLTAR PRO BANCO ───────────────────────────────────
function substituirJogador(id) {
  const player = players.find(p => p.id === id);
  if (!player) return;
  
  player.emCampo = false;
  saveData();
  renderField();
  renderPlayerList(); // atualiza a lista também
}

// ── FIELD DRAG ─────────────────────────────────────────────────────────────
function clampPos(v) { return Math.max(2, Math.min(98, v)); }

function selectPlayer(el) {
  document.querySelectorAll('.field-player.selected').forEach(e => e.classList.remove('selected'));
  if (fSelected === el) { fSelected = null; return; }
  fSelected = el;
  el.classList.add('selected');
}

function attachFieldDrag(el) {

  // ── DESKTOP: duplo clique = manda pro banco ─────────────────────────────
  el.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    substituirJogador(parseInt(el.dataset.id));
  });

  // ── DESKTOP: mousedown no corpo = reposicionar no campo ─────────────────
  el.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('.field-dot')) return;
    fDragEl = el;
    fDragEl.classList.add('is-dragging');
    const r = document.getElementById('pitch-container').getBoundingClientRect();
    fOffX = e.clientX - r.left - parseFloat(fDragEl.style.left) / 100 * r.width;
    fOffY = e.clientY - r.top  - parseFloat(fDragEl.style.top)  / 100 * r.height;
    e.preventDefault();
  });

  // ── DESKTOP: drag nativo na bolinha = arrastar pro banco ─────────────────
  const dot = el.querySelector('.field-dot');
  dot.draggable = true;
  dot.addEventListener('mousedown', e => e.stopPropagation());
  dot.addEventListener('dragstart', e => {
    isNativeDrag = true;
    e.dataTransfer.setData('id', el.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  });
  dot.addEventListener('dragend', e => {
    isNativeDrag = false;
    e.stopPropagation();
  });

  // ── MOBILE: touch ───────────────────────────────────────────────────────
  // toque simples         → nada
  // segurar 500ms         → seleciona (vibra) e habilita arrastar pro banco
  // arrastar após segurar → se soltar fora do campo, manda pro banco
  // arrastar sem segurar  → reposiciona no campo
  // duplo toque           → manda direto pro banco

  el.addEventListener('touchstart', e => {
    e.stopPropagation();
    fTouchMoved = false;
    touchReadyToDrag = false;

    const t = e.touches[0];
    const r = document.getElementById('pitch-container').getBoundingClientRect();
    fDragEl = el;
    fOffX = t.clientX - r.left - parseFloat(el.style.left) / 100 * r.width;
    fOffY = t.clientY - r.top  - parseFloat(el.style.top)  / 100 * r.height;

    // Long press: após 500ms habilita modo arrastar-pro-banco
    longPressTimer = setTimeout(() => {
      longPressEl = el;
      touchReadyToDrag = true;
      el.classList.add('selected');
      if (navigator.vibrate) navigator.vibrate(60);
    }, 500);

  }, { passive: true });

  el.addEventListener('touchend', e => {
    clearTimeout(longPressTimer);
    longPressTimer = null;

    if (!fDragEl) return;
    e.stopPropagation();
    fDragEl.classList.remove('is-dragging');

    if (!fTouchMoved) {
      // Toque rápido sem mover — detecta duplo toque
      const now = Date.now();
      const timeSince = now - lastTap;
      if (timeSince < 300 && timeSince > 0) {
        document.querySelectorAll('.field-player.selected').forEach(x => x.classList.remove('selected'));
        substituirJogador(parseInt(el.dataset.id));
        lastTap = 0;
      } else {
        lastTap = now;
      }
    } else {
      // Arrastou
      if (touchReadyToDrag) {
        const r = document.getElementById('pitch-container').getBoundingClientRect();
        const t = e.changedTouches[0];
        const dentroDoCampo = t.clientX >= r.left && t.clientX <= r.right &&
                              t.clientY >= r.top  && t.clientY <= r.bottom;
        if (!dentroDoCampo) {
          // Soltou fora do campo = manda pro banco
          document.querySelectorAll('.field-player.selected').forEach(x => x.classList.remove('selected'));
          substituirJogador(parseInt(el.dataset.id));
          fDragEl = null; longPressEl = null; touchReadyToDrag = false;
          return;
        }
      }
      // Soltou dentro do campo = salva posição
      document.querySelectorAll('.field-player.selected').forEach(x => x.classList.remove('selected'));
      fSelected = null;
      savePositions();
    }

    fDragEl = null; longPressEl = null; touchReadyToDrag = false;
  });
}

document.addEventListener('touchmove', e => {
  if (!fDragEl || isNativeDrag) return;
  fTouchMoved = true;
  e.preventDefault();
  const r = document.getElementById('pitch-container').getBoundingClientRect();
  const t = e.touches[0];
  fDragEl.style.left = clampPos((t.clientX - r.left - fOffX) / r.width * 100) + '%';
  fDragEl.style.top = clampPos((t.clientY - r.top - fOffY) / r.height * 100) + '%';
}, { passive: false });

document.addEventListener('mousemove', e => {
  if (!fDragEl || isNativeDrag) return;
  const r = document.getElementById('pitch-container').getBoundingClientRect();
  fDragEl.style.left = clampPos((e.clientX - r.left - fOffX) / r.width * 100) + '%';
  fDragEl.style.top = clampPos((e.clientY - r.top - fOffY) / r.height * 100) + '%';
});

document.addEventListener('mouseup', e => {
  if (fDragEl) {
    fDragEl.classList.remove('is-dragging');
    if (!isNativeDrag) savePositions();
    fDragEl = null;
  }
  // Não zera isNativeDrag aqui — o dragend da bolinha já faz isso
});

document.getElementById('pitch-container').addEventListener('touchend', e => {
  if (!fSelected || fDragEl) return;
  const r = document.getElementById('pitch-container').getBoundingClientRect();
  const t = e.changedTouches[0];
  if (t.clientX < r.left || t.clientX > r.right || t.clientY < r.top || t.clientY > r.bottom) return;
  fSelected.style.left = clampPos((t.clientX - r.left) / r.width * 100) + '%';
  fSelected.style.top = clampPos((t.clientY - r.top) / r.height * 100) + '%';
  fSelected.classList.remove('selected');
  fSelected = null;
  savePositions();
});

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

function getPositions(key) {
  const lines = FORMATIONS[key]; if (!lines) return [];
  const n = lines.length, top = 0.04, bot = 0.96, span = bot - top;
  return lines.flatMap(([,xs], li) => xs.map(x => ({ x: x/100, y: bot - (li/(n-1))*span })));
}

// ── FIELD RENDER ───────────────────────────────────────────────────────────
function applyFormation() {
  try { localStorage.removeItem('tatica_positions'); } catch(e) {}
  renderField();
  saveData();
}

function renderField() {
  const key = document.getElementById('formation-select').value;
  const defaultPos = getPositions(key);
  const fp = document.getElementById('field-players');
  fp.innerHTML = '';
  fSelected = null;

  let savedPos = null;
  try {
    const sp = localStorage.getItem('tatica_positions');
    if (sp) savedPos = JSON.parse(sp);
  } catch(e) {}

  const emCampo = players.filter(p => p.emCampo);
  const n = Math.min(defaultPos.length, emCampo.length);

  emCampo.slice(0, n).forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'field-player' + (i === 0? ' gk' : '');
    el.dataset.id = p.id;
    el.draggable = true;
    const pos = (savedPos && savedPos[i])? savedPos[i] : { x: defaultPos[i].x * 100, y: defaultPos[i].y * 100 };
    el.style.left = pos.x + '%';
    el.style.top = pos.y + '%';
    el.innerHTML = `<div class="field-dot">${i+1}</div><div class="field-name">${esc(shortName(p.name))}</div>`;
    attachFieldDrag(el);
    fp.appendChild(el);
  });

  const bench = document.getElementById('bench-list');
  const reservas = players.filter(p =>!p.emCampo);
  bench.innerHTML = reservas.length? reservas.map(p => `
    <div class="bench-chip" draggable="true" data-id="${p.id}" data-status="${p.status || 'indefinido'}"
         ondragstart="event.dataTransfer.setData('id', ${p.id})">
      ${esc(shortName(p.name))}
    </div>
  `).join('') : '<span class="bench-empty">Todos em campo</span>';

  if (!players.length) {
    fp.innerHTML = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:rgba(255,255,255,.4);font-size:13px;font-weight:600;pointer-events:none;">Adicione jogadores<br>na aba Elenco</div>`;
    bench.innerHTML = '<span class="bench-empty">—</span>';
  }
}

function savePositions() {
  const els = document.querySelectorAll('.field-player');
  const pos = [];
  els.forEach(el => {
    pos.push({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) });
  });
  try { localStorage.setItem('tatica_positions', JSON.stringify(pos)); } catch(e) {}
}

function resetPositions() {
  try { localStorage.removeItem('tatica_positions'); } catch(e) {}
  renderField();
}

function updateFieldNames() {
  document.querySelectorAll('.field-player').forEach((el) => {
    const id = parseInt(el.dataset.id);
    const p = players.find(pl => pl.id === id);
    const n = el.querySelector('.field-name');
    if (n && p) n.textContent = shortName(p.name);
  });
}

function shortName(name) {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1? p[0] : p[p.length - 1];
}

// ── SAVE / LOAD ────────────────────────────────────────────────────────────
function saveData() {
  try {
    localStorage.setItem('tatica_players', JSON.stringify(players));
    localStorage.setItem('tatica_nextId', String(nextId));
    localStorage.setItem('tatica_formation', document.getElementById('formation-select').value);
  } catch(e) {}
}

// ── INIT ──────────────────────────────────────────────────────────────────
try {
  const sp = localStorage.getItem('tatica_players'); if (sp) players = JSON.parse(sp);
  const si = localStorage.getItem('tatica_nextId'); if (si) nextId = parseInt(si);
  const sf = localStorage.getItem('tatica_formation'); if (sf) document.getElementById('formation-select').value = sf;
} catch(e) {}

document.getElementById('formation-select').addEventListener('change', saveData);

renderLoginDots();
renderPlayerList();
