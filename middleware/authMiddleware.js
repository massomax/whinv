const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Нет токена, авторизация отклонена' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'У вас нет доступа к этому ресурсу' });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

module.exports = authMiddleware;