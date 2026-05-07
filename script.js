// === TÁTICA FC - VERSÃO ESTÁVEL ===
const urlParams = new URLSearchParams(window.location.search);
let timeId = urlParams.get('time');

function ehPremium() {
  const tipo = localStorage.getItem('premium_tipo');
  return tipo === 'mensal' || tipo === 'vitalicio';
}
window.ehPremium = ehPremium;

if (!timeId) {
  const todosTimesTemp = JSON.parse(localStorage.getItem('todos_times')) || {};
  if (Object.keys(todosTimesTemp).length >= 1 &&!ehPremium()) {
    alert('Apenas 1 time no plano grátis. Seja Premium para criar mais times.');
    window.location.href = 'index.html';
    throw new Error('Limite de times atingido');
  }
  timeId = 'time_' + Date.now();
  history.replaceState(null, '', '?time=' + timeId);
}

let todosTimes = JSON.parse(localStorage.getItem('todos_times')) || {};
if (!todosTimes[timeId]) {
  todosTimes[timeId] = {
    id: timeId,
    nome: 'Time ' + (Object.keys(todosTimes).length + 1),
    jogadores: [],
    formacao: '4-4-2',
    criado: Date.now(),
    atualizado: Date.now(),
    slotsExtras: 0
  };
  salvar();
}

let jogadores = todosTimes[timeId].jogadores;
let nextId = jogadores.length > 0? Math.max(...jogadores.map(j => j.id)) + 1 : 1;

function salvar() {
  todosTimes[timeId].jogadores = jogadores;
  todosTimes[timeId].atualizado = Date.now();
  localStorage.setItem('todos_times', JSON.stringify(todosTimes));
  nextId = jogadores.length > 0? Math.max(...jogadores.map(j => j.id)) + 1 : 1;
}

window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header h1');
  if (header) header.textContent = todosTimes[timeId].nome;
  const formSelect = document.getElementById('formation-select');
  if (formSelect) formSelect.value = todosTimes[timeId].formacao || '4-4-2';
  if (ehPremium()) document.getElementById('premium-badge').classList.add('show');
  injetarMarcaDAgua();
  injetarBaloes();
  renderAll();
});

let selectedPlayerId = null;
let fDragEl = null;
let fOffX = 0, fOffY = 0;
let startX = 0, startY = 0;

function injetarMarcaDAgua() {
  const campo = document.querySelector('#pitch-container');
  if (!campo || campo.querySelector('.tfc-watermark')) return;
  campo.style.position = 'relative';
  campo.insertAdjacentHTML('beforeend', `
    <div class="tfc-watermark">TÁTICA FC</div>
    <style>
.tfc-watermark{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(-12deg);
      font-size:clamp(32px,8vw,64px);font-weight:900;
      color:rgba(255,255,255,0.06);pointer-events:none;
      letter-spacing:6px;font-family:'Inter',sans-serif;z-index:1;
    }
    </style>
  `);
}

