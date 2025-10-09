// Helpers: parse input formats into adjacency list
function parseMatrix(text){
  const lines = text.trim().split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length===0) return [];
  const mat = lines.map(l => l.split(/[,\s]+/).filter(Boolean).map(x=>Number(x)));
  const n = mat.length;
  for(let i=0;i<n;i++) if(mat[i].length!==n) throw new Error('Matricea nu e pătratică.');
  const adj = Array.from({length:n}, ()=>[]);
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      if(mat[i][j]) adj[i].push(j);
    }
  }
  return adj;
}

function parseList(text){
  const lines = text.trim().split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const adj = [];
  for(const l of lines){
    const m = l.match(/^\s*(\d+)\s*:?(.*)$/);
    if(!m) continue;
    const idx = Number(m[1]) - 1;
    const rest = m[2].trim();
    if(!adj[idx]) adj[idx]=[];
    if(rest==='') continue;
    const parts = rest.split(/[,\s]+/).filter(Boolean);
    for(const p of parts){
      const to = Number(p) - 1;
      if(!isNaN(to)) adj[idx].push(to);
    }
  }
  const n = Math.max(adj.length, ...adj.map(a=>a?Math.max(-1,...a):-1)+1);
  while(adj.length<n) adj.push([]);
  return adj;
}

// Layout nodes on a circle mapped to character grid
function layoutNodes(n, W, H){
  const cx = Math.floor(W/2), cy = Math.floor(H/2);
  const r = Math.min(W,H)/2 - 6;
  const positions = [];
  for(let i=0;i<n;i++){
    const theta = (2*Math.PI*i)/n - Math.PI/2;
    const x = Math.round(cx + (r * Math.cos(theta)));
    const y = Math.round(cy + (r * Math.sin(theta)));
    positions.push({x,y});
  }
  return positions;
}

// draw line between two grid points using simple integer interpolation
function drawLine(grid, x0,y0,x1,y1, directed=false){
  const dx = x1-x0, dy = y1-y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if(steps===0) return;
  for(let s=0;s<=steps;s++){
    const t = s/steps;
    const x = Math.round(x0 + dx*t);
    const y = Math.round(y0 + dy*t);
    if(x<0||y<0||y>=grid.length||x>=grid[0].length) continue;
    if(grid[y][x] === ' ') {
      if(Math.abs(dx) > Math.abs(dy)) grid[y][x] = '-';
      else if(Math.abs(dy) > Math.abs(dx)) grid[y][x] = '|';
      else grid[y][x] = (dx*dy>0)?'\\':'/';
    }
  }
  // arrowhead for directed graph
  if(directed){
    const ax = Math.round(x1 - Math.sign(dx));
    const ay = Math.round(y1 - Math.sign(dy));
    if(ax>=0 && ay>=0 && ay<grid.length && ax<grid[0].length) grid[ay][ax] = '>';
  }
}

function renderASCII(adj, directed=false, W=95, H=32){
  const n = adj.length;
  const grid = Array.from({length:H}, ()=>Array.from({length:W}, ()=>' '));
  const pos = layoutNodes(n, W, H);
  for(let i=0;i<n;i++){
    const {x,y} = pos[i];
    const label = String(i+1);
    for(let k=0;k<label.length;k++){
      const xx = x + k - Math.floor(label.length/2);
      if(xx>=0 && xx<W && y>=0 && y<H) grid[y][xx] = label[k];
    }
  }
  const drawn = new Set();
  for(let i=0;i<n;i++){
    for(const j of (adj[i]||[])){
      if(j<0||j>=n) continue;
      const key = i<j ? `${i},${j}` : `${j},${i}`;
      if(!directed && drawn.has(key)) continue;
      drawLine(grid, pos[i].x, pos[i].y, pos[j].x, pos[j].y, directed);
      drawn.add(key);
    }
  }
  return grid.map(row=>row.join('')).join('\n');
}

