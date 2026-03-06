function parseMatrix(text) {
  const lines = text.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { adj: [], existingNodes: new Set() };

  const matrix = lines.map((line) => line.split(/[,\s]+/).filter(Boolean).map(Number));
  const n = matrix.length;

  for (let i = 0; i < n; i++) {
    if (matrix[i].length !== n) throw new Error('Matricea trebuie sa fie patratica.');
    if (matrix[i].some((value) => Number.isNaN(value))) throw new Error('Matricea contine valori invalide.');
  }

  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] !== 0) adj[i].push(j);
    }
  }

  return {
    adj,
    existingNodes: new Set(Array.from({ length: n }, (_, i) => i)),
  };
}

function parseList(text) {
  const lines = text.trim().split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { adj: [], existingNodes: new Set() };

  const edgeMap = new Map();
  const definedNodes = new Set();
  const referencedNodes = new Set();

  for (const line of lines) {
    const match = line.match(/^(\d+)\s*:?(.*)$/);
    if (!match) continue;

    const from = Number(match[1]) - 1;
    if (from < 0 || Number.isNaN(from)) continue;
    definedNodes.add(from);

    const rest = match[2].trim();
    const neighbors = [];
    if (rest) {
      for (const token of rest.split(/[,\s]+/).filter(Boolean)) {
        const to = Number(token) - 1;
        if (to >= 0 && !Number.isNaN(to)) {
          neighbors.push(to);
          referencedNodes.add(to);
        }
      }
    }
    edgeMap.set(from, neighbors);
  }

  const allNodes = [...definedNodes, ...referencedNodes];
  const n = allNodes.length ? Math.max(...allNodes) + 1 : 0;
  const adj = Array.from({ length: n }, () => []);

  for (const [from, neighbors] of edgeMap.entries()) {
    const unique = [...new Set(neighbors)];
    adj[from] = unique;
  }

  return {
    adj,
    existingNodes: new Set(allNodes),
  };
}

function detectRoots(adj, existingNodes) {
  const nodes = [...existingNodes].sort((a, b) => a - b);
  if (!nodes.length) return [];

  let best = -1;
  const degree = new Map();
  for (const u of nodes) {
    const deg = (adj[u] || []).filter((v) => existingNodes.has(v)).length;
    degree.set(u, deg);
    best = Math.max(best, deg);
  }
  return nodes.filter((node) => degree.get(node) === best);
}

function buildTree(adj, root, existingNodes) {
  const visited = Array(adj.length).fill(false);
  const children = Array.from({ length: adj.length }, () => []);
  const depth = Array(adj.length).fill(-1);
  const order = [];

  function dfs(node, level) {
    visited[node] = true;
    depth[node] = level;
    order.push(node);

    const next = (adj[node] || [])
      .filter((neighbor) => existingNodes.has(neighbor) && !visited[neighbor])
      .sort((a, b) => a - b);

    for (const child of next) {
      children[node].push(child);
      dfs(child, level + 1);
    }
  }

  dfs(root, 0);
  return { children, depth, order, visited };
}

function createTreeStats(adj, tree, existingNodes) {
  const rows = tree.order.map((node) => {
    const children = tree.children[node];
    return {
      node: node + 1,
      degree: (adj[node] || []).filter((neighbor) => existingNodes.has(neighbor)).length,
      sonsCount: children.length,
      sons: children.map((child) => child + 1),
      isLeaf: children.length === 0,
    };
  });

  const leaves = rows.filter((row) => row.isLeaf).length;
  const unreachable = [...existingNodes].filter((node) => !tree.visited[node]);
  return { rows, leaves, unreachable };
}

function drawAsciiTree(tree, root) {
  const lines = [];

  function walk(node, prefix, isLast) {
    lines.push(`${prefix}${isLast ? '└── ' : '├── '}${node + 1}`);
    const children = tree.children[node];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      walk(child, `${prefix}${isLast ? '    ' : '│   '}`, i === children.length - 1);
    }
  }

  walk(root, '', true);
  return lines.join('\n').replace(/^└── /, '');
}

