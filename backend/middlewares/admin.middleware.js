const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format du token invalide' });
  }

  try {
    const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
    if (!decoded.is_admin) {
      return res.status(403).json({ message: 'Acces refuse - reservé aux administrateurs' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};
