// --- Helper functions ---
function isVowel(ch) { return "aeiou".includes(ch.toLowerCase()); }
function isConsonant(ch) { return /^[a-zA-Z]$/.test(ch) && !isVowel(ch); }
function isEven(n) { return !isNaN(n) && Number(n)%2===0; }
function isOdd(n) { return !isNaN(n) && Number(n)%2===1; }

// --- Reguli predefinite ---
const allRules = {
  noVowelsTogether: (prefix, next) => prefix.length===0 || !(isVowel(prefix.slice(-1)) && isVowel(next)),
  noConsonantsTogether: (prefix, next) => prefix.length===0 || !(isConsonant(prefix.slice(-1)) && isConsonant(next)),
  noDuplicates: (prefix, next) => !prefix.includes(next),
  startsWithVowel: (prefix, next, pos) => pos>0||isVowel(next),
  endsWithConsonant: (prefix, next, pos, len) => pos<len-1||isConsonant(next),
  alphabeticalOrder: (prefix, next) => prefix.length===0 || next>=prefix.slice(-1),
  noConsecutiveNumbers: (prefix, next) => prefix.length===0 || Math.abs(Number(next)-Number(prefix.slice(-1)))!==1,
  noEvenTogether: (prefix, next) => prefix.length===0 || !(isEven(prefix.slice(-1)) && isEven(next)),
  noOddTogether: (prefix, next) => prefix.length===0 || !(isOdd(prefix.slice(-1)) && isOdd(next)),
  ascendingOrder: (prefix, next) => prefix.length===0 || Number(next)>=Number(prefix.slice(-1)),
  descendingOrder: (prefix, next) => prefix.length===0 || Number(next)<=Number(prefix.slice(-1))
};

// --- Custom rules array (can be extended) ---
let customRules = [];

// --- Universal backtracking ---
function generateWords(alphabet, length, activeRules, type, customRulesArr) {
  let results = [], rejected = 0;
  function bt(prefix, pos) {
    if(prefix.length===length) { results.push(prefix); return; }
    for(const ch of alphabet) {
      let valid = true;
      for(const rule of activeRules) {
        const fn = allRules[rule];
        if(fn && !fn(prefix, ch, pos, length)) { valid=false; break; }
      }
      for(const fn of customRulesArr) {
        if(!fn(prefix, ch, pos, length)) { valid=false; break; }
      }
      if(valid) bt(prefix+ch, pos+1);
      else rejected++;
    }
  }
  bt("", 0);
  return {results, rejected};
}

// --- UI ---
const alphabetInput = document.getElementById('alphabetInput');
const lengthInput = document.getElementById('lengthInput');
const typeRadios = document.querySelectorAll('input[name="type"]');
const rulesChar = document.getElementById('rulesChar');
const rulesNum = document.getElementById('rulesNum');
const ruleCheckboxes = document.getElementsByClassName('rule');
const customRuleInput = document.getElementById('customRuleInput');
const addCustomRuleBtn = document.getElementById('addCustomRuleBtn');
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
let lastAlphabet = [];
let lastLength = 0;

// --- Dynamic rules UI ---
typeRadios.forEach(radio=>{
  radio.addEventListener('change', ()=>{
    if(radio.value==="char") {
      rulesChar.style.display="";
      rulesNum.style.display="none";
      alphabetInput.value="a,b,c,d";
    } else {
      rulesChar.style.display="none";
      rulesNum.style.display="";
      alphabetInput.value="0,1,2,3,4";
    }
  });
});

// --- Add custom rule (experimental, only supports a simple syntax) ---
addCustomRuleBtn.addEventListener('click', ()=>{
  const txt = customRuleInput.value.trim();
  if(!txt) return;
  // Exemplu: "prima cifră < ultima cifră"
  // Poți extinde parserul, dar aici acceptăm doar această sintaxă fixă:
  if(/prima cifră < ultima cifră/.test(txt)) {
    customRules.push(function(prefix, next, pos, len){
      if(pos<len-1) return true;
      // la completare
      return Number((prefix+next)[0]) < Number((prefix+next).slice(-1));
    });
    addCustomRuleBtn.textContent="Adăugat!";
    setTimeout(()=>addCustomRuleBtn.textContent="Adaugă condiția",1000);
    customRuleInput.value="";
  } else {
    addCustomRuleBtn.textContent="Sintaxă neacceptată!";
    setTimeout(()=>addCustomRuleBtn.textContent="Adaugă condiția",1400);
  }
});

// --- Generate ---
function updateResults(showAll) {
  resultList.innerHTML = '';
  nthResult.textContent = '';
  resultStats.textContent = '';
  let alphabet = alphabetInput.value.split(',').map(x=>x.trim()).filter(Boolean);
  let length = Number(lengthInput.value);
  let activeRules = [];
  for(let cb of ruleCheckboxes) if(cb.checked) activeRules.push(cb.value);
  lastAlphabet = alphabet; lastLength = length;
  let {results, rejected} = generateWords(alphabet, length, activeRules, document.querySelector('input[name="type"]:checked').value, customRules);
  lastResults = results; lastRejected = rejected;
  if(results.length===0) {
    resultStats.textContent = 'Nicio soluție găsită.';
    resultStats.style.color = "#e0195a";
    resultList.style.display = 'none';
    return;
  }
  let t0 = performance.now(), t1 = performance.now();
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