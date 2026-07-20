const fs = require('fs');

const db = JSON.parse(fs.readFileSync('db.json', 'utf8'));

if (db.library_resources) {
  db.library_resources.forEach(res => {
    if (res.title.includes('Cambridge IELTS 18')) {
      res.url = '/library/cambridge-18.pdf';
    } else if (res.title.includes('Simon')) {
      res.url = '/library/simons-ideas.pdf';
    } else if (res.title.includes('Speaking Part 1')) {
      res.url = '/library/speaking-p1.pdf';
    } else if (res.title.includes('Internal Teacher Material')) {
      res.url = '/library/internal-material.pdf';
    }
  });
}

fs.writeFileSync('db.json', JSON.stringify(db, null, 2));
console.log('db.json updated with local PDF URLs.');
