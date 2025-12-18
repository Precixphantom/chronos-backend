import { Resend } from 'resend';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// RESEND EMAIL SERVICE
const resend = new Resend(process.env.RESEND_API_KEY);

// EMAIL TEMPLATES
export const emailTemplates = {
  /* ---------- WELCOME ---------- */
  welcome: (userName) => ({
    subject: '🚀 Welcome to Study Tracker — Stay on Top of Your Learning!',
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<p>Hi ${userName},</p>
<p>Welcome to Study Tracker!</p>
<p>
<a href="${process.env.FRONTEND_URL}/dashboard">Get Started</a>
</p>
<p>© ${new Date().getFullYear()} Study Tracker</p>
</body>
</html>`,
    text: `Hi ${userName},

Welcome to Study Tracker!

Get started:
${process.env.FRONTEND_URL}/dashboard

© ${new Date().getFullYear()} Study Tracker`,
  }),

  /* ---------- WEEKLY SUMMARY ---------- */
  weeklySummary: (userName, completedTasks, upcomingTasks, overdueTasks, stats) => ({
    subject: '📊 Your Weekly Summary - Chrono',
    html: `<!DOCTYPE html>
<html>
<body>
<h2>Your Weekly Summary</h2>

<p>Hi ${userName},</p>

<p><strong>Tasks Completed:</strong> ${stats.completed}</p>
<p><strong>Tasks Due:</strong> ${stats.totalDue}</p>
<p><strong>Completion Rate:</strong> ${stats.completionRate}%</p>

${
  overdueTasks.length > 0
    ? `<h3>⚠️ Overdue Tasks</h3>
<ul>
${overdueTasks
  .map((t) => {
    const daysOverdue = Math.floor(
      (new Date() - new Date(t.deadline)) / (1000 * 60 * 60 * 24)
    );
    return `<li>${t.goal || 'Untitled Task'}${
      daysOverdue > 0 ? ` - Overdue by ${daysOverdue} day(s)` : ''
    }</li>`;
  })
  .join('')}
</ul>`
    : ''
}

${
  upcomingTasks.length > 0
    ? `<h3>📅 Upcoming Tasks</h3>
<ul>
${upcomingTasks
  .map(
    (t) =>
      `<li>${t.goal || 'Untitled Task'} - Due: ${new Date(
        t.deadline
      ).toLocaleDateString()}</li>`
  )
  .join('')}
</ul>`
    : ''
}

<p><a href="${process.env.FRONTEND_URL}/dashboard">View Dashboard</a></p>
</body>
</html>`,
    text: `Hi ${userName},

Tasks Completed: ${stats.completed}
Tasks Due: ${stats.totalDue}
Completion Rate: ${stats.completionRate}%

${
  overdueTasks.length > 0
    ? overdueTasks
        .map((t) => {
          const daysOverdue = Math.floor(
            (new Date() - new Date(t.deadline)) /
              (1000 * 60 * 60 * 24)
          );
          return `• ${t.goal || 'Untitled Task'}${
            daysOverdue > 0 ? ` - Overdue by ${daysOverdue} day(s)` : ''
          }`;
        })
        .join('\n')
    : ''
}

Dashboard:
${process.env.FRONTEND_URL}/dashboard`,
  }),

  /* ---------- TASK REMINDER ---------- */
  taskReminder: (userName, task, courseName) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const taskId = task?._id || '';
    const taskGoal = task?.goal || 'Unnamed Task';
    const taskDeadline = task?.deadline
      ? new Date(task.deadline).toLocaleString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No deadline set';

    return {
      subject: `⏰ Reminder: "${taskGoal}" is due in 5 minutes!`,
      html: `<!DOCTYPE html>
<html>
<body>
<p>Hi ${userName || 'there'},</p>

<p>Your task <strong>${taskGoal}</strong> is due soon.</p>
<p><strong>Course:</strong> ${courseName || 'Unnamed Course'}</p>
<p><strong>Due:</strong> ${taskDeadline}</p>

<p>
<a href="${frontendUrl}/tasks/${taskId}">Mark as Complete</a>
</p>

<p>© ${new Date().getFullYear()} Chrono</p>
</body>
</html>`,
      text: `Hi ${userName || 'there'},

"${taskGoal}" is due in 5 minutes!
Course: ${courseName || 'Unnamed Course'}
Due: ${taskDeadline}

${frontendUrl}/tasks/${taskId}

Chrono © ${new Date().getFullYear()}`,
    };
  },
};

/* ===========================
   BASE EMAIL SENDER
   =========================== */
export const sendEmail = async (to, template) => {
  if (!resend) {
    return { success: false, error: 'Resend not configured'}
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Chronos <onboarding@resend.dev>',
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'Chrono',
        'List-Unsubscribe': `<${process.env.FRONTEND_URL}/api/settings/notifications>`,
      },
    });
    if (error) {
      console.error('Error sending email', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/* ===========================
   EMAIL PREFERENCE CHECK
   =========================== */
export const shouldSendEmail = async (userId) => {
  try {
    const user = await User.findById(userId).select('emailNotifications');
    if (!user) return false;
    return user.emailNotifications !== false;
  } catch {
    return false;
  }
};

/* ===========================
   WRAPPERS
   =========================== */
export const sendEmailIfEnabled = async (userId, email, template) => {
  if (!(await shouldSendEmail(userId))) {
    return { success: false, reason: 'notifications_disabled' };
  }
  return sendEmail(email, template);
};

export const sendWelcomeEmail = (email, name) =>
  sendEmail(email, emailTemplates.welcome(name));

export const sendWeeklySummaryEmail = (
  userId,
  email,
  name,
  completed,
  upcoming,
  overdue,
  stats
) =>
  sendEmailIfEnabled(
    userId,
    email,
    emailTemplates.weeklySummary(
      name,
      completed,
      upcoming,
      overdue,
      stats
    )
  );

export const sendTaskReminderEmail = (
  userId,
  email,
  name,
  task,
  course
) =>
  sendEmailIfEnabled(
    userId,
    email,
    emailTemplates.taskReminder(name, task, course)
  );
