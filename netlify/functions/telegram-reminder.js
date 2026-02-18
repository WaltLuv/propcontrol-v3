/**
 * Telegram Reminder Bot
 * Sends automated reminders to Walter's phone
 */

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const WALTER_CHAT_ID = process.env.WALTER_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !WALTER_CHAT_ID) {
      console.error('Missing Telegram credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Telegram not configured',
          hasToken: !!TELEGRAM_BOT_TOKEN,
          hasChatId: !!WALTER_CHAT_ID
        })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { message, priority = 'MEDIUM', followUpId } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Add priority emoji
    const priorityEmoji = {
      URGENT: '🚨',
      HIGH: '⚠️',
      MEDIUM: '📋',
      LOW: 'ℹ️'
    };

    const emoji = priorityEmoji[priority] || '📋';
    const formattedMessage = `${emoji} PropControl Reminder\n\n${message}`;

    // Send to Telegram
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: WALTER_CHAT_ID,
        text: formattedMessage,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to send message', details: result })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        messageId: result.result.message_id,
        followUpId 
      })
    };

  } catch (error) {
    console.error('Error sending reminder:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
