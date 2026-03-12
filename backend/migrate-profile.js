const db = require('./config/db');

const queries = [
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL",
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday DATE DEFAULT NULL",
];

let done = 0;
queries.forEach((q, i) => {
  db.query(q, (err) => {
    if (err) console.error(`Query ${i + 1} error:`, err.message);
    else console.log(`Query ${i + 1} OK`);
    if (++done === queries.length) {
      console.log('Migration profil terminée.');
      process.exit(0);
    }
  });
});
