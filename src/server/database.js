const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./src/database/chinese-poems.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the database.');
  }
});

function makeDatabaseQuery(query) {
  return db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    rows.forEach((row) => {
      console.log(row);
    });
  });
}