// SVG rendering (basic, circular layout)
function renderSVG(adj, directed=false, W=780, H=340){
  const n = adj.length;
  const cx = W/2, cy = H/2;
  const r = Math.min(W,H)/2 - 38;
  const pos = [];
  for(let i=0;i<n;i++){
    const theta = (2*Math.PI*i)/n - Math.PI/2;
    const x = cx + (r * Math.cos(theta));
    const y = cy + (r * Math.sin(theta));
    pos.push({x,y});
  }
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:sans-serif">`;
  // edges
  for(let i=0;i<n;i++){
    for(const j of (adj[i]||[])){
      if(j<0||j>=n) continue;
      if(!directed && j<i) continue;
      const from = pos[i], to = pos[j];
      let arrow = '';
      if(directed){
        const dx = to.x-from.x, dy = to.y-from.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        const ax = to.x - 18*(dx/d), ay = to.y - 18*(dy/d);
        arrow = `<polygon points="${ax},${ay} ${ax-6*(dy/d)},${ay+6*(dx/d)} ${ax+6*(dy/d)},${ay-6*(dx/d)}" fill="#1756e9"/>`;
      }
      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#2556cc" stroke-width="2"/>${arrow}`;
    }
  }
  // nodes
  for(let i=0;i<n;i++){
    svg += `<circle cx="${pos[i].x}" cy="${pos[i].y}" r="18" fill="#fff" stroke="#1756e9" stroke-width="3"/>
            <text x="${pos[i].x}" y="${pos[i].y+7}" font-size="1.2em" text-anchor="middle" fill="#1756e9">${i+1}</text>`;
  }
  svg += '</svg>';
  return svg;
}

// UI wiring
const inputArea = document.getElementById('inputArea');
const parseBtn = document.getElementById('parseBtn');
const asciiOut = document.getElementById('asciiOut');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMsg = document.getElementById('statusMsg');
const svgOut = document.getElementById('svgOut');
const toggleModeBtn = document.getElementById('toggleModeBtn');

let currentMode = 'ascii'; // 'ascii' or 'svg'
let lastAdj = []; let lastDirected = false;

function showStatus(msg, ok=true) {
  statusMsg.textContent = msg;
  statusMsg.style.color = ok ? "#1756e9" : "#e0195a";
}

function parseAndDraw(){
  try{
    const format = document.querySelector('input[name=format]:checked').value;
    const directed = document.querySelector('input[name=directed]:checked').value === 'true';
    const text = inputArea.value;
    let adj = [];
    if(format==='matrix') adj = parseMatrix(text);
    else adj = parseList(text);
    if(adj.length===0) throw new Error('Nicio muchie sau nod găsit.');
    lastAdj = adj; lastDirected = directed;
    if(currentMode==='ascii'){
      asciiOut.textContent = renderASCII(adj, directed, 95, 32);
      asciiOut.parentElement.style.display = '';
      svgOut.style.display = 'none';
    }else{
      svgOut.innerHTML = renderSVG(adj, directed, 780, 340);
      svgOut.style.display = '';
      asciiOut.parentElement.style.display = 'none';
    }
    showStatus('Graful a fost generat cu succes.', true);
  }catch(err){
    asciiOut.textContent = '(eroare la parse)';
    svgOut.innerHTML = '';
    showStatus('Eroare: ' + err.message, false);
  }
}

parseBtn.addEventListener('click', parseAndDraw);

clearBtn.addEventListener('click', ()=>{
  inputArea.value='';
  asciiOut.textContent='(apasă Parse & Draw pentru a genera)';
  svgOut.innerHTML='';
  showStatus('');
});

copyBtn.addEventListener('click', ()=>{
  if(currentMode==='ascii'){
    navigator.clipboard.writeText(asciiOut.textContent).then(()=>{
      copyBtn.textContent='Copied!';
      setTimeout(()=>copyBtn.textContent='Copy ASCII',900);
    }).catch(()=>{
      copyBtn.textContent='Copy failed';
      setTimeout(()=>copyBtn.textContent='Copy ASCII',900);
    });
  }else{
    // SVG export (as text)
    const svgText = svgOut.innerHTML;
    navigator.clipboard.writeText(svgText).then(()=>{
      copyBtn.textContent='SVG Copied!';
      setTimeout(()=>copyBtn.textContent='Copy ASCII',900);
    }).catch(()=>{
      copyBtn.textContent='Copy failed';
      setTimeout(()=>copyBtn.textContent='Copy ASCII',900);
    });
  }
});

// Mode toggle (ASCII/SVG)
toggleModeBtn.addEventListener('click', ()=>{
  currentMode = (currentMode==='ascii') ? 'svg' : 'ascii';
  toggleModeBtn.textContent = `Mod: ${currentMode==='ascii' ? 'ASCII' : 'Grafic'}`;
  if(lastAdj.length) parseAndDraw();
  else {
    asciiOut.parentElement.style.display = currentMode==='ascii' ? '' : 'none';
    svgOut.style.display = currentMode==='svg' ? '' : 'none';
  }
});

inputArea.value = '0 1 0 1\n1 0 1 0\n0 1 0 1\n1 0 1 0';

