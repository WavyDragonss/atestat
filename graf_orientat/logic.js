document.getElementById('calcBtn').onclick = function() {
  const n = Number(document.getElementById('n').value);
  const m = Number(document.getElementById('m').value);
  const gi1 = Number(document.getElementById('gi1').value);
  const maxOut = m - gi1;
  let adj = [];
  // Exemplu: nodul 1 are grad extern maxim
  for (let i = 0; i < n; i++) adj.push([]);
  let idx = 1;
  for (let i = 0; i < maxOut; i++) {
    adj[0].push(idx++);
    if (idx >= n) idx = 1;
  }
  for (let i = 1; i <= gi1; i++) {
    adj[i].push(0); // muchie către nodul 1
  }
  let outputAdj = adj.map((v, i) => `${i+1}: ${v.map(x=>x+1).join(', ')}`).join('<br>');
  document.getElementById('output').innerHTML = `
    <strong>Grad extern maxim posibil:</strong> <b>${maxOut}</b> <br>
    <em>Distribuție exemplu (listă de adiacență):</em><br>${outputAdj}
  `;
};