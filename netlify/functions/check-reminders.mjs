/**
 * Check Reminders Cron Job
 * Runs every hour to check for due reminders and send them
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WALTER_CHAT_ID = process.env.WALTER_TELEGRAM_CHAT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async (req) => {
  try {
    console.log('Checking for due reminders...');

    // Get all follow-ups that need reminders
    const { data: dueReminders, error } = await supabase
      .from('follow_ups')
      .select('*')
      .in('status', ['PENDING', 'REMINDED'])
      .lte('remind_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!dueReminders || dueReminders.length === 0) {
      console.log('No reminders due');
      return new Response(JSON.stringify({ message: 'No reminders due', count: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${dueReminders.length} due reminders`);

    // Send each reminder
    const results = [];
    for (const reminder of dueReminders) {
      try {
        // Format the message
        const priorityEmoji = {
          URGENT: '🚨',
          HIGH: '⚠️',
          MEDIUM: '📋',
          LOW: 'ℹ️'
        };

        const emoji = priorityEmoji[reminder.priority] || '📋';
        const dueDate = new Date(reminder.due_date);
        const isOverdue = dueDate < new Date();

        let message = `${emoji} <b>${reminder.title}</b>\n\n`;
        message += `${reminder.description}\n\n`;
        message += `<b>Action:</b> ${reminder.action_needed}\n`;
        
        if (reminder.property_address) {
          message += `<b>Property:</b> ${reminder.property_address}\n`;
        }
        
        if (reminder.vendor_name) {
          message += `<b>Vendor:</b> ${reminder.vendor_name}`;
          if (reminder.vendor_contact) {
            message += ` (${reminder.vendor_contact})`;
          }
          message += '\n';
        }
        
        if (reminder.owner_name) {
          message += `<b>Owner:</b> ${reminder.owner_name}`;
          if (reminder.owner_contact) {
            message += ` (${reminder.owner_contact})`;
          }
          message += '\n';
        }

        message += `\n<b>Due:</b> ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}`;
        
        if (isOverdue) {
          message += ' ⏰ <b>OVERDUE</b>';
        }

        // Send to Telegram
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: WALTER_CHAT_ID,
              text: message,
              parse_mode: 'HTML'
            })
          }
        );

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
          // Update the follow-up record
          await supabase
            .from('follow_ups')
            .update({
              reminders_sent: (reminder.reminders_sent || 0) + 1,
              last_reminder_at: new Date().toISOString(),
              status: 'REMINDED'
            })
            .eq('id', reminder.id);

          results.push({ id: reminder.id, success: true });
          console.log(`Sent reminder for: ${reminder.title}`);
        } else {
          console.error(`Failed to send reminder for ${reminder.id}:`, telegramResult);
          results.push({ id: reminder.id, success: false, error: telegramResult });
        }

      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        results.push({ id: reminder.id, success: false, error: err.message });
      }
    }

    return new Response(JSON.stringify({
      message: 'Reminder check complete',
      total: dueReminders.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in check-reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  schedule: '@hourly' // Run every hour
};