function drawGraphAdjList(adj, existingNodes) {
  const nodes = [...existingNodes].sort((a, b) => a - b);
  return nodes
    .map((node) => `${node + 1}: ${((adj[node] || []).map((x) => x + 1).join(', ')) || '-'}`)
    .join('\n');
}

function computeTreeLayout(tree, root, width, height) {
  const rawX = new Map();
  let cursor = 0;
  let maxDepth = 0;

  function place(node, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const children = tree.children[node];
    if (!children.length) {
      rawX.set(node, cursor++);
      return;
    }

    for (const child of children) place(child, depth + 1);
    const first = rawX.get(children[0]);
    const last = rawX.get(children[children.length - 1]);
    rawX.set(node, (first + last) / 2);
  }

  place(root, 0);
  const totalSpan = Math.max(1, cursor - 1);
  const maxDepthSafe = Math.max(1, maxDepth);
  const positions = {};
  const paddingX = 52;
  const paddingY = 46;

  for (const node of tree.order) {
    const xNorm = rawX.get(node) / totalSpan;
    const yNorm = tree.depth[node] / maxDepthSafe;
    positions[node] = {
      x: paddingX + xNorm * (width - 2 * paddingX),
      y: paddingY + yNorm * (height - 2 * paddingY),
    };
  }

  return positions;
}

