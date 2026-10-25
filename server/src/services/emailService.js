const sgMail = require('@sendgrid/mail');
const env = require('../config/env');

if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function sendWeeklyReport({ parentEmail, studentName, accuracy, gamesPlayed, questionsAnswered }) {
  if (!env.SENDGRID_API_KEY) return;
  const msg = {
    to: parentEmail,
    from: env.EMAIL_FROM,
    subject: `${studentName}'s Weekly SteamBlast Arena Report`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4A90D9">💦 SteamBlast Arena Weekly Report</h1>
        <p>Hi! Here's how <strong>${studentName}</strong> did this week:</p>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Games Played</td>
            <td style="padding:8px">${gamesPlayed}</td>
          </tr>
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Questions Answered</td>
            <td style="padding:8px">${questionsAnswered}</td>
          </tr>
          <tr>
            <td style="padding:8px;background:#f5f5f5;font-weight:bold">Accuracy</td>
            <td style="padding:8px">${accuracy}%</td>
          </tr>
        </table>
        <p style="margin-top:16px">Keep up the great work! 🌟</p>
        <p style="color:#888;font-size:12px">SteamBlast Arena — Learning through play</p>
      </div>
    `,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

async function sendWelcomeEmail({ email, displayName }) {
  if (!env.SENDGRID_API_KEY) return;
  const msg = {
    to: email,
    from: env.EMAIL_FROM,
    subject: 'Welcome to SteamBlast Arena!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#4A90D9">💦 Welcome to SteamBlast Arena, ${displayName}!</h1>
        <p>You're all set to blast your way to the top of the leaderboard while learning maths and literacy.</p>
        <p>Good luck in the arena! 🎮</p>
      </div>
    `,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendWeeklyReport, sendWelcomeEmail };
