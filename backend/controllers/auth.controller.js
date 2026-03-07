const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ← AJOUTE CETTE LIGNE !
const User = require('../models/user.model');

// INSCRIPTION
exports.register = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur base de données' });
        }
        
        if (user) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        User.create(
            { email, password: hashedPassword },
            function(err) {
                if (err) return res.status(500).json({ message: 'Erreur création utilisateur' });
                res.status(201).json({ message: 'Utilisateur créé' });
            }
        );
    });
};

// CONNEXION
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Erreur SQL:', err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide pour:', email); // Debug
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );

    console.log('✅ Connexion réussie pour:', email); // Debug

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  });
};