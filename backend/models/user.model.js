const db = require('../config/db');

exports.findByEmail = (email, callback) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0] || null);
    });
};

exports.create = (user, callback) => {
    const { email, password } = user;
    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, password], (err) => {
        callback(err);
    });
};
