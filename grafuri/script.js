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

// Detect root for arbore
function detectRoot(adj, oriented){
  const n = adj.length;
  if(oriented){
    const indeg = Array(n).fill(0);
    for(let i=0;i<n;i++) for(let j of adj[i]) indeg[j]++;
    const roots = [];
    for(let i=0;i<n;i++) if(indeg[i]===0) roots.push(i);
    return roots;
  }else{
    const deg = adj.map(neigh=>neigh.length);
    let maxDeg = Math.max(...deg);
    let roots = [];
    for(let i=0;i<n;i++) if(deg[i]===maxDeg) roots.push(i);
    return roots;
  }
}

// Analyze tree (DFS)
function analyzeTree(adj, root){
  const n = adj.length, visited = Array(n).fill(false);
  const children = Array.from({length:n},()=>[]);
  let order = [];
  function dfs(u){
    visited[u]=true; order.push(u);
    for(let v of adj[u]){
      if(!visited[v]){
        children[u].push(v);
        dfs(v);
      }
    }
  }
  dfs(root);
  const props = order.map(u=>{
    return {node:u+1, grad:adj[u].length, children:children[u].map(x=>x+1), leaf:children[u].length===0};
  });
  return props;
}

// ASCII Tree (pentru arbore)
function drawAsciiTree(adj, root){
  let lines = [];
  function go(u, prefix, isLast, visited){
    lines.push(prefix+(isLast?'└── ':'├── ')+ (u+1));
    visited[u]=true;
    const ch = adj[u].filter(v=>!visited[v]);
    for(let i=0;i<ch.length;i++){
      let newPrefix = prefix+(isLast?'    ':'│   ');
      go(ch[i], newPrefix, i===ch.length-1, visited);
    }
  }
  go(root, '', true, Array(adj.length).fill(false));
  return lines.join('\n').replace(/^└── /,'');
}

// Fallback: listă adiacență
function drawGraphAdjList(adj){
  let out = [];
  for(let i=0;i<adj.length;i++){
    out.push((i+1)+': '+(adj[i].map(x=>x+1).join(', ') || '-'));
  }
  return out.join('\n');
}

