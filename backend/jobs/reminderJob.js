const db = require('../config/db');
const { sendReminderEmail } = require('../services/email.service');

// Vérifie toutes les minutes les rappels email non déclenchés
function startReminderJob() {
  setInterval(async () => {
    db.query(
      `SELECT r.id, r.title, r.remind_at, r.notification_type, r.task_id,
              t.title AS task_title, u.email
       FROM reminders r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN tasks t ON t.id = r.task_id
       WHERE r.email_sent = 0
         AND r.remind_at <= NOW()
         AND r.notification_type IN ('email', 'both')`,
      async (err, rows) => {
        if (err || !rows || rows.length === 0) return;

        for (const reminder of rows) {
          try {
            await sendReminderEmail(
              reminder.email,
              reminder.title,
              reminder.remind_at,
              reminder.task_title || null
            );
            // Marque email envoyé + triggered si type email seul
            const setTriggered = reminder.notification_type === 'email' ? ', triggered=1' : '';
            db.query(`UPDATE reminders SET email_sent=1${setTriggered} WHERE id=?`, [reminder.id]);
            console.log(`📧 Email rappel envoyé à ${reminder.email} : "${reminder.title}"`);
          } catch (e) {
            console.error(`❌ Erreur envoi email rappel #${reminder.id} :`, e.message);
          }
        }
      }
    );
  }, 60 * 1000); // toutes les 60 secondes

  console.log('⏰ Job rappels email démarré.');
}

module.exports = { startReminderJob };
