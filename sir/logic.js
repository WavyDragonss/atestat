document.getElementById('calcBtn').onclick = function() {
  let s = document.getElementById('s').value;
  let d = Number(document.getElementById('d').value);
  let soff = Number(document.getElementById('soff').value);
  let result = s.slice(0, d) + s.slice(soff);
  let newLen = result.length;
  document.getElementById('output').innerHTML = `
    <strong>Rezultat:</strong> <code>${result}</code> <br>
    <em>Lungime nouă:</em> ${newLen} <br>
    <em>Explicație:</em> Caracterele de la poziția ${soff} până la final sunt copiate peste poziția ${d}, restul se pierd.
  `;
};