// --- Reguli predefinite ---
const allRules = {
  strictIncreasing: (prefix, next) => prefix.length===0 || Number(next) > Number(prefix.slice(-1)),
  noTwoEven: (prefix, next) => prefix.length===0 || !((Number(prefix.slice(-1))%2===0) && (Number(next)%2===0)),
  descendingOrder: (prefix, next) => prefix.length===0 || Number(next) < Number(prefix.slice(-1))
  // Extensibil: adaugi reguli noi aici
};

// --- Universal backtracking numeric ---
function generateNumbers(length, activeRules) {
  let results = [], rejected = 0;
  function bt(prefix) {
    if(prefix.length===length) { results.push(prefix); return; }
    for(let d=0;d<=9;d++) {
      if(prefix.length===0 && d===0) continue; // nu începe cu zero
      let valid = true;
      for(const rule of activeRules) {
        const fn = allRules[rule];
        if(fn && !fn(prefix, String(d))) { valid=false; break; }
      }
      if(valid) bt(prefix+String(d));
      else rejected++;
    }
  }
  bt("");
  return {results, rejected};
}

// --- UI ---
const lengthInput = document.getElementById('lengthInput');
const ruleCheckboxes = document.getElementsByClassName('rule');
const generateBtn = document.getElementById('generateBtn');
const expandBtn = document.getElementById('expandBtn');
const collapseBtn = document.getElementById('collapseBtn');
const resultList = document.getElementById('resultList');
const indexInput = document.getElementById('indexInput');
const showNthBtn = document.getElementById('showNthBtn');
const nthResult = document.getElementById('nthResult');
const resultStats = document.getElementById('resultStats');

let lastResults = [];
let lastRejected = 0;
let lastLength = 0;

function updateResults(showAll) {
  resultList.innerHTML = '';
  nthResult.textContent = '';
  resultStats.textContent = '';
  let length = Number(lengthInput.value);
  let activeRules = [];
  for(let cb of ruleCheckboxes) if(cb.checked) activeRules.push(cb.value);
  // Dacă e bifată "descendingOrder", scoate "strictIncreasing" (sunt opuse)
  if(activeRules.includes("descendingOrder")) activeRules = activeRules.filter(r=>r!=="strictIncreasing");
  let {results, rejected} = generateNumbers(length, activeRules);
  lastResults = results; lastRejected = rejected; lastLength = length;
  if(results.length===0) {
    resultStats.textContent = 'Nicio soluție găsită.';
    resultStats.style.color = "#e0195a";
    resultList.style.display = 'none';
    return;
  }
  resultStats.innerHTML = `<b>Total rezultate:</b> ${results.length}<br><b>Respinse:</b> ${rejected}`;
  resultStats.style.color = "#1756e9";
  if(showAll) {
    resultList.style.display = '';
    const shown = results.slice(0,200);
    resultList.innerHTML = shown.map((w,i)=> `${i+1}. <code>${w}</code>`).join('<br>');
    if(results.length>200) resultList.innerHTML += `<br>... (${results.length-200} rezultate ascunse)`;
    collapseBtn.style.display = '';
    expandBtn.style.display = 'none';
  } else {
    resultList.style.display = 'none';
    collapseBtn.style.display = 'none';
    expandBtn.style.display = '';
  }
}
generateBtn.addEventListener('click', ()=>updateResults(false));
expandBtn.addEventListener('click', ()=>updateResults(true));
collapseBtn.addEventListener('click', ()=>updateResults(false));

// --- Show nth result ---
showNthBtn.addEventListener('click', ()=>{
  if(lastResults.length===0){
    nthResult.textContent = 'Generează întâi rezultatele!';
    nthResult.style.color="#e0195a";
    return;
  }
  const idx = Number(indexInput.value);
  if(idx < 1 || idx > lastResults.length){
    nthResult.textContent = 'Index invalid!';
    nthResult.style.color="#e0195a";
    return;
  }
  nthResult.innerHTML = `Rezultatul #${idx}: <b><code>${lastResults[idx-1]}</code></b>`;
  nthResult.style.color="#1756e9";
});

// --- Generate implicit la încărcare ---
window.addEventListener('DOMContentLoaded', ()=>updateResults(false));