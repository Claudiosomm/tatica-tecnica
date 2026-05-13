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

// Mapeia número da camisa → posição na formação
const POSICOES_POR_NUMERO = {
  "4-4-2": {
    1: { linha: 0, slot: 0 }, // Goleiro
    2: { linha: 1, slot: 0 }, // Lat. Direito - fica na direita da tela
    3: { linha: 1, slot: 3 }, // Lat. Esquerdo - fica na esquerda da tela
    4: { linha: 1, slot: 1 }, // Zag. Direito
    5: { linha: 1, slot: 2 }, // Zag. Esquerdo
    6: { linha: 2, slot: 3 }, // Vol. Esquerdo
    8: { linha: 2, slot: 2 }, // Vol. Direito
    7: { linha: 2, slot: 0 }, // Meia Direita
    10: { linha: 2, slot: 1 }, // Meia Esquerda
    9: { linha: 3, slot: 0 }, // Atac. Direito
    11: { linha: 3, slot: 1 } // Atac. Esquerdo
  },

  "4-3-3": {
    1: { linha: 0, slot: 0 },
    2: { linha: 1, slot: 3 },
    3: { linha: 1, slot: 0 },
    4: { linha: 1, slot: 2 },
    5: { linha: 1, slot: 1 },
    6: { linha: 2, slot: 0 }, // Volante
    8: { linha: 2, slot: 1 }, // Meia direita
    10: { linha: 2, slot: 2 }, // Meia esquerda
    7: { linha: 3, slot: 2 }, // Ponta direita
    9: { linha: 3, slot: 1 }, // Centroavante
    11: { linha: 3, slot: 0 } // Ponta esquerda
  },
  "4-5-1": {
    1: { linha: 0, slot: 0 },
    2: { linha: 1, slot: 3 },
    3: { linha: 1, slot: 0 },
    4: { linha: 1, slot: 2 },
    5: { linha: 1, slot: 1 },
    6: { linha: 2, slot: 1 }, // Volante
    7: { linha: 2, slot: 4 }, // Meia direita
    8: { linha: 2, slot: 2 }, // Meia centro
    10: { linha: 2, slot: 3 }, // Meia esquerda
    11: { linha: 2, slot: 0 }, // Ponta esquerda
    9: { linha: 3, slot: 0 } // Atacante
  }
};