// SVG rendering (circular for graf, ierarhic for arbore)
function renderSVG(adj, type, root, directed=false, W=780, H=340){
  const n = adj.length;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:sans-serif">`;
  if(type==='arbore' && typeof root==='number' && root>=0){
    // Arbore ierarhic
    const props = analyzeTree(adj, root);
    let levels = [], nodeLevel = Array(n).fill(-1);
    function setLevels(u, lvl){
      if(!levels[lvl]) levels[lvl]=[];
      levels[lvl].push(u);
      nodeLevel[u]=lvl;
      for(let v of adj[u]) if(nodeLevel[v]==-1) setLevels(v, lvl+1);
    }
    setLevels(root, 0);
    const dy = 80, dx = W/Math.max(1,levels.reduce((max,lvl)=>Math.max(max,lvl.length),0));
    let positions = {};
    levels.forEach((lvl, y)=>{
      lvl.forEach((u, i)=>{
        positions[u] = {x: dx/2 + i*dx, y: 60+y*dy};
        svg += `<circle cx="${positions[u].x}" cy="${positions[u].y}" r="18" fill="#fff" stroke="#1756e9" stroke-width="3"/>
          <text x="${positions[u].x}" y="${positions[u].y+7}" font-size="1.2em" text-anchor="middle" fill="#1756e9">${u+1}</text>`;
      });
    });
    for(let u=0;u<n;u++) for(let v of adj[u]){
      svg += `<line x1="${positions[u].x}" y1="${positions[u].y}" x2="${positions[v].x}" y2="${positions[v].y}" stroke="#2556cc" stroke-width="2"/>`;
    }
  }else{
    // Graf circular
    const cx = W/2, cy = H/2;
    const r = Math.min(W,H)/2 - 38;
    const pos = [];
    for(let i=0;i<n;i++){
      const theta = (2*Math.PI*i)/n - Math.PI/2;
      const x = cx + (r * Math.cos(theta));
      const y = cy + (r * Math.sin(theta));
      pos.push({x,y});
    }
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
    for(let i=0;i<n;i++){
      svg += `<circle cx="${pos[i].x}" cy="${pos[i].y}" r="18" fill="#fff" stroke="#1756e9" stroke-width="3"/>
              <text x="${pos[i].x}" y="${pos[i].y+7}" font-size="1.2em" text-anchor="middle" fill="#1756e9">${i+1}</text>`;
    }
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
const structureInputs = document.querySelectorAll('input[name="structure"]');
const rootInput = document.getElementById('rootInput');
const rootNodeInput = document.getElementById('rootNode');
const analysisDiv = document.getElementById('analysis');

let currentMode = 'ascii'; // 'ascii' or 'svg'
let lastAdj = []; let lastDirected = false; let lastType = 'graf'; let lastRoot = -1;

function showStatus(msg, ok=true) {
  statusMsg.textContent = msg;
  statusMsg.style.color = ok ? "#1756e9" : "#e0195a";
}

// show/hide rădăcină input
structureInputs.forEach(inp => {
  inp.addEventListener('change', ()=>{
    if(document.querySelector('input[name="structure"]:checked').value==='arbore')
      rootInput.style.display = '';
    else rootInput.style.display = 'none';
  });
});

function parseAndDraw(){
  try{
    const format = document.querySelector('input[name=format]:checked').value;
    const directed = document.querySelector('input[name=directed]:checked').value === 'true';
    const type = document.querySelector('input[name="structure"]:checked').value;
    const text = inputArea.value;
    let adj = [];
    if(format==='matrix') adj = parseMatrix(text);
    else adj = parseList(text);
    if(adj.length===0) throw new Error('Nicio muchie sau nod găsit.');
    let root = -1;
    if(type==='arbore'){
      if(rootNodeInput.value){
        root = Number(rootNodeInput.value)-1;
        if(root<0||root>=adj.length) throw new Error('Rădăcină invalidă!');
      }else{
        const possibleRoots = detectRoot(adj, directed);
        if(possibleRoots.length===0) throw new Error('Nu s-a detectat nicio rădăcină!');
        root = possibleRoots[0];
      }
    }
    lastAdj = adj; lastDirected = directed; lastType = type; lastRoot = root;
    // output
    let analysis = '';
    if(type==='arbore'){
      const props = analyzeTree(adj, root);
      let frunze = props.filter(x=>x.leaf).length;
      analysis = `<strong>Rădăcină:</strong> ${root+1}<br>
      <strong>Număr frunze:</strong> ${frunze}<br>
      <strong>Structură:</strong>
      <table><tr><th>Nod</th><th>Grad</th><th>Fii</th><th>Frunză?</th></tr>`;
      props.forEach(x=>{
        analysis+=`<tr><td>${x.node}</td><td>${x.grad}</td><td>${x.children.length?x.children.join(', '):'—'}</td><td>${x.leaf?'Da':'Nu'}</td></tr>`;
      });
      analysis+='</table>';
    }else analysis = '';
    analysisDiv.innerHTML = analysis;

    if(currentMode==='ascii'){
      asciiOut.textContent = (type==='arbore') ? drawAsciiTree(adj, root) : drawGraphAdjList(adj);
      asciiOut.parentElement.style.display = '';
      svgOut.style.display = 'none';
    }else{
      svgOut.innerHTML = renderSVG(adj, type, root, directed, 780, 340);
      svgOut.style.display = '';
      asciiOut.parentElement.style.display = 'none';
    }
    showStatus('Structura a fost generată cu succes.', true);
  }catch(err){
    asciiOut.textContent = '(eroare la parse)';
    svgOut.innerHTML = '';
    analysisDiv.innerHTML = '';
    showStatus('Eroare: ' + err.message, false);
  }
}

parseBtn.addEventListener('click', parseAndDraw);

clearBtn.addEventListener('click', ()=>{
  inputArea.value='';
  asciiOut.textContent='(apasă Parse & Draw pentru a genera)';
  svgOut.innerHTML='';
  analysisDiv.innerHTML = '';
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