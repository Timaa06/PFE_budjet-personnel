const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
exports.login = (req, res) => {
    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur base de données' });
        }
        
        if (!user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        res.json({ token });
    });
};
