const db = require('./config/db');

const migrations = [
  // start_date sur les objectifs
  `ALTER TABLE goals ADD COLUMN IF NOT EXISTS start_date DATE NULL`,

  // Table besoins
  `CREATE TABLE IF NOT EXISTS needs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    category ENUM('health', 'finances', 'wellness', 'studies', 'other') DEFAULT 'other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,

  // Table tâches
  `CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    need_id INT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    deadline DATE NULL,
    status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (need_id) REFERENCES needs(id) ON DELETE SET NULL
  )`,

  // Table rappels
  `CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NULL,
    title VARCHAR(255) NOT NULL,
    remind_at DATETIME NOT NULL,
    triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  )`,
];

(async () => {
  for (const sql of migrations) {
    await new Promise((resolve, reject) => {
      db.query(sql, (err) => {
        if (err) { console.error('❌', err.message); reject(err); }
        else { console.log('✅', sql.split('\n')[0].trim()); resolve(); }
      });
    });
  }
  console.log('\n✅ Migration terminée.');
  process.exit(0);
})();
