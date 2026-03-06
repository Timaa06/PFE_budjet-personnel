const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'budjet_personnel'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erreur MySQL:', err.message);
    } else {
        console.log('✅ MySQL connecté');
    }
});

module.exports = db;
