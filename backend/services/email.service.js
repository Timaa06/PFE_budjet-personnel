const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendReminderEmail = async (toEmail, reminderTitle, remindAt, taskTitle) => {
  const dateStr = new Date(remindAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Budget Manager <noreply@budgetmanager.fr>',
    to: toEmail,
    subject: `⏰ Rappel : ${reminderTitle} — Budget Manager`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:56px;height:56px;background:#1e293b;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">B</div>
          <h2 style="color:#0f172a;margin:16px 0 4px;">Budget Manager</h2>
          <p style="color:#64748b;margin:0;font-size:14px;">Notification de rappel</p>
        </div>

        <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 16px;margin-bottom:20px;">
            <p style="margin:0;font-size:16px;font-weight:700;color:#0f172a;">⏰ ${reminderTitle}</p>
            ${taskTitle ? `<p style="margin:6px 0 0;font-size:13px;color:#64748b;">Tâche liée : ${taskTitle}</p>` : ''}
            <p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">${dateStr}</p>
          </div>
          <p style="color:#334155;font-size:15px;margin:0 0 8px;">Bonjour,</p>
          <p style="color:#334155;font-size:15px;margin:0;">
            Votre rappel <strong>${reminderTitle}</strong> vient d'être déclenché. Rendez-vous sur Budget Manager pour le consulter.
          </p>
        </div>

        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
          Budget Manager — Gestion de budget personnel
        </p>
      </div>
    `,
  });
};

exports.sendResetEmail = async (toEmail, resetLink) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Budget Manager <noreply@budgetmanager.fr>',
    to: toEmail,
    subject: 'Réinitialisation de votre mot de passe — Budget Manager',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:56px;height:56px;background:#1e293b;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">B</div>
          <h2 style="color:#0f172a;margin:16px 0 4px;">Budget Manager</h2>
          <p style="color:#64748b;margin:0;font-size:14px;">Réinitialisation de mot de passe</p>
        </div>

        <div style="background:#fff;border-radius:10px;padding:28px;border:1px solid #e2e8f0;">
          <p style="color:#334155;font-size:15px;margin:0 0 16px;">Bonjour,</p>
          <p style="color:#334155;font-size:15px;margin:0 0 24px;">
            Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable <strong>30 minutes</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="color:#94a3b8;font-size:13px;margin:0;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.
          </p>
        </div>

        <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
          Budget Manager — Gestion de budget personnel
        </p>
      </div>
    `,
  });
};
