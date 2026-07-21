const fs = require('fs');
const s = fs.readFileSync('database.json', 'utf8');
const lines = s.split('\n');
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trimEnd();
  const prev = lines[i - 1].trimEnd();
  // Check if current line starts a JSON key and previous line ends with a value (no comma)
  if (
    line.match(/^\s+"[^"]+":/) &&
    prev.match(/^\s+"[^"]+":\s*"[^"]*"\s*$/) &&
    !prev.endsWith(',')
  ) {
    console.log(`Line ${i}: missing comma after -> ${prev.substring(0, 100)}`);
  }
  if (
    line.match(/^\s+"[^"]+":/) &&
    prev.match(/^\s+"[^"]+":\s*[\d.]+\s*$/) &&
    !prev.endsWith(',')
  ) {
    console.log(`Line ${i}: missing comma after number -> ${prev.substring(0, 100)}`);
  }
}