function injetarBaloes() {
  if (document.getElementById('tfc-balao-jogador')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="tfc-balao-jogador" class="tfc-modal">
      <div class="tfc-modal-box">
        <h3>Limite de 15 jogadores</h3>
        <p>Assine Premium para jogadores ilimitados e times sem limite.</p>
        
        <button class="tfc-btn-premium" onclick="virarPremium('mensal')">
          Premium Mensal - R$ 9,90/mês
        </button>
        
        <button class="tfc-btn-vitalicio" onclick="virarPremium('vitalicio')">
          👑 Vitalício - R$ 39,90 única vez
        </button>
        
        <button class="tfc-btn-anuncio" onclick="confirmarAnuncioJogador()">
          Assistir Anúncio pra +1 vaga
        </button>
        
        <button class="tfc-btn-fechar" onclick="fecharBalao('jogador')">Agora não</button>
      </div>
    <style>
.tfc-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(8px);z-index:99999;align-items:center;justify-content:center;padding:20px}
.tfc-modal.show{display:flex}
.tfc-modal-box{background:#1e293b;border:1px solid #3b82f6;border-radius:20px;padding:28px;max-width:340px;text-align:center}
.tfc-modal-box h3{font-size:22px;margin-bottom:12px;color:#fff}
.tfc-modal-box p{color:rgba(241,245,249,.7);font-size:14px;margin-bottom:20px;line-height:1.5}
.tfc-modal-box button{width:100%;padding:14px;border:none;border-radius:12px;font-weight:700;margin-bottom:10px;cursor:pointer;font-size:15px}
.tfc-btn-premium{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff}
.tfc-btn-vitalicio{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}
.tfc-btn-anuncio{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)}
.tfc-btn-fechar{background:transparent;color:rgba(255,255,255,.5)}
    </style>
  `);
}

function mostrarBalaoJogador() {
  document.getElementById('tfc-balao-jogador').classList.add('show');
}
function fecharBalao(tipo) {
  document.getElementById(`tfc-balao-${tipo}`).classList.remove('show');
}

function confirmarAnuncioJogador() {
  fecharBalao('jogador');
  if (confirm('SIMULAÇÃO: Você assistiu o anúncio completo. Liberar +1 jogador?')) {
    todosTimes[timeId].slotsExtras = (todosTimes[timeId].slotsExtras || 0) + 1;
    salvar();
    alert('Slot liberado! Agora você pode adicionar mais 1 jogador.');
  }
}

function virarPremium(tipo = 'mensal') {
  localStorage.setItem('premium_tipo', tipo);
  window.ehPremium = true;
  fecharBalao('jogador');
  alert(`Premium ${tipo === 'vitalicio' ? 'Vitalício' : 'Mensal'} ativado!`);
  location.reload();
}

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

const FORMACOES_PREMIUM = ['4-2-3-1','3-5-2','3-4-3','5-3-2','5-4-1','4-1-4-1','4-3-2-1'];

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

function changeFormation() {
  const key = document.getElementById('formation-select').value;
  if (FORMACOES_PREMIUM.includes(key) &&!ehPremium()) {
    alert('Formação ' + key + ' é Premium');
    document.getElementById('formation-select').value = todosTimes[timeId].formacao || '4-4-2';
    return;
  }
  todosTimes[timeId].formacao = key;
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
  const slotsExtras = todosTimes[timeId].slotsExtras || 0;

  if (!ehPremium() && emCampo >= 15 + slotsExtras) {
    mostrarBalaoJogador();
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

function addPlayer() {
  const inputName = document.getElementById('new-player-input');
  const inputNumber = document.getElementById('new-player-number');
  const name = inputName.value.trim();
  const number = parseInt(inputNumber.value);

  if (!name) return alert('Digite o nome do jogador');
  if (!number || number < 1 || number > 99) return alert('Digite um número de camisa válido entre 1 e 99');
  if (jogadores.some(p => p.number === number)) return alert('Já existe um jogador com a camisa ' + number);

  const slotsExtras = todosTimes[timeId].slotsExtras || 0;
  if (jogadores.length >= 15 + slotsExtras &&!ehPremium()) {
    mostrarBalaoJogador();
    return;
  }

  jogadores.push({
    id: nextId,
    name: name,
    number: number,
    status: 'indefinido',
    emCampo: false,
    x: null,
    y: null
  });
  nextId++;

  inputName.value = '';
  inputNumber.value = '';
  salvar();
  renderAll();
  inputName.focus();
}

function removePlayer(id) {
  if (!confirm('Remover jogador? Se adicionar de novo e passar de 15, vai precisar assistir anúncio.')) return;
  jogadores = jogadores.filter(p => p.id!== id);
  salvar();
  renderAll();
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderAll() {
  renderField();
  renderBench();
  renderAusentes();
}

function renderField() {
  const fp = document.getElementById('field-players');
  if (!fp) return;
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
    el.ondragend = () => el.classList.remove('is-dragging');
    el.onclick = (e) => {
      e.stopPropagation();
      selectPlayerOnField(p.id);
    };
    el.oncontextmenu = (e) => showContextMenu(e, p.id);
    let pressTimer;
    el.ontouchstart = (e) => {
      pressTimer = setTimeout(() => showContextMenu(e, p.id), 500);
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
}

function renderAusentes() {
  const ausentes = document.getElementById('ausentes-list');
  if (!ausentes) return;
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

function selectPlayerOnField(playerId) {
  selectedPlayerId = playerId;
  const player = jogadores.find(p => p.id === playerId);
  const input = document.getElementById('edit-name-input');
  const btn = document.getElementById('save-name-btn');
  if (player && input && btn) {
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
  const input = document.getElementById('edit-name-input');
  const newName = input.value.trim();
  if (player && newName) {
    player.name = newName;
    salvar();
    renderAll();
    input.value = '';
    input.disabled = true;
    document.getElementById('save-name-btn').disabled = true;
    selectedPlayerId = null;
  }
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

function showContextMenu(e, playerId) {
  e.preventDefault();
  e.stopPropagation();
  const oldMenu = document.getElementById('context-menu');
  if (oldMenu) oldMenu.remove();
  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.innerHTML = `
    <div class="context-item" onclick="sendToBench(${playerId}); closeContextMenu();">📤 Enviar pro banco</div>
    <div class="context-item" onclick="togglePlayerStatus(${playerId}); closeContextMenu();">❌ Marcar ausente</div>
  `;
  const x = e.clientX || (e.touches && e.touches[0].clientX);
  const y = e.clientY || (e.touches && e.touches[0].clientY);
  document.body.appendChild(menu);
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
  }, 10);
}

function closeContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.remove();
}

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
  if (!pitch) return;
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
  if (!pitch) return;
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
      if (pitch) {
        const r = pitch.getBoundingClientRect();
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (inside) saveFieldPosition(fDragEl);
      }
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
      if (pitch) {
        const r = pitch.getBoundingClientRect();
        const t = e.changedTouches[0];
        const inside = t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom;
        if (inside) saveFieldPosition(fDragEl);
      }
    }
    fDragEl.dataset.moved = 'false';
    fDragEl = null;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const btnAdd = document.querySelector('.add-player-bar button');
  if (btnAdd) btnAdd.onclick = addPlayer;

  const inputName = document.getElementById('new-player-input');
  if (inputName) inputName.onkeydown = (e) => {
    if (e.key === 'Enter') addPlayer();
  };

  const inputNumber = document.getElementById('new-player-number');
  if (inputNumber) inputNumber.onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('new-player-input').focus();
  };

  const btnSave = document.getElementById('save-name-btn');
  if (btnSave) btnSave.onclick = savePlayerName;

  window.addEventListener('DOMContentLoaded', () => {
  // ... código que já tem ...
  
  // Mostra tipo do premium no badge
  const tipo = localStorage.getItem('premium_tipo');
  if (tipo) {
    const badge = document.getElementById('premium-badge');
    badge.textContent = tipo === 'vitalicio' ? '👑 VITALÍCIO' : '⭐ PREMIUM';
    badge.classList.add('show');
  }
});
});