function getEdgeList(adj, existingNodes) {
  const edges = [];
  const seen = new Set();
  const nodes = [...existingNodes];

  for (const u of nodes) {
    for (const v of adj[u] || []) {
      if (!existingNodes.has(v)) continue;
      const a = Math.min(u, v);
      const b = Math.max(u, v);
      const key = `${a}|${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  }

  return edges;
}

function forceLayout(existingNodes, edges, width, height) {
  const nodes = [...existingNodes].sort((a, b) => a - b);
  const positions = {};
  const velocity = {};
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(70, Math.min(width, height) / 2 - 56);
  const padding = 30;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const angle = (2 * Math.PI * i) / Math.max(1, nodes.length);
    positions[node] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
    velocity[node] = { x: 0, y: 0 };
  }

  const area = width * height;
  const ideal = Math.sqrt(area / Math.max(1, nodes.length));

  for (let iter = 0; iter < 280; iter++) {
    const force = {};
    for (const n of nodes) force[n] = { x: 0, y: 0 };

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const repulse = (ideal * ideal) / dist;
        const fx = (dx / dist) * repulse;
        const fy = (dy / dist) * repulse;
        force[a].x += fx;
        force[a].y += fy;
        force[b].x -= fx;
        force[b].y -= fy;
      }
    }

    for (const [u, v] of edges) {
      const dx = positions[v].x - positions[u].x;
      const dy = positions[v].y - positions[u].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const attract = (dist * dist) / Math.max(1, ideal);
      const fx = (dx / dist) * attract * 0.025;
      const fy = (dy / dist) * attract * 0.025;
      force[u].x += fx;
      force[u].y += fy;
      force[v].x -= fx;
      force[v].y -= fy;
    }

    const cooling = 0.88;
    for (const node of nodes) {
      velocity[node].x = (velocity[node].x + force[node].x * 0.01) * cooling;
      velocity[node].y = (velocity[node].y + force[node].y * 0.01) * cooling;
      positions[node].x += velocity[node].x;
      positions[node].y += velocity[node].y;
      positions[node].x = Math.max(padding, Math.min(width - padding, positions[node].x));
      positions[node].y = Math.max(padding, Math.min(height - padding, positions[node].y));
    }
  }

  return positions;
}

function renderSVG(adj, type, root, existingNodes, width = 780, height = 380) {
  const nodeStroke = '#818cf8';
  const nodeFill = 'rgba(79,70,229,0.2)';
  const textColor = '#e2e8f0';
  const edgeColor = '#6366f1';
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family:sans-serif">`;

  if (type === 'arbore' && root >= 0) {
    const tree = buildTree(adj, root, existingNodes);
    const positions = computeTreeLayout(tree, root, width, height);

    for (const node of tree.order) {
      for (const child of tree.children[node]) {
        svg += `<line x1="${positions[node].x}" y1="${positions[node].y}" x2="${positions[child].x}" y2="${positions[child].y}" stroke="${edgeColor}" stroke-width="1.8"/>`;
      }
    }

    for (const node of tree.order) {
      svg += `<circle cx="${positions[node].x}" cy="${positions[node].y}" r="18" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="2.5"/>`;
      svg += `<text x="${positions[node].x}" y="${positions[node].y + 6}" font-size="15" text-anchor="middle" fill="${textColor}" font-weight="700">${node + 1}</text>`;
    }

    const detached = [...existingNodes].filter((node) => !tree.visited[node]);
    if (detached.length) {
      const bandY = height - 28;
      const step = width / (detached.length + 1);
      for (let i = 0; i < detached.length; i++) {
        const node = detached[i];
        const x = step * (i + 1);
        svg += `<circle cx="${x}" cy="${bandY}" r="15" fill="rgba(71,85,105,0.4)" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"/>`;
        svg += `<text x="${x}" y="${bandY + 5}" font-size="13" text-anchor="middle" fill="#cbd5e1">${node + 1}</text>`;
      }
    }
  } else {
    const edges = getEdgeList(adj, existingNodes);
    const positions = forceLayout(existingNodes, edges, width, height);

    for (const [u, v] of edges) {
      svg += `<line x1="${positions[u].x}" y1="${positions[u].y}" x2="${positions[v].x}" y2="${positions[v].y}" stroke="${edgeColor}" stroke-width="1.7"/>`;
    }

    for (const node of [...existingNodes].sort((a, b) => a - b)) {
      svg += `<circle cx="${positions[node].x}" cy="${positions[node].y}" r="18" fill="${nodeFill}" stroke="${nodeStroke}" stroke-width="2.5"/>`;
      svg += `<text x="${positions[node].x}" y="${positions[node].y + 6}" font-size="15" text-anchor="middle" fill="${textColor}" font-weight="700">${node + 1}</text>`;
    }
  }

  svg += '</svg>';
  return svg;
}

const inputArea = document.getElementById('inputArea');
const parseBtn = document.getElementById('parseBtn');
const asciiOut = document.getElementById('asciiOut');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMsg = document.getElementById('statusMsg');
const svgOut = document.getElementById('svgOut');
const toggleModeBtn = document.getElementById('toggleModeBtn');
const structureInputs = document.querySelectorAll('input[name="structure"]');
const rootInput = document.getElementById('rootInput');
const rootNodeInput = document.getElementById('rootNode');
const analysisDiv = document.getElementById('analysis');
const toggleStatsBtn = document.getElementById('toggleStatsBtn');
const treeStatsPanel = document.getElementById('treeStatsPanel');
const generatedBlock = document.getElementById('generatedBlock');
const generatedList = document.getElementById('generatedList');
const generatedMatrix = document.getElementById('generatedMatrix');
const introOverlay = document.getElementById('introOverlay');
const introStructure = document.getElementById('introStructure');
const introFormat = document.getElementById('introFormat');
const introPreview = document.getElementById('introPreview');
const introStartBtn = document.getElementById('introStartBtn');

let currentMode = 'ascii';
let lastAdj = [];
let lastType = 'graf';
let lastRoot = -1;
let lastExistingNodes = new Set();
let statsVisible = false;

function showStatus(message, ok = true) {
  statusMsg.textContent = message;
  statusMsg.style.color = ok ? '#1756e9' : '#e0195a';
}

function getSample(structure, format) {
  if (structure === 'arbore' && format === 'list') {
    return '1: 2 3\n2: 4 5\n3: 6\n4:\n5:\n6:';
  }
  if (structure === 'arbore' && format === 'matrix') {
    return '0 1 1 0 0\n0 0 0 1 1\n0 0 0 0 0\n0 0 0 0 0\n0 0 0 0 0';
  }
  if (structure === 'graf' && format === 'list') {
    return '1: 2 3\n2: 1 4\n3: 1 4 5\n4: 2 3 5\n5: 3 4';
  }
  return '0 1 1 0 0\n1 0 1 1 0\n1 1 0 1 1\n0 1 1 0 1\n0 0 1 1 0';
}

function syncRootInputVisibility() {
  const type = document.querySelector('input[name="structure"]:checked').value;
  rootInput.style.display = type === 'arbore' ? '' : 'none';
  if (type !== 'arbore') rootNodeInput.value = '';
}

function setRadioValue(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

function updateIntroPreview() {
  introPreview.textContent = getSample(introStructure.value, introFormat.value);
}

function parseInput(text, format) {
  return format === 'matrix' ? parseMatrix(text) : parseList(text);
}

function adjToListText(adj, existingNodes) {
  const nodes = [...existingNodes].sort((a, b) => a - b);
  return nodes
    .map((node) => `${node + 1}: ${((adj[node] || []).filter((x) => existingNodes.has(x)).map((x) => x + 1).join(' ')) || ''}`)
    .join('\n');
}

function adjToMatrixText(adj, existingNodes) {
  const nodes = [...existingNodes].sort((a, b) => a - b);
  const idx = new Map(nodes.map((node, i) => [node, i]));
  const n = nodes.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));

  for (const from of nodes) {
    for (const to of adj[from] || []) {
      if (!idx.has(to)) continue;
      matrix[idx.get(from)][idx.get(to)] = 1;
      matrix[idx.get(to)][idx.get(from)] = 1;
    }
  }
  return matrix.map((row) => row.join(' ')).join('\n');
}

function updateGeneratedRepresentations(adj, existingNodes) {
  generatedList.textContent = adjToListText(adj, existingNodes);
  generatedMatrix.textContent = adjToMatrixText(adj, existingNodes);
  generatedBlock.style.display = '';
}

function setTreeStats(treeStats) {
  const rows = treeStats.rows
    .map((row) => `<tr><td>${row.node}</td><td>${row.degree}</td><td>${row.sonsCount}</td><td>${row.sons.length ? row.sons.join(', ') : '—'}</td><td>${row.isLeaf ? 'Da' : 'Nu'}</td></tr>`)
    .join('');

  treeStatsPanel.innerHTML = `<strong>Numar frunze:</strong> ${treeStats.leaves}<br><strong>Detalii pe nod:</strong><table><tr><th>Nod</th><th>Grad</th><th>Nr. fii</th><th>Fii</th><th>Frunza?</th></tr>${rows}</table>`;
  toggleStatsBtn.style.display = '';
  toggleStatsBtn.textContent = statsVisible ? 'Ascunde statistici arbore' : 'Arata statistici arbore';
  treeStatsPanel.style.display = statsVisible ? '' : 'none';
}

function hideTreeStats() {
  statsVisible = false;
  treeStatsPanel.style.display = 'none';
  treeStatsPanel.innerHTML = '';
  toggleStatsBtn.style.display = 'none';
  toggleStatsBtn.textContent = 'Arata statistici arbore';
}

function parseAndDraw() {
  try {
    const format = document.querySelector('input[name="format"]:checked').value;
    const type = document.querySelector('input[name="structure"]:checked').value;
    const text = inputArea.value.trim() || getSample(type, format);
    if (!inputArea.value.trim()) {
      inputArea.value = text;
      showStatus('Input gol detectat. Am completat automat un exemplu.', true);
    }
    const { adj, existingNodes } = parseInput(text, format);

    if (!existingNodes.size) throw new Error('Nu s-au gasit noduri valide in input.');
    updateGeneratedRepresentations(adj, existingNodes);

    let root = -1;
    if (type === 'arbore') {
      if (rootNodeInput.value.trim()) {
        const rootValue = Number(rootNodeInput.value);
        if (!Number.isInteger(rootValue) || rootValue < 1) throw new Error('Radacina trebuie sa fie un numar intreg >= 1.');
        root = rootValue - 1;
        if (!existingNodes.has(root)) throw new Error('Radacina trebuie sa fie un nod existent in input.');
      } else {
        const candidates = detectRoots(adj, existingNodes);
        if (!candidates.length) throw new Error('Nu s-a putut detecta radacina automat.');
        root = candidates[0];
        rootNodeInput.value = String(root + 1);
      }
    }

    lastAdj = adj;
    lastType = type;
    lastRoot = root;
    lastExistingNodes = existingNodes;

    if (type === 'arbore') {
      const tree = buildTree(adj, root, existingNodes);
      const treeStats = createTreeStats(adj, tree, existingNodes);
      setTreeStats(treeStats);

      const reachable = tree.order.length;
      const total = existingNodes.size;
      let summary = `<strong>Radacina:</strong> ${root + 1}<br><strong>Noduri vizitate din radacina:</strong> ${reachable}/${total}`;
      if (treeStats.unreachable.length) {
        summary += `<br><strong>Atentie:</strong> nodurile ${treeStats.unreachable.map((x) => x + 1).join(', ')} nu sunt conectate la radacina.`;
      }
      analysisDiv.innerHTML = summary;

      if (currentMode === 'ascii') {
        asciiOut.textContent = drawAsciiTree(tree, root);
        asciiOut.parentElement.style.display = '';
        svgOut.style.display = 'none';
      } else {
        svgOut.innerHTML = renderSVG(adj, type, root, existingNodes, 780, 380);
        svgOut.style.display = '';
        asciiOut.parentElement.style.display = 'none';
      }
    } else {
      hideTreeStats();
      analysisDiv.innerHTML = `<strong>Noduri detectate:</strong> ${existingNodes.size}`;

      if (currentMode === 'ascii') {
        asciiOut.textContent = drawGraphAdjList(adj, existingNodes);
        asciiOut.parentElement.style.display = '';
        svgOut.style.display = 'none';
      } else {
        svgOut.innerHTML = renderSVG(adj, type, root, existingNodes, 780, 380);
        svgOut.style.display = '';
        asciiOut.parentElement.style.display = 'none';
      }
    }

    showStatus('Structura a fost generata cu succes.', true);
  } catch (error) {
    asciiOut.textContent = '(eroare la parse)';
    svgOut.innerHTML = '';
    analysisDiv.innerHTML = '';
    hideTreeStats();
    showStatus(`Eroare: ${error.message}`, false);
  }
}

for (const input of structureInputs) {
  input.addEventListener('change', syncRootInputVisibility);
}

toggleStatsBtn.addEventListener('click', () => {
  statsVisible = !statsVisible;
  treeStatsPanel.style.display = statsVisible ? '' : 'none';
  toggleStatsBtn.textContent = statsVisible ? 'Ascunde statistici arbore' : 'Arata statistici arbore';
});

parseBtn.addEventListener('click', parseAndDraw);

clearBtn.addEventListener('click', () => {
  inputArea.value = '';
  rootNodeInput.value = '';
  asciiOut.textContent = '(apasa Parse & Draw pentru a genera)';
  svgOut.innerHTML = '';
  analysisDiv.innerHTML = '';
  generatedList.textContent = '';
  generatedMatrix.textContent = '';
  generatedBlock.style.display = 'none';
  hideTreeStats();
  showStatus('');
});

copyBtn.addEventListener('click', () => {
  const text = currentMode === 'ascii' ? asciiOut.textContent : svgOut.innerHTML;
  navigator.clipboard.writeText(text).then(() => {
    const original = copyBtn.textContent;
    copyBtn.textContent = currentMode === 'ascii' ? 'ASCII copiat' : 'SVG copiat';
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 900);
  }).catch(() => {
    copyBtn.textContent = 'Copy failed';
    setTimeout(() => {
      copyBtn.textContent = 'Copy ASCII';
    }, 900);
  });
});

toggleModeBtn.addEventListener('click', () => {
  currentMode = currentMode === 'ascii' ? 'svg' : 'ascii';
  toggleModeBtn.textContent = `Mod: ${currentMode === 'ascii' ? 'ASCII' : 'Grafic'}`;
  if (lastExistingNodes.size) parseAndDraw();
});

[introStructure, introFormat].forEach((control) => {
  control.addEventListener('change', updateIntroPreview);
});

introStartBtn.addEventListener('click', () => {
  setRadioValue('structure', introStructure.value);
  setRadioValue('format', introFormat.value);
  syncRootInputVisibility();
  inputArea.value = getSample(introStructure.value, introFormat.value);
  if (introStructure.value === 'arbore' && !rootNodeInput.value) rootNodeInput.value = '1';

  introOverlay.classList.add('hide');
  setTimeout(() => {
    introOverlay.style.display = 'none';
    inputArea.focus();
  }, 260);
});

syncRootInputVisibility();
updateIntroPreview();