// ===== TÁTICA FC - VERSÃO CORRIGIDA =====
// ===== VARIÁVEIS GLOBAIS =====
let todosTimes = JSON.parse(localStorage.getItem('todos_times')) || {};
let timeAtual = null;
let jogadores = [];
let currentFormation = '4-4-2';
let selectedPlayerId = null;
let fDragEl = null;
let fOffX = 0, fOffY = 0;
let startX = 0, startY = 0;

// Pega time da URL
const urlParams = new URLSearchParams(window.location.search);
let timeId = urlParams.get('time');

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
  const top = 8, bot = 92, span = bot - top;
  return lines.flatMap(([,xs], li) => xs.map(x => ({
    x: x,
    y: bot - (li/(n-1)) * span
  })));
}

function organizarPorNumero() {
  const formacao = currentFormation;
  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou');
  const MAPAS = {
   "4-4-2": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 4: { x: 40, y: 68 }, 3: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      10: { x: 20, y: 48 }, 5: { x: 40, y: 48 }, 8: { x: 60, y: 48 }, 7: { x: 80, y: 48 },
      11: { x: 40, y: 28 }, 9: { x: 60, y: 28 }
    },
    "4-3-3": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 3: { x: 40, y: 68 }, 4: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      10: { x: 30, y: 44 }, 5: { x: 50, y: 52 }, 8: { x: 70, y: 44 },
      11: { x: 25, y: 20 }, 9: { x: 50, y: 16 }, 7: { x: 75, y: 20 }
    },
    "4-2-3-1": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 4: { x: 40, y: 68 }, 3: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      5: { x: 40, y: 52 }, 8: { x: 60, y: 52 },
      10: { x: 25, y: 36 }, 7: { x: 50, y: 32 }, 11: { x: 75, y: 36 },
      9: { x: 50, y: 16 }
    },
   "4-5-1": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 3: { x: 40, y: 68 }, 4: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      11: { x: 16, y: 48 }, 5: { x: 33, y: 48 }, 10: { x: 50, y: 48 }, 8: { x: 67, y: 48 }, 7: { x: 84, y: 48 },
      9: { x: 50, y: 20 }
    },
    "3-5-2": {
      1: { x: 50, y: 88 }, 4: { x: 30, y: 70 }, 3: { x: 50, y: 74 }, 5: { x: 70, y: 70 },
      6: { x: 16, y: 46 }, 10: { x: 33, y: 46 }, 8: { x: 50, y: 50 }, 7: { x: 67, y: 46 }, 2: { x: 84, y: 46 },
      11: { x: 40, y: 22 }, 9: { x: 60, y: 22 }
    },
    "3-4-3": {
      1: { x: 50, y: 88 }, 4: { x: 30, y: 70 }, 3: { x: 50, y: 74 }, 5: { x: 70, y: 70 },
      6: { x: 20, y: 48 }, 10: { x: 40, y: 48 }, 8: { x: 60, y: 48 }, 2: { x: 80, y: 48 },
      7: { x: 25, y: 20 }, 11: { x: 50, y: 16 }, 9: { x: 75, y: 20 }
    },
    "5-3-2": {
      1: { x: 50, y: 88 }, 6: { x: 15, y: 66 }, 4: { x: 32, y: 68 }, 5: { x: 50, y: 72 }, 3: { x: 68, y: 68 }, 2: { x: 85, y: 66 },
      8: { x: 30, y: 44 }, 10: { x: 50, y: 40 }, 7: { x: 70, y: 44 },
      11: { x: 40, y: 20 }, 9: { x: 60, y: 20 }
    },
    "5-4-1": {
      1: { x: 50, y: 88 }, 6: { x: 15, y: 66 }, 4: { x: 32, y: 68 }, 5: { x: 50, y: 72 }, 3: { x: 68, y: 68 }, 2: { x: 85, y: 66 },
      8: { x: 25, y: 44 }, 10: { x: 42, y: 44 }, 7: { x: 58, y: 44 }, 11: { x: 75, y: 44 },
      9: { x: 50, y: 20 }
    },
    "4-1-4-1": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 4: { x: 40, y: 68 }, 3: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      5: { x: 50, y: 56 },
      8: { x: 20, y: 36 }, 10: { x: 40, y: 36 }, 7: { x: 60, y: 36 }, 11: { x: 80, y: 36 },
      9: { x: 50, y: 16 }
    },
    "4-3-2-1": {
      1: { x: 50, y: 88 }, 6: { x: 20, y: 68 }, 3: { x: 40, y: 68 }, 4: { x: 60, y: 68 }, 2: { x: 80, y: 68 },
      10: { x: 30, y: 50 }, 5: { x: 50, y: 50 }, 8: { x: 70, y: 50 },
      7: { x: 40, y: 30 }, 11: { x: 60, y: 30 },
      9: { x: 50, y: 16 }
    }
  };

  const mapa = MAPAS[formacao];
  if (!mapa) return;

  emCampo.forEach(p => {
    const num = parseInt(p.number);
    const pos = mapa[num];
    if (pos) {
      p.x = pos.x;
      p.y = pos.y;
    }
  });

  salvar();
  renderField();
}