function organizarPorNumero() {
  const formacao = currentFormation;
  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou');
  
  const MAPAS = {
   "4-4-2": {
      1: { x: 50, y: 92 }, // GK
      6: { x: 20, y: 68 }, // LE
      4: { x: 40, y: 68 }, // ZAG E
      3: { x: 60, y: 68 }, // ZAG D 
      2: { x: 80, y: 68 }, // LD
      10: { x: 20, y: 48 }, // ME
      5: { x: 40, y: 48 }, // VOL E
      8: { x: 60, y: 48 }, // VOL D
      7: { x: 80, y: 48 }, // MD
      11: { x: 40, y: 28 }, // AE
      9: { x: 60, y: 28 } // AD
    },
    "4-3-3": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 4 atrás
      6: { x: 20, y: 68 }, // LE
      3: { x: 40, y: 68 }, // ZAG E
      4: { x: 60, y: 68 }, // ZAG D
      2: { x: 80, y: 68 }, // LD
      
      // Meio campo em triângulo
      10: { x: 30, y: 44 }, // ME
      5: { x: 50, y: 52 }, // VOL - mais recuado
      8: { x: 70, y: 44 }, // MD
      
      // Ataque
      11: { x: 25, y: 20 }, // PE
      9: { x: 50, y: 16 }, // CA
      7: { x: 75, y: 20 } // PD
    },

     "4-2-3-1": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 4 atrás
      6: { x: 20, y: 68 }, // LE
      4: { x: 40, y: 68 }, // ZAG E
      3: { x: 60, y: 68 }, // ZAG D
      2: { x: 80, y: 68 }, // LD
      
      // 2 volantes
      5: { x: 40, y: 52 }, // VOL E
      8: { x: 60, y: 52 }, // VOL D
      
      // Linha de 3 meias
      10: { x: 25, y: 36 }, // ME
      7: { x: 50, y: 32 }, // MEIA central - 10 clássico
      11: { x: 75, y: 36 }, // MD
      
      // Ataque
      9: { x: 50, y: 16 } // CA
    },

   "4-5-1": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 4 atrás
      6: { x: 20, y: 68 }, // LE
      3: { x: 40, y: 68 }, // ZAG E
      4: { x: 60, y: 68 }, // ZAG D
      2: { x: 80, y: 68 }, // LD
      
      // Linha de 5 no meio
      11: { x: 16, y: 48 }, // ME
      5: { x: 33, y: 48 }, // VOL E
      10: { x: 50, y: 48 }, // MEIA central
      8: { x: 67, y: 48 }, // VOL D
      7: { x: 84, y: 48 }, // MD
      
      // Ataque
      9: { x: 50, y: 20 } // CA isolado
    },

     "3-5-2": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 3 atrás
      4: { x: 30, y: 70 }, // ZAG E
      3: { x: 50, y: 74 }, // LÍBERO central - mais recuado
      5: { x: 70, y: 70 }, // ZAG D
      
      // Linha de 5 no meio
      6: { x: 16, y: 46 }, // ALA E
      10: { x: 33, y: 46 }, // MEIA E
      8: { x: 50, y: 50 }, // VOL - mais recuado
      7: { x: 67, y: 46 }, // MEIA D
      2: { x: 84, y: 46 }, // ALA D
      
      // 2 atacantes
      11: { x: 40, y: 22 }, // AE
      9: { x: 60, y: 22 } // AD
    },

    "3-4-3": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 3 atrás
      4: { x: 30, y: 70 }, // ZAG E
      3: { x: 50, y: 74 }, // LÍBERO - mais recuado
      5: { x: 70, y: 70 }, // ZAG D
      
      // Linha de 4 no meio
      6: { x: 20, y: 48 }, // ALA E
      10: { x: 40, y: 48 }, // MEIA E
      8: { x: 60, y: 48 }, // MEIA D
      2: { x: 80, y: 48 }, // ALA D
      
      // 3 atacantes
      7: { x: 25, y: 20 }, // PE
      11: { x: 50, y: 16 }, // CA - central
      9: { x: 75, y: 20 } // PD
    },

    "5-3-2": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 5 atrás
      6: { x: 15, y: 66 }, // LE
      4: { x: 32, y: 68 }, // ZAG E
      5: { x: 50, y: 72 }, // LÍBERO - mais recuado
      3: { x: 68, y: 68 }, // ZAG D
      2: { x: 85, y: 66 }, // LD
      
      // Meio campo com 3
      8: { x: 30, y: 44 }, // MEIA E
      10: { x: 50, y: 40 }, // MEIA central - 10 clássico
      7: { x: 70, y: 44 }, // MEIA D
      
      // 2 atacantes
      11: { x: 40, y: 20 }, // AE
      9: { x: 60, y: 20 } // AD
    },

    "5-4-1": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 5 atrás
      6: { x: 15, y: 66 }, // LE
      4: { x: 32, y: 68 }, // ZAG E
      5: { x: 50, y: 72 }, // LÍBERO - mais recuado
      3: { x: 68, y: 68 }, // ZAG D
      2: { x: 85, y: 66 }, // LD
      
      // Linha de 4 no meio
      8: { x: 25, y: 44 }, // ME
      10: { x: 42, y: 44 }, // MEIA E
      7: { x: 58, y: 44 }, // MEIA D
      11: { x: 75, y: 44 }, // MD
      
      // Ataque
      9: { x: 50, y: 20 } // CA isolado
    },

    "4-1-4-1": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 4 atrás
      6: { x: 20, y: 68 }, // LE
      4: { x: 40, y: 68 }, // ZAG E
      3: { x: 60, y: 68 }, // ZAG D
      2: { x: 80, y: 68 }, // LD
      
      // 1º volante
      5: { x: 50, y: 56 }, // VOL - na frente da zaga
      
      // Linha de 4 no meio
      8: { x: 20, y: 36 }, // ME
      10: { x: 40, y: 36 }, // MEIA E
      7: { x: 60, y: 36 }, // MEIA D
      11: { x: 80, y: 36 }, // MD
      
      // Ataque
      9: { x: 50, y: 16 } // CA isolado
    },

    "4-3-2-1": {
      1: { x: 50, y: 92 }, // GK
      
      // Linha de 4 atrás
      6: { x: 20, y: 68 }, // LE
      3: { x: 40, y: 68 }, // ZAG E
      4: { x: 60, y: 68 }, // ZAG D
      2: { x: 80, y: 68 }, // LD
      
      // Meio campo com 3
      10: { x: 30, y: 50 }, // MEIA E
      5: { x: 50, y: 50 }, // VOL central
      8: { x: 70, y: 50 }, // MEIA D
      
      // 2 meias-atacantes
      7: { x: 40, y: 30 }, // MEIA E avançado
      11: { x: 60, y: 30 }, // MEIA D avançado
      
      // Ataque
      9: { x: 50, y: 16 } // CA
    }
  };

  const mapa = MAPAS[formacao];
  if (!mapa) return alert(`Formação ${formacao} ainda não mapeada`);

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

function changeFormation() {
  const key = document.getElementById('formation-select').value;

  // Bloqueia premium
  if (FORMACOES_PREMIUM.includes(key) &&!ehPremium()) {
    alert('Formação ' + key + ' é Premium');
    document.getElementById('formation-select').value = currentFormation;
    return;
  }

  currentFormation = key;
  todosTimes[timeId].formacao = key;

  // Reposiciona só quem já tá em campo
  const positions = getFormationPositions(key);
  const emCampo = jogadores.filter(p => p.emCampo && p.status!== 'faltou');

  emCampo.forEach((p, i) => {
    if (positions[i]) {
      p.x = positions[i].x;
      p.y = positions[i].y;
    } else {
      // Se tem mais jogador que posição, joga pro banco
      p.emCampo = false;
      p.x = null;
      p.y = null;
    }
  });

   organizarPorNumero(); // ← ADICIONA ESSA LINHA

  salvar();
  renderField();
}

