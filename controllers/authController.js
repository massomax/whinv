const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  register: async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ 
        username, 
        password: hashedPassword, 
        role 
      });
      
      await user.save();
      res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: 'Пользователь не найден!' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Неправильный пароль!' });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: '30d' }
      );

      res.json({ 
        token, 
        role: user.role,
        userId: user._id
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
