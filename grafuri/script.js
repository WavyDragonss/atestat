// Helpers: convert input to adjacency list
window.addEventListener('DOMContentLoaded', ()=>{
  const val = localStorage.getItem('grafuri_input');
  if(val){ inputArea.value = val; localStorage.removeItem('grafuri_input'); }
});
function parseMatrix(text){
  const lines = text.trim().split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if(lines.length===0) return [];
  const mat = lines.map(l => l.split(/[,\s]+/).filter(Boolean).map(x=>Number(x)));
  const n = mat.length;
  for(let i=0;i<n;i++) if(mat[i].length!==n) throw new Error('Matricea nu e pătratică.');
  const adj = Array.from({length:n}, ()=>[]);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) if(mat[i][j]) adj[i].push(j);
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

// UI
const inputArea = document.getElementById('inputArea');
const parseBtn = document.getElementById('parseBtn');
const asciiOut = document.getElementById('asciiOut');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const statusMsg = document.getElementById('statusMsg');
const rootInput = document.getElementById('rootInput');
const rootNodeInput = document.getElementById('rootNode');
const analysisDiv = document.getElementById('analysis');

document.querySelectorAll('input[name="type"]').forEach(e=>{
  e.addEventListener('change', ()=>{
    if(document.querySelector('input[name="type"]:checked').value==='arbore')
      rootInput.style.display = '';
    else rootInput.style.display = 'none';
  });
});

// Arbore: detectează rădăcina
function detectRoot(adj, oriented){
  const n = adj.length;
  if(oriented){
    // grad intern 0
    const indeg = Array(n).fill(0);
    for(let i=0;i<n;i++) for(let j of adj[i]) indeg[j]++;
    const roots = [];
    for(let i=0;i<n;i++) if(indeg[i]===0) roots.push(i);
    return roots;
  }else{
    // grad maxim sau primul nod
    const deg = adj.map(neigh=>neigh.length);
    let maxDeg = Math.max(...deg);
    let roots = [];
    for(let i=0;i<n;i++) if(deg[i]===maxDeg) roots.push(i);
    return roots;
  }
}

// Arbore: BFS/DFS pentru structură
function analyzeTree(adj, root, oriented){
  const n = adj.length, visited = Array(n).fill(false);
  const parent = Array(n).fill(-1), children = Array.from({length:n},()=>[]);
  let order = [];
  function dfs(u){
    visited[u]=true; order.push(u);
    for(let v of adj[u]){
      if(!visited[v]){
        parent[v]=u;
        children[u].push(v);
        dfs(v);
      }
    }
  }
  dfs(root);
  const props = order.map(u=>{
    return {node:u+1, children:children[u].length, leaf:children[u].length===0};
  });
  return props;
}

// Desen ASCII ierarhic
function drawTree(adj, root){
  let lines = [];
  function go(u, prefix, isLast){
    lines.push(prefix+(isLast?'└── ':'├── ')+ (u+1));
    const ch = adj[u];
    for(let i=0;i<ch.length;i++){
      let newPrefix = prefix+(isLast?'    ':'│   ');
      go(ch[i], newPrefix, i===ch.length-1);
    }
  }
  go(root, '', true);
  return lines.join('\n').replace(/^└── /,''); // rădăcina fără ramură
}

// Parse & Vizualizează
parseBtn.addEventListener('click', ()=>{
  try{
    const type = document.querySelector('input[name="type"]:checked').value;
    const format = document.querySelector('input[name="format"]:checked').value;
    const text = inputArea.value;
    let adj = format==='matrix'?parseMatrix(text):parseList(text);
    if(adj.length===0) throw new Error('Niciun nod sau muchie găsit.');
    let oriented = (type==='graf_orientat');
    if(type!=='arbore'){
      asciiOut.textContent = 'Vizualizare standard (circulară):\n'+drawTree(adj,0); // fallback
      analysisDiv.innerHTML = '';
      statusMsg.textContent = 'Graful a fost procesat ca graf obișnuit.';
      return;
    }
    // Arbore
    let root=-1;
    if(rootNodeInput.value){
      root = Number(rootNodeInput.value)-1;
      if(root<0||root>=adj.length) throw new Error('Rădăcină invalidă!');
    }else{
      const possibleRoots = detectRoot(adj, oriented);
      if(possibleRoots.length===0) throw new Error('Nu s-a detectat nicio rădăcină!');
      if(possibleRoots.length>1){
        statusMsg.textContent = 'Mai multe rădăcini posibile: '+possibleRoots.map(x=>x+1).join(', ')+'. Selectați manual!';
        root = possibleRoots[0];
      }else{
        root = possibleRoots[0];
      }
    }
    // Structura arbore
    const props = analyzeTree(adj, root, oriented);
    const ascii = drawTree(adj, root);
    asciiOut.textContent = ascii;
    // Analiză
    let frunze = props.filter(x=>x.leaf).length;
    let analize = `<strong>Rădăcină:</strong> ${root+1}<br>
    <strong>Număr frunze:</strong> ${frunze}<br>
    <strong>Structură:</strong><br>
    <table><tr><th>Nod</th><th>Nr. fii</th><th>Frunză?</th></tr>`;
    props.forEach(x=>{
      analize+=`<tr><td>${x.node}</td><td>${x.children}</td><td>${x.leaf?'Da':'Nu'}</td></tr>`;
    });
    analize+='</table>';
    analysisDiv.innerHTML = analize;
    statusMsg.textContent = 'Arbore procesat cu succes.';
  }catch(e){
    asciiOut.textContent = '';
    analysisDiv.innerHTML = '';
    statusMsg.textContent = 'Eroare: '+e.message;
  }
});
clearBtn.addEventListener('click',()=>{
  inputArea.value=''; asciiOut.textContent='(apasă Parse & Vizualizează)'; analysisDiv.innerHTML=''; statusMsg.textContent='';
});
copyBtn.addEventListener('click',()=>{
  navigator.clipboard.writeText(asciiOut.textContent).then(()=>{
    copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy ASCII',900);
  }).catch(()=>{copyBtn.textContent='Copy failed'; setTimeout(()=>copyBtn.textContent='Copy ASCII',900);});
});