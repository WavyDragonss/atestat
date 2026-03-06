# wasm/ - Instrucțiuni pentru clang.wasm / clang.js

Acest folder trebuie să conțină build-ul clang (clang.js + clang.wasm și eventual helper_files) produse dintr-un port Emscripten al Clang/LLVM. Aceste fișiere NU sunt incluse aici (din cauza mărimii).

Unde poți obține fișierele:
- Proiect recomandat (exemplu): https://github.com/llvm/clang-wasm
  - Verifică secțiunea Releases pentru build-uri precompilate.
- Alte opțiuni: build local cu Emscripten (durează mult).

Fișiere necesare în folderul /cpp/wasm:
- clang.js         (sau un fișier JS similar care inițializează Module-ul Emscripten)
- clang.wasm       (fișierul wasm aferent)
- orice fișiere helper (pachete, filesystem preloaded data) pe care build-ul le cere

Pași rapizi:
1. Creează folderul /cpp/wasm în proiectul tău.
2. Pune acolo clang.js și clang.wasm (și helper_files, dacă există).
3. Deschide proiectul cu un server static (nu funcționează direct din file:// în multe browsere)
   - Exemplu simplu: în terminal, din folderul `cpp`:
     - Python 3: `python -m http.server 8000`
     - Node (serve): `npx serve . -l 8000`
   - Accesează: http://localhost:8000/index.html
4. Folosește butonul "Compilează & Rulează". Dacă build-ul clang exportă o funcție helper `compileAndRun`, loader-ul din `clang-loader.js` o va folosi; altfel, vei adapta loader-ul la API-ul build-ului tău.

Teste și debugging:
- Dacă browserul aruncă erori legate de încărcarea `.wasm`, verifică:
  - CORS (folosind server local eviți probleme).
  - calea către .wasm în Network tab (DevTools).
- Unele build-uri Emscripten așteaptă `Module['locateFile']` pentru a găsi `.wasm`. `clang-loader.js` încearcă să accepte un `locateFile` opțional.

Dacă vrei, îți pot pregăti eu un `.zip` cu:
- un build de test (dacă am pluginurile/build-urile necesare) sau
- doar fișierele JS/HTML/CSS + script de deploy.
Spune-mi dacă dorești să-ți generez .zip — îți voi explica ce informații am nevoie (ex.: vrei build precompilat sau doar fișiere frontend?). 