// Carrega time existente
if (timeId && todosTimes[timeId]) {
  timeAtual = todosTimes[timeId];
  jogadores = timeAtual.jogadores || [];
  currentFormation = timeAtual.formacao || '4-4-2';
}

// Se não existe, cria novo
if (!timeAtual) {
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
}

// Bloqueia multi-time no grátis
if (Object.keys(todosTimes).length > 1 &&!ehPremium()) {
  alert('Apenas 1 time no plano grátis. Seja Premium para criar mais times.');
  window.location.href = 'index.html';
  throw new Error('Limite de times atingido');
}

// ===== FUNÇÕES PRINCIPAIS =====
function salvar() {
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
    el.draggable = true;
    if (p.x == null || p.y == null) {
      p.x = 50;
      p.y = 80;
    }
    el.style.left = p.x + '%';
    el.style.top = p.y + '%';
    el.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', String(p.id));
      el.classList.add('is-dragging');
    };
    el.ondragend = () => el.classList.remove('is-dragging');
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
         ondragstart="event.dataTransfer.setData('text/plain', '${p.id}')">
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
    alert('Limite de 15 jogadores em campo. Seja Premium para mais.');
    return;
  }

  const rect = ev.currentTarget.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * 100;
  const y = ((ev.clientY - rect.top) / rect.height) * 100;

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
    // Botão direito do mouse ignora
    if (e.button && e.button!== 0) return;

    // Pega posição: touch ou mouse
    const point = e.touches? e.touches[0] : e;

    e.preventDefault();
    e.stopPropagation();

    fDragEl = el;
    fDragEl.classList.add('is-dragging');

    const r = document.getElementById('pitch-container').getBoundingClientRect();
    startX = point.clientX;
    startY = point.clientY;
    fOffX = point.clientX - r.left - parseFloat(fDragEl.style.left)/100 * r.width;
    fOffY = point.clientY - r.top - parseFloat(fDragEl.style.top)/100 * r.height;
  };

  // Mouse
  el.addEventListener('mousedown', startDrag);

  // Touch - Mobile
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
  const inside = point.clientX >= r.left && point.clientX <= r.right && point.clientY >= r.top && point.clientY <= r.bottom;

  if (inside) {
    e.preventDefault();
    const x = ((point.clientX - r.left - fOffX) / r.width) * 100;
    const y = ((point.clientY - r.top - fOffY) / r.height) * 100;
    fDragEl.style.left = Math.max(5, Math.min(95, x)) + '%';
    fDragEl.style.top = Math.max(5, Math.min(95, y)) + '%';
  }
};

const endDrag = (e) => {
  if (fDragEl) {
    fDragEl.classList.remove('is-dragging');

    if (fDragEl.dataset.moved === 'true') {
      const pitch = document.getElementById('pitch-container');
      if (pitch) {
        const point = e.changedTouches? e.changedTouches[0] : e;
        const r = pitch.getBoundingClientRect();
        const inside = point.clientX >= r.left && point.clientX <= r.right && point.clientY >= r.top && point.clientY <= r.bottom;

        if (inside) {
          const id = parseInt(fDragEl.dataset.id);
          const player = jogadores.find(p => p.id === id);
          if (player) {
            player.x = parseFloat(fDragEl.style.left);
            player.y = parseFloat(fDragEl.style.top);
            salvar();
          }
        }
      }
    }
    fDragEl.dataset.moved = 'false';
    fDragEl = null;
  }
};

// Mouse
document.addEventListener('mousemove', moveDrag);
document.addEventListener('mouseup', endDrag);

// Touch - Mobile
document.addEventListener('touchmove', moveDrag, { passive: false });
document.addEventListener('touchend', endDrag);

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.app-header h1');
  if (header) header.textContent = todosTimes[timeId].nome;

  const formSelect = document.getElementById('formation-select');
  if (formSelect) {
    formSelect.value = currentFormation;
    formSelect.onchange = changeFormation; // ← CHAMA A FUNÇÃO CERTA
  }

  const tipo = localStorage.getItem('premium_tipo');
  if (tipo) {
    const badge = document.getElementById('premium-badge');
    badge.textContent = tipo === 'vitalicio'? '👑 VITALÍCIO' : '⭐ PREMIUM';
    badge.classList.add('show');
  }

  // Eventos dos botões
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

  renderAll();
});


function debugPosicoes() {
  const coords = getFormationPositions('4-4-2');
  console.log('=== COORDENADAS 4-4-2 ===');
  coords.forEach((c, i) => {
    console.log(`Pos ${i}: x=${c.x} y=${c.y}`);
  });
  console.log('20 = esquerda, 80 = direita');
}
