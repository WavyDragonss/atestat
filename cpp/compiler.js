// compiler.js — integrat cu Judge0 CE (public instance) pentru "compile & run"
// Folosește fluxul: build finalSource (template + user code) -> POST /submissions?base64_encoded=true&wait=true
// Atenție: funcționează doar online (Judge0 CE public). Pentru offline folosești clang.wasm (vedi variante anterioare).

const userCodeEl = document.getElementById('userCode');
const modeEl = document.getElementById('mode');
const templateSelectEl = document.getElementById('templateSelect');
const showFinalChk = document.getElementById('showFinal');
const compileBtn = document.getElementById('compileBtn');
const resetBtn = document.getElementById('resetBtn');
const showCompleteBtn = document.getElementById('showCompleteBtn');
const finalCodeEl = document.getElementById('finalCode');
const consoleEl = document.getElementById('console');
const stdinEl = document.getElementById('stdin') || { value: '' }; // optional input field if you add it

const TEMPLATES_PATH = './templates/';

// Judge0 CE endpoint (public)
const JUDGE0_BASE = 'https://ce.judge0.com';
const JUDGE0_SUBMISSIONS = `${JUDGE0_BASE}/submissions/?base64_encoded=true&wait=true`;
const JUDGE0_LANGUAGES = `${JUDGE0_BASE}/languages`;

// Cache languages
let LANG_CACHE = null;

// Helper: base64 encode UTF-8 safely
function base64EncodeUtf8(str = '') {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    // fallback for very large strings or environments without btoa
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    throw e;
  }
}

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

// Pick a language_id for C++: try to fetch languages and select C++17/C++20 if present.
// Fallback: common known ids may change, so prefer dynamic discovery.
async function getCppLanguageId(preferred = ['c++17', 'c++20', 'c++14', 'c++']) {
  if (LANG_CACHE) return LANG_CACHE;
  try {
    const res = await fetch(JUDGE0_LANGUAGES);
    if (!res.ok) throw new Error(`languages endpoint: ${res.status}`);
    const langs = await res.json(); // array of {id, name, ...}
    // Normalize: look for entries where name contains "C++" and "17"/"20"
    const lower = langs.map(l => ({ id: l.id, name: l.name.toLowerCase() }));
    for (const pref of preferred) {
      const found = lower.find(l => l.name.includes('c++') && l.name.includes(pref.replace('+','')));
      if (found) {
        LANG_CACHE = found.id;
        return LANG_CACHE;
      }
    }
    // fallback: first entry that contains "c++"
    const anyCpp = lower.find(l => l.name.includes('c++'));
    if (anyCpp) {
      LANG_CACHE = anyCpp.id;
      return LANG_CACHE;
    }
    throw new Error('Nu s-a găsit niciun limbaj C++ în lista de limbaje Judge0.');
  } catch (err) {
    // dacă nu putem obține lista, fallback la un id uzual cunoscut (notă: poate fi învechit)
    console.warn('Nu am putut obține lista de limbaje Judge0:', err);
    // Common fallback id for C++ (may vary): 54 or 52 — use 54 (GCC 9.2.0) as reasonable fallback
    LANG_CACHE = 54;
    return LANG_CACHE;
  }
}

// Build payload and call Judge0 CE (wait=true so response contains stdout/stderr/compile_output)
async function submitToJudge0(finalSource, stdin = '') {
  const language_id = await getCppLanguageId();
  const payload = {
    source_code: base64EncodeUtf8(finalSource),
    language_id,
    stdin: base64EncodeUtf8(stdin || ''),
    // optional fields:
    // cpu_time_limit, memory_limit, compiler_options, etc. (Judge0 supports some fields)
  };

  const res = await fetch(JUDGE0_SUBMISSIONS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // If you use your own Judge0 instance with an API key, add it here.
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    // Handle typical HTTP errors (rate limit, bad request)
    const text = await res.text().catch(() => '');
    throw new Error(`Judge0 request failed: ${res.status} ${res.statusText} ${text}`);
  }

  const result = await res.json();
  return result;
}

// Interpret Judge0 result and return human-friendly text
function formatJudge0Result(resJson) {
  // resJson example fields (base64 encoded): stdout, stderr, compile_output, message, status { id, description }
  const statusDesc = resJson.status && resJson.status.description ? resJson.status.description : 'Unknown';
  const outParts = [`Status: ${statusDesc}`];

  // decode base64 helper
  const b64dec = (s) => {
    if (!s) return '';
    try {
      return decodeURIComponent(escape(atob(s)));
    } catch (e) {
      // fallback for Node Buffer env
      try { return Buffer.from(s, 'base64').toString('utf8'); } catch (_) { return s; }
    }
  };

  if (resJson.compile_output) {
    outParts.push('--- Compile output ---');
    outParts.push(b64dec(resJson.compile_output));
  }

  if (resJson.stderr) {
    outParts.push('--- Stderr ---');
    outParts.push(b64dec(resJson.stderr));
  }

  if (resJson.stdout) {
    outParts.push('--- Stdout ---');
    outParts.push(b64dec(resJson.stdout));
  }

  if (resJson.message) {
    outParts.push('--- Message ---');
    outParts.push(b64dec(resJson.message));
  }

  return outParts.join('\n\n');
}

async function compileAndRun(finalSource) {
  setConsole('⏳ Trimit codul la Judge0 CE...');

  try {
    const stdin = (stdinEl && stdinEl.value) ? stdinEl.value : '';
    const resultJson = await submitToJudge0(finalSource, stdin);
    // resultJson will include base64-encoded outputs when base64_encoded=true
    const formatted = formatJudge0Result(resultJson);
    setConsole(formatted);
  } catch (err) {
    setConsole(`❌ Eroare la comunicarea cu Judge0:\n${err && err.message ? err.message : String(err)}\n\nDacă primești erori CORS sau 429, încearcă după un moment sau folosește o instanță Judge0 proprie.`);
  }
}

// Event handlers (UI logic similar la ce ai definit anterior)
compileBtn.addEventListener('click', async () => {
  setConsole('');
  try {
    const userCode = userCodeEl.value || '';
    const mode = modeEl.value;
    let templateName = templateSelectEl.value;

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
    finalCodeEl.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    setConsole(`❌ Eroare la afișare cod: ${err && err.message ? err.message : String(err)}`);
  }
});

// Populate defaults similar to before
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

  modeEl.dispatchEvent(new Event('change'));
})();
