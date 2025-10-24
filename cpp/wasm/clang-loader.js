// Un loader minimalist pentru clang.js + clang.wasm.
// Scop: oferă o funcție default initClang(opts) care încearcă să încarce clang.js
// și să returneze un wrapper { compileAndRun(source, options) }.
// IMPORTANT: implementarea exactă a compileAndRun depinde de build-ul clang-wasm pe care-l folosești.
// Dacă build-ul tău exportă o funcție helper (ex: compileAndRun), loader-ul va apela acea funcție.
// Altfel, loaderul va arunca o eroare explicativă.

export default async function initClang(opts = {}) {
  const locateFile = opts.locateFile || ((f) => `./${f}`);

  try {
    // În mod curent așteptăm ca în folderul /wasm/ să existe clang.js care exportă o funcție default
    // ce inițializează Module (Emscripten) sau să seteze window.Module.
    const mod = await import('./clang.js');

    // mod.default poate fi: (ModuleArgs) => Promise(Module)
    const ModuleFactory = mod.default || mod.createModule || null;

    if (!ModuleFactory && !window.Module) {
      throw new Error('clang.js nu conține o funcție de inițializare compatibilă și window.Module nu este setat.');
    }

    const moduleArgs = {
      locateFile: (file) => locateFile(file),
      // poți adăuga alte opțiuni Module aici
    };

    let Module;
    if (ModuleFactory) {
      Module = await ModuleFactory(moduleArgs);
    } else {
      // fallback la Module global (ex.: build care folosește var Module = {...})
      Module = window.Module;
    }

    // Daca build-ul expune direct compileAndRun:
    if (typeof Module.compileAndRun === 'function') {
      return {
        compileAndRun: (src, opts = {}) => Module.compileAndRun(src, opts)
      };
    }

    // Dacă build-ul expune un API custom (ex: Module.ccall), poți adapta aici.
    if (typeof Module.ccall === 'function') {
      return {
        compileAndRun: async (src, opts = {}) => {
          // Aceasta este doar un placeholder — majoritatea build-urilor vin cu un wrapper JS.
          throw new Error('Build-ul clang folosit necesită un wrapper JS specific. Adaptează clang-loader.js la API-ul build-ului tău.');
        }
      };
    }

    throw new Error('Am încărcat clang.js, dar nu am detectat un API de rulare. Verifică build-ul clang-wasm și README-ul din /wasm/.');

  } catch (err) {
    const msg = [
      'Nu am putut inițializa clang din folderul /wasm/.',
      'Asigură-te că ai copiat clang.js și clang.wasm în /wasm/ (vezi wasm/README.md).',
      'Eroare internă: ' + (err && err.message ? err.message : String(err))
    ].join(' ');
    throw new Error(msg);
  }
}
