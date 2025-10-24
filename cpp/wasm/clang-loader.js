// Un loader mic care încearcă să încarce clang.js (Emscripten build) din același folder.
// Scop: oferă o funcție async default export initClang(options)
// initClang va returna un obiect { compileAndRun(code, options) } care compilează și rulează cod C++
// NOTĂ: fișiere reale clang.js și clang.wasm nu sunt incluse aici. Urmează instrucțiunile din README.

export default async function initClang(opts = {}) {
  // opts.locateFile: fn(filename) => url (optional)
  const locateFile = opts.locateFile || ((f) => `./${f}`);

  // În mod ideal, clang.js este un build Emscripten care exportă o funcție factory (Module -> Promise<Module>)
  // Vom încerca să importăm clang.js. Dacă nu există, aruncăm o eroare informativă.
  try {
    // eslint-disable-next-line
    const mod = await import('./clang.js'); // trebuie să existe clang.js în același folder wasm/
    // mod poate exporta o funcție default care inițializează (depinde de build).
    // Permitem două scenarii:
    // 1) mod.default este o funcție init(Module) => Promise(Module)
    // 2) mod provides a Module factory via createModule or directly returns an object

    let ModuleFactory = mod.default || mod.createModule || mod.Module || null;

    if (!ModuleFactory) {
      // Dacă modul a fost construit ca script Emscripten care setează global Module, încercăm fallback:
      if (window.Module) {
        ModuleFactory = () => Promise.resolve(window.Module);
      } else {
        throw new Error('clang.js găsit, dar nu conține o funcție de inițializare compatibilă.');
      }
    }

    // Creăm Module cu locateFile pentru a indica unde se găsește clang.wasm
    const moduleArgs = {
      locateFile: (file) => locateFile(file),
      // orice alte setări Module pot fi puse aici
    };

    const Module = await ModuleFactory(moduleArgs);

    // Aici depinde de build-ul clang.wasm cum expune funcționalitatea.
    // Propunem o interfață uniformă: compileAndRun(code, {args: [...]})
    // Implementăm wrapper care apelează funcțiile expuse de Module (dacă există).
    if (typeof Module.compileAndRun === 'function') {
      return {
        compileAndRun: (src, opts = {}) => Module.compileAndRun(src, opts)
      };
    }

    // Fallback: multe portări folosesc ccall/cwrap sau un API custom.
    // Încercăm un API comun: Module.ccall('compile_and_run', ...)
    if (typeof Module.ccall === 'function') {
      return {
        compileAndRun: async (src, opts = {}) => {
          // Notă: implementarea exactă depinde de build-ul clang-wasm.
          // Pentru multe pachete, există o funcție JS helper. Dacă nu, documentația din wasm/README.md te ajută.
          throw new Error('Acest build clang.js necesită un wrapper specific. Vezi wasm/README.md pentru instrucțiuni.');
        }
      };
    }

    throw new Error('Am încărcat clang.js, dar nu am putut detecta un API standard (compileAndRun / ccall). Verifică build-ul sau folosește pachetul recomandat din README.');

  } catch (err) {
    const userMessage = [
      'Nu am putut încărca clang.js din folderul /cpp/wasm.',
      'Asigură-te că ai descărcat clang.wasm și clang.js (vezi wasm/README.md).',
      'Eroare internă: ' + (err && err.message ? err.message : String(err))
    ].join(' ');
    throw new Error(userMessage);
  }
}
