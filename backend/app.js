require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const categoryRoutes = require('./routes/category.routes');
const statsRoutes = require('./routes/stats.routes');
const goalRoutes = require('./routes/goal.routes');
const adminRoutes    = require('./routes/admin.routes');
const needsRoutes    = require('./routes/needs.routes');
const tasksRoutes    = require('./routes/tasks.routes');
const remindersRoutes = require('./routes/reminders.routes');
const { startReminderJob } = require('./jobs/reminderJob');

const app = express();

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/stats', statsRoutes);
app.use('/goals', goalRoutes);
app.use('/admin',     adminRoutes);
app.use('/needs',     needsRoutes);
app.use('/tasks',     tasksRoutes);
app.use('/reminders', remindersRoutes);

startReminderJob();

module.exports = app;