// compiler.js — logică pentru inserarea șabloanelor, compilare și rulare
// Se așteaptă următoarea structură:
// /wasm/clang.js + /wasm/clang.wasm  (sau un loader compatibil)
// /templates/{base.cpp,subprog.cpp,full.cpp}

const userCodeEl = document.getElementById('userCode');
const modeEl = document.getElementById('mode');
const templateSelectEl = document.getElementById('templateSelect');
const showFinalChk = document.getElementById('showFinal');
const compileBtn = document.getElementById('compileBtn');
const resetBtn = document.getElementById('resetBtn');
const showCompleteBtn = document.getElementById('showCompleteBtn');
const finalCodeEl = document.getElementById('finalCode');
const consoleEl = document.getElementById('console');

const TEMPLATES_PATH = './templates/';

async function fetchTemplate(name) {
  const url = `${TEMPLATES_PATH}${name}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Nu am putut încărca șablonul: ${name} (${res.status})`);
  return res.text();
}

function buildFinalCode(templateText, userCode) {
  return templateText.replace('{{USER_CODE}}', userCode);
}

function setConsole(text) {
  consoleEl.textContent = text;
}

function setFinalCode(text) {
  finalCodeEl.textContent = text;
}

async function compileAndRun(finalSource) {
  setConsole('⏳ Încep compilarea...');

  try {
    // În wasm/ ar trebui să existe clang-loader.js sau clang.js. Loader returnează o funcție init.
    // Loader-ul personalizat (în acest pachet) este wasm/clang-loader.js care încearcă să importa clang.js
    const loader = await import('./wasm/clang-loader.js');
    const initClang = loader.default;
    // locateFile asigură calea corectă la clang.wasm
    const clang = await initClang({ locateFile: (f) => `./wasm/${f}` });

    if (!clang || typeof clang.compileAndRun !== 'function') {
      throw new Error('Build-ul clang din /wasm/ nu expune compileAndRun(...). Vezi wasm/README.md');
    }

    // Apelăm compileAndRun: interfața concretă depinde de build (wrapper în clang-loader.js)
    const result = await clang.compileAndRun(finalSource, { args: [] });
    setConsole(String(result || '✅ Program rulat (fără output)'));
  } catch (err) {
    setConsole(`❌ Eroare la compilare / rulare:\n${err && err.message ? err.message : String(err)}\n\nVerifică /wasm/README.md pentru pași.`);
  }
}

// Event handlers
compileBtn.addEventListener('click', async () => {
  setConsole('');
  try {
    const userCode = userCodeEl.value || '';
    const mode = modeEl.value;
    let templateName = templateSelectEl.value;

    // Default mapping: dacă user alege "Subprogram", preselectăm subprog.cpp
    if (!templateName) {
      templateName = (mode === 'subprog') ? 'subprog.cpp' : 'full.cpp';
    }

    const templateText = await fetchTemplate(templateName);
    const finalSource = buildFinalCode(templateText, userCode);

    if (showFinalChk.checked) {
      setFinalCode(finalSource);
    } else {
      setFinalCode('(Arată cod complet este dezactivat)');
    }

    // Komentar: rulăm compilarea
    await compileAndRun(finalSource);

  } catch (err) {
    setConsole(`❌ Eroare: ${err && err.message ? err.message : String(err)}`);
  }
});

resetBtn.addEventListener('click', () => {
  userCodeEl.value = '';
  setFinalCode('');
  setConsole('');
});

showCompleteBtn.addEventListener('click', async () => {
  try {
    const userCode = userCodeEl.value || '';
    const templateName = templateSelectEl.value || (modeEl.value === 'subprog' ? 'subprog.cpp' : 'full.cpp');
    const templateText = await fetchTemplate(templateName);
    const finalSource = buildFinalCode(templateText, userCode);
    setFinalCode(finalSource);
    // Scroll to cod final
    finalCodeEl.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    setConsole(`❌ Eroare la afișare cod: ${err && err.message ? err.message : String(err)}`);
  }
});

// Prepopulate with a helpful default for subprogram mode
(function initDefaults(){
  modeEl.addEventListener('change', () => {
    if (modeEl.value === 'subprog') {
      templateSelectEl.value = 'subprog.cpp';
      if (!userCodeEl.value) {
        userCodeEl.value = 'void f(int n) {\n    // scrie soluția aici\n}\n';
      }
    } else {
      templateSelectEl.value = 'full.cpp';
      if (!userCodeEl.value) {
        userCodeEl.value = '// scrie codul complet (fără #include)\nint main() {\n    // ...\n    return 0;\n}\n';
      }
    }
  });

  // trigger initial
  modeEl.dispatchEvent(new Event('change'));
})();
