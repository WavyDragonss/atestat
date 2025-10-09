document.getElementById('calcBtn').onclick = function() {
  const n = Number(document.getElementById('n').value);
  const m = Number(document.getElementById('m').value);
  const vizBtn = document.createElement('button');
vizBtn.textContent = 'Vizualizează în ASCII Visualizer';
vizBtn.onclick = function() {
  localStorage.setItem('grafuri_input', matriceaGenerata); // matriceaGenerata = stringul matricei
  window.location.href = '../grafuri/grafuri.html';
};
document.getElementById('output').appendChild(vizBtn);
  let k = 1;
  
  while (k*(k-1)/2 < m) k++;
  document.getElementById('output').innerHTML = `
    <strong>Rezultat:</strong> Numărul maxim de vârfuri de grad 0 este <b>${n-k}</b>.<br>
    <em>Explicație:</em> Cele ${k} noduri pot acoperi toate cele ${m} muchii, restul (${n-k}) pot fi izolate.<br>
    Exemplu de distribuție: nodurile 1…${k} sunt interconectate, nodurile ${k+1}…${n} sunt izolate.
  `;
};