require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const categoryRoutes = require('./routes/category.routes');
const statsRoutes = require('./routes/stats.routes');
const goalRoutes = require('./routes/goal.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/stats', statsRoutes);
app.use('/goals', goalRoutes);
app.use('/admin', adminRoutes);

module.exports = app;