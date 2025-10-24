// editor.js - configurează Monaco și conectează loaderul clang (WASM).
// Folosește require (Monaco) și import dinamic pentru wasm loader.

const MONACO_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs';
window.MonacoBase = MONACO_BASE;

require.config({ paths: { 'vs': MONACO_BASE } });

(async function init() {
  // Load Monaco
  require(['vs/editor/editor.main'], async function () {
    window.editor = monaco.editor.create(document.getElementById('editor'), {
      value: [
        '#include <iostream>',
        'using namespace std;',
        '',
        'int main() {',
        '    cout << "Salut din compilatorul tău C++!" << endl;',
        '    return 0;',
        '}'
      ].join('\n'),
      language: 'cpp',
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: false },
      automaticLayout: true
    });
  });

  // Wire buttons
  document.getElementById('runBtn').addEventListener('click', onRun);
  document.getElementById('openReadme').addEventListener('click', () => {
    window.open('./wasm/README.md', '_blank');
  });
  document.getElementById('downloadZip').addEventListener('click', () => {
    // simple hint (no automatic zip creation here)
    alert('Vezi wasm/README.md pentru paşii de descărcare a clang.wasm și clang.js. Pot pregăti manual un .zip dacă vrei — spune-mi.');
  });
})();

async function onRun(){
  const outputEl = document.getElementById('output');
  outputEl.textContent = '⏳ Compilare în curs...\n';

  const code = window.editor.getValue();
  const stdFlag = document.getElementById('stdSelect').value || '-std=c++17';

  try {
    // În wasm/ folder trebuie să existe clang-loader.js și clang.wasm + clang.js
    const loader = await import('./wasm/clang-loader.js');
    const initClang = loader.default;
    const clang = await initClang({ locateFile: (f) => `./wasm/${f}` });

    // compileAndRun ar trebui să fie o funcție expusă de loader (vezi README)
    const result = await clang.compileAndRun(code, { args: [stdFlag] });

    outputEl.textContent = result || '✅ Program rulat (fără output)';
  } catch (err) {
    console.error(err);
    outputEl.textContent += '\n❌ Eroare: ' + (err && err.message ? err.message : String(err)) + '\n';
    outputEl.textContent += '\nVerifică wasm/README.md pentru a instala clang.wasm și clang.js în folderul /cpp/wasm.';
  }
}
