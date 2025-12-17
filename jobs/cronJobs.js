import cron from 'node-cron';
import User from '../models/User.js';
import Task from '../models/Task.js';
import {
  sendWeeklySummaryEmail,
  sendTaskReminderEmail
} from '../services/emailService.js';

// Helper to get current Nigeria time
const getNowLagos = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));

/* ============================
   WEEKLY SUMMARY (SUNDAYS 6PM)
   ============================ */
cron.schedule(
  '0 18 * * 0',
  async () => {
    console.log('Sending weekly summaries...');

    try {
      const users = await User.find();

      const now = getNowLagos();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      for (const user of users) {
        // Tasks completed in the last 7 days
        const completedTasks = await Task.find({
          user: user._id,
          completed: true,
          updatedAt: { $gte: oneWeekAgo }
        }).populate('course');

        // Tasks that were due in the last 7 days
        const tasksDueLastWeek = await Task.find({
          user: user._id,
          deadline: { $gte: oneWeekAgo, $lte: now }
        }).populate('course');

        // Upcoming tasks in the next 7 days
        const upcomingTasks = await Task.find({
          user: user._id,
          completed: false,
          deadline: { $gte: now, $lte: oneWeekAhead }
        }).populate('course');

        // Overdue tasks
        const overdueTasks = await Task.find({
          user: user._id,
          completed: false,
          deadline: { $lt: now }
        })
          .populate('course')
          .sort({ deadline: 1 });

        const completedOfDue = tasksDueLastWeek.filter(t => t.completed).length;

        const stats = {
          completed: completedTasks.length,
          totalDue: tasksDueLastWeek.length,
          completionRate:
            tasksDueLastWeek.length > 0
              ? Math.round((completedOfDue / tasksDueLastWeek.length) * 100)
              : 0,
          overdue: overdueTasks.length
        };

        const result = await sendWeeklySummaryEmail(
          user._id,
          user.email,
          user.name,
          completedTasks,
          upcomingTasks,
          overdueTasks,
          stats
        );

        if (result.success) {
          console.log(`Weekly summary sent to: ${user.email}`);
        } else {
          console.log(
            `Weekly summary skipped for ${user.email}: ${
              result.reason || result.error
            }`
          );
        }
      }
    } catch (err) {
      console.error('Error sending weekly summaries:', err);
    }
  },
  {
    timezone: 'Africa/Lagos'
  }
);

/* ============================
   TASK REMINDERS (EVERY MINUTE)
   ============================ */
cron.schedule(
  '* * * * *',
  async () => {
    try {
      const now = getNowLagos();
      const fiveMinMark = new Date(now.getTime() + 5 * 60 * 1000);
      const oneMinAfter = new Date(now.getTime() + 6 * 60 * 1000);

      const upcoming = await Task.find({
        completed: false,
        remainderSent: { $ne: true },
        deadline: {
          $gte: fiveMinMark,
          $lt: oneMinAfter
        }
      }).populate('user course');

      for (const task of upcoming) {
        const result = await sendTaskReminderEmail(
          task.user._id,
          task.user.email,
          task.user.name,
          task,
          task.course?.courseTitle || 'course'
        );

        if (result.success) {
          console.log(`Task reminder sent to: ${task.user.email}`);
        } else {
          console.log(
            `Task reminder skipped for ${task.user.email}: ${
              result.reason || result.error
            }`
          );
        }

        // Mark as sent to avoid duplicates
        task.remainderSent = true;
        await task.save();
      }
    } catch (err) {
      console.error(`Error sending task reminders: ${err.message}`);
    }
  },
  {
    timezone: 'Africa/Lagos'
  }
);
