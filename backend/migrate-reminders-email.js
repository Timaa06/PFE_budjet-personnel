const db = require('./config/db');

const sql = `ALTER TABLE reminders ADD COLUMN IF NOT EXISTS notification_type ENUM('app','email','both') DEFAULT 'app'`;

db.query(sql, (err) => {
  if (err) { console.error('❌', err.message); process.exit(1); }
  console.log('✅ Colonne notification_type ajoutée à reminders.');
  process.exit(0);
});