// --- Analiza de probleme ---
const problems = {
  deg0: {
    title: "Număr maxim de noduri de grad 0",
    desc: `Într-un graf neorientat cu n noduri și m muchii, numărul maxim de noduri cu grad 0 se obține concentrând toate muchiile în cât mai puține noduri:
<ul>
  <li>Suma gradelor = 2m</li>
  <li>Caută cel mai mic <b>k</b> cu k*(k-1)/2 ≥ m</li>
  <li>Numărul maxim de noduri de grad 0 = n - k</li>
</ul>`,
    form: `<label>Număr noduri (n): <input type="number" id="deg0_n" value="10" min="1"></label>
           <label>Număr muchii (m): <input type="number" id="deg0_m" value="7" min="0"></label>
           <button id="deg0_calc">Calculează</button>`,
    calc: function() {
      const n = Number(document.getElementById('deg0_n').value);
      const m = Number(document.getElementById('deg0_m').value);
      let k = 1;
      while (k*(k-1)/2 < m) k++;
      return `Max noduri grad 0: <b>${n-k}</b> (toate muchiile pot fi concentrate între cele ${k} noduri)`;
    }
  },
  strcpy: {
    title: "Efect instrucțiune strcpy(s+2, s+4)",
    desc: `strcpy(s+2, s+4) copiază caracterele din poziția 4 în poziția 2, suprascriind și trunchiind șirul.
      <br>Exemplu: <code>s = "abcdefgh"</code> → <code>strcpy(s+2, s+4)</code> → <code>s = "abefgh"</code>`,
    form: `<label>Șir inițial: <input type="text" id="strcpy_s" value="abcdefgh"></label>
           <label>Dest offset (s+): <input type="number" id="strcpy_d" value="2" min="0"></label>
           <label>Sursă offset (s+): <input type="number" id="strcpy_s_off" value="4" min="0"></label>
           <button id="strcpy_calc">Calculează</button>`,
    calc: function() {
      let s = document.getElementById('strcpy_s').value;
      let d = Number(document.getElementById('strcpy_d').value);
      let soff = Number(document.getElementById('strcpy_s_off').value);
      let result = s.slice(0, d) + s.slice(soff);
      return `Rezultat: <code>${result}</code>`;
    }
  },
  outdeg: {
    title: "Grad extern maxim într-un graf orientat",
    desc: `Pentru un graf orientat cu n noduri și m muchii, suma gradelor externe = m. Dacă 3 vârfuri au grad intern = 1, restul grad intern ≥ 0.<br>
Distribuie muchiile astfel încât să maximizezi gradul extern al unui vârf.`,
    form: `<label>Număr noduri (n): <input type="number" id="outdeg_n" value="6" min="1"></label>
           <label>Număr muchii (m): <input type="number" id="outdeg_m" value="6" min="0"></label>
           <label>Noduri cu grad intern 1: <input type="number" id="outdeg_gi1" value="3" min="0"></label>
           <button id="outdeg_calc">Calculează</button>`,
    calc: function() {
      const n = Number(document.getElementById('outdeg_n').value);
      const m = Number(document.getElementById('outdeg_m').value);
      const gi1 = Number(document.getElementById('outdeg_gi1').value);
      // grad extern maxim = m - (n-1) (toate muchiile pleacă dintr-un vârf, restul grad extern minim)
      const rest = m - gi1;
      return `Grad extern maxim posibil: <b>${rest}</b>`;
    }
  }
};

function renderProblemTab(tab) {
  const pc = document.getElementById('problemContent');
  const p = problems[tab];
  pc.innerHTML = `<h3>${p.title}</h3><div>${p.desc}</div>
    <form class="analysis-form">${p.form}</form>
    <div class="result-block" id="analysisResult"></div>`;
  // set up calc button
  if(tab==="deg0") document.getElementById('deg0_calc').onclick = () => {
    document.getElementById('analysisResult').innerHTML = problems.deg0.calc();
  };
  else if(tab==="strcpy") document.getElementById('strcpy_calc').onclick = () => {
    document.getElementById('analysisResult').innerHTML = problems.strcpy.calc();
  };
  else if(tab==="outdeg") document.getElementById('outdeg_calc').onclick = () => {
    document.getElementById('analysisResult').innerHTML = problems.outdeg.calc();
  };
}

// Tabs logic
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = function() {
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    this.classList.add('active');
    renderProblemTab(this.dataset.problem);
  }
});
// Default tab
renderProblemTab('deg0');
document.querySelector('.tab-btn[data-problem="deg0"]').classList.add('active');