function changeFormation() {
  const key = document.getElementById('formation-select').value;

  if (FORMACOES_PREMIUM.includes(key) &&!ehPremium()) {
    alert('Formação ' + key + ' é Premium');
    document.getElementById('formation-select').value = currentFormation;
    return;
  }

  currentFormation = key;
  todosTimes[timeId].formacao = key;

  const positions = getFormationPositions(key);
  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou');

  emCampo.forEach((p, i) => {
    if (positions[i]) {
      p.x = positions[i].x;
      p.y = positions[i].y;
    } else {
      p.emCampo = false;
      p.x = null;
      p.y = null;
    }
  });

  organizarPorNumero();
  salvar();
  renderField();
}

function salvar() {
  if (!timeId ||!timeAtual) return;
  todosTimes[timeId].jogadores = jogadores;
  todosTimes[timeId].formacao = currentFormation;
  todosTimes[timeId].atualizado = Date.now();
  localStorage.setItem('todos_times', JSON.stringify(todosTimes));
}

function ehPremium() {
  const tipo = localStorage.getItem('premium_tipo');
  return tipo === 'mensal' || tipo === 'vitalicio';
}
window.ehPremium = ehPremium;

function addPlayer() {
  const nameInput = document.getElementById('new-player-input');
  const numberInput = document.getElementById('new-player-number');

  const name = nameInput.value.trim();
  const number = numberInput.value.trim();

  if (!name) return alert('Digite o nome do jogador');

  const newPlayer = {
    id: Date.now(),
    name: name,
    number: number || '',
    emCampo: false,
    status: 'indefinido',
    x: null,
    y: null
  };

  jogadores.push(newPlayer);
  nameInput.value = '';
  numberInput.value = '';

  salvar();
  renderAll();
}

function removePlayer(id) {
  if (!confirm('Remover jogador?')) return;
  jogadores = jogadores.filter(p => p.id!== id);
  salvar();
  renderAll();
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
    el.draggable = false;
    if (p.x == null || p.y == null) {
      p.x = 50;
      p.y = 80;
    }
    el.style.left = `calc(${p.x}% - 20px)`;
    el.style.top = `calc(${p.y}% - 20px)`;
    el.onclick = (e) => {
      e.stopPropagation();
      selectPlayerOnField(p.id);
    };
    el.oncontextmenu = (e) => showContextMenu(e, p.id);
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
         ondragstart="handleDragStart(event, ${p.id})"
         ontouchstart="handleDragStart(event, ${p.id})">
      <span class="status-btn indefinido"></span>
      ${p.number? '#' + p.number + ' ' : ''}${esc(p.name)}
      <button class="btn-remove" onclick="removePlayer(${p.id})">✕</button>
    </div>
  `).join('') : '<span class="bench-empty">Banco vazio</span>';
}

function handleDragStart(e, playerId) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', playerId);
  }
  // Salva o ID globalmente pro touch
  window.draggedPlayerId = playerId;
}

function renderAusentes() {
  const ausentes = document.getElementById('ausentes-list');
  if (!ausentes) return;
  const faltaram = jogadores.filter(p => p.status === 'faltou');
  ausentes.innerHTML = faltaram.length? faltaram.map(p => `
    <div class="bench-chip ausente" draggable="true" data-id="${p.id}"
         ondragstart="event.dataTransfer.setData('text/plain', '${p.id}')">
      <span class="status-btn faltou"></span>
      <span class="player-name">${p.number? '#' + p.number + ' ' : ''}${esc(p.name)}</span>
      <button class="btn-action" onclick="voltarProBanco(${p.id})">Banco</button>
      <button class="btn-remove" onclick="removePlayer(${p.id})">✕</button>
    </div>
  `).join('') : '<span class="bench-empty">Todos presentes</span>';
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
  player.status = player.status === 'faltou'? 'indefinido' : 'faltou';
  player.emCampo = false;
  player.x = null;
  player.y = null;
  salvar();
  renderAll();
}

function editPlayerName(playerId) {
  selectPlayerOnField(playerId);
}

function showContextMenu(e, playerId) {
  e.preventDefault();
  e.stopPropagation();

  const oldMenu = document.getElementById('context-menu');
  if (oldMenu) oldMenu.remove();

  const menu = document.createElement('div');
  menu.id = 'context-menu';
  menu.innerHTML = `
    <div class="context-item" data-action="bench">📤 Enviar pro banco</div>
    <div class="context-item" data-action="ausente">❌ Marcar ausente</div>
    <div class="context-item" data-action="edit">✏️ Editar nome</div>
  `;

  const point = e.changedTouches? e.changedTouches[0] : e.touches? e.touches[0] : e;
  const x = point.clientX;
  const y = point.clientY;

  document.body.appendChild(menu);

  const menuRect = menu.getBoundingClientRect();
  const maxX = window.innerWidth - menuRect.width - 10;
  const maxY = window.innerHeight - menuRect.height - 10;

  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top = Math.min(y, maxY) + 'px';

  // FUNÇÃO QUE RODA AÇÃO
  const handleAction = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    const item = ev.target.closest('.context-item');
    if (!item) return;

    const action = item.dataset.action;

    if (action === 'bench') sendToBench(playerId);
    if (action === 'ausente') togglePlayerStatus(playerId);
    if (action === 'edit') editPlayerName(playerId);

    closeContextMenu();
  };

  // FUNCIONA MOUSE E TOUCH
  menu.addEventListener('mousedown', handleAction);
  menu.addEventListener('touchstart', handleAction, { passive: false });

  // Fecha ao clicar fora
  setTimeout(() => {
    const closeHandler = (ev) => {
      if (!menu.contains(ev.target)) closeContextMenu();
    };
    document.addEventListener('mousedown', closeHandler, { once: true });
    document.addEventListener('touchstart', closeHandler, { once: true });
  }, 0);
}

function closeContextMenu() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.remove();
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

  const id = parseInt(ev.dataTransfer?.getData("text/plain") || window.draggedPlayerId);
  window.draggedPlayerId = null;

  const player = jogadores.find(p => p.id === id);
  if (!player || player.emCampo || player.status === 'faltou') return;

  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou').length;
  const slotsExtras = todosTimes[timeId].slotsExtras || 0;

  if (!ehPremium() && emCampo >= 15 + slotsExtras) {
    alert('Limite de 15 jogadores em campo. Seja Premium para mais.');
    return;
  }

  const rect = ev.currentTarget.getBoundingClientRect();

  // PEGA COORDENADA DO MOUSE OU TOUCH
  const clientX = ev.changedTouches? ev.changedTouches[0].clientX : ev.clientX;
  const clientY = ev.changedTouches? ev.changedTouches[0].clientY : ev.clientY;

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

function attachFieldDrag(el) {
  el.dataset.moved = 'false';

  const startDrag = (e) => {
    if (e.button && e.button!== 0) return;

    const point = e.touches? e.touches[0] : e;
    e.preventDefault();
    e.stopPropagation();

    fDragEl = el;
    fDragEl.classList.add('is-dragging');

    const pitch = document.getElementById('pitch-container');
    const elRect = fDragEl.getBoundingClientRect();

    startX = point.clientX;
    startY = point.clientY;

    fOffX = point.clientX - elRect.left;
    fOffY = point.clientY - elRect.top;
  };

  el.addEventListener('mousedown', startDrag);
  el.addEventListener('touchstart', startDrag, { passive: false });
}

const moveDrag = (e) => {
  if (!fDragEl) return;

  const point = e.touches? e.touches[0] : e;
  const moved = Math.abs(point.clientX - startX) > 3 || Math.abs(point.clientY - startY) > 3;
  if (moved) fDragEl.dataset.moved = 'true';

  const pitch = document.getElementById('pitch-container');
  if (!pitch) return;
  const r = pitch.getBoundingClientRect();

  e.preventDefault();

  let newX = point.clientX - r.left - fOffX;
  let newY = point.clientY - r.top - fOffY;

  const maxX = r.width - fDragEl.offsetWidth;
  const maxY = r.height - fDragEl.offsetHeight;

  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  fDragEl.style.left = newX + 'px';
  fDragEl.style.top = newY + 'px';
};

const endDrag = (e) => {
  if (!fDragEl) return;

  fDragEl.classList.remove('is-dragging');

  if (fDragEl.dataset.moved === 'true') {
    const pitch = document.getElementById('pitch-container');
    const r = pitch.getBoundingClientRect();
    const elRect = fDragEl.getBoundingClientRect();

    const centerX = elRect.left - r.left + elRect.width / 2;
    const centerY = elRect.top - r.top + elRect.height / 2;

    const id = parseInt(fDragEl.dataset.id);
    const player = jogadores.find(p => p.id === id);

    if (player) {
      player.x = (centerX / r.width) * 100;
      player.y = (centerY / r.height) * 100;

      fDragEl.style.left = `calc(${player.x}% - ${elRect.width / 2}px)`;
      fDragEl.style.top = `calc(${player.y}% - ${elRect.height / 2}px)`;

      salvar();
    }
  }

  fDragEl.dataset.moved = 'false';
  fDragEl = null;
};

document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);
document.addEventListener('touchmove', moveDrag, { passive: false });
document.addEventListener('touchend', endDrag);

// ===== EXPÕE FUNÇÕES PRO HTML =====
window.sendToBench = sendToBench;
window.togglePlayerStatus = togglePlayerStatus;
window.removePlayer = removePlayer;
window.editPlayerName = editPlayerName;
window.voltarProBanco = voltarProBanco;
window.allowDrop = allowDrop;
window.dragLeave = dragLeave;
window.dropNoCampo = dropNoCampo;
window.dropToBench = dropToBench;
window.dropToAusentes = dropToAusentes;
window.handleDragStart = handleDragStart;
window.addEventListener('DOMContentLoaded', () => {
  timeId = urlParams.get('time');

  if (timeId && todosTimes[timeId]) {
    timeAtual = todosTimes[timeId];
    jogadores = timeAtual.jogadores || [];
    currentFormation = timeAtual.formacao || '4-4-2';
  } else {
    timeId = 'time_' + Date.now();
    timeAtual = {
      id: timeId,
      nome: 'Meu Time',
      jogadores: [],
      formacao: '4-4-2',
      atualizado: Date.now()
    };
    todosTimes[timeId] = timeAtual;
    history.replaceState(null, '', '?time=' + timeId);
    salvar();
  }

  if (Object.keys(todosTimes).length > 1 &&!ehPremium()) {
    alert('Apenas 1 time no plano grátis. Seja Premium para criar mais times.');
    window.location.href = 'index.html';
    return;
  }

  const header = document.querySelector('.app-header h1');
  if (header) header.textContent = timeAtual.nome;

  const formSelect = document.getElementById('formation-select');
  if (formSelect) {
    formSelect.value = currentFormation;
    formSelect.onchange = changeFormation;
  }

  const tipo = localStorage.getItem('premium_tipo');
  if (tipo) {
    const badge = document.getElementById('premium-badge');
    if (badge) {
      badge.textContent = tipo === 'vitalicio'? '👑 VITALÍCIO' : '⭐ PREMIUM';
      badge.classList.add('show');
    }
  }

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

  console.log('Time carregado:', timeAtual.nome, 'Jogadores:', jogadores.length);

  if (jogadores.some(p => p.emCampo)) {
    organizarPorNumero();
  }

  renderAll();
});
