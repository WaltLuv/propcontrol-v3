/**
 * One-time function to create the follow_ups table
 * Call this once to set up the database schema
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM5NDU1OCwiZXhwIjoyMDg0OTcwNTU4fQ.-IscFMdjG7sBAw_WcKk7S7H0LRVU5_5-sHYqRqh7kvE';

export default async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log('Creating follow_ups table...');

    // Create table using direct query
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        property_id TEXT,
        property_address TEXT,
        work_order_id TEXT,
        vendor_name TEXT,
        vendor_contact TEXT,
        owner_name TEXT,
        owner_contact TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        action_needed TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date TIMESTAMP NOT NULL,
        remind_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        reminders_sent INTEGER DEFAULT 0,
        last_reminder_at TIMESTAMP,
        message_template TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        notion_page_id TEXT,
        synced_to_notion BOOLEAN DEFAULT FALSE,
        last_notion_sync TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_priority ON follow_ups(priority);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_remind_at ON follow_ups(remind_at);

      ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow all operations on follow_ups" ON follow_ups;
      CREATE POLICY "Allow all operations on follow_ups"
        ON follow_ups FOR ALL USING (true) WITH CHECK (true);
    `;

    // Use postgres wire protocol via REST API
    const pgResponse = await fetch('https://khvxsailqhupcsrqwzvj.supabase.co/rest/v1/rpc', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: createTableSQL
      })
    });

    const pgResult = await pgResponse.text();
    console.log('PG Response:', pgResult);

    // Fallback: Try inserting a test record to verify table exists
    const { data, error } = await supabase.from('follow_ups').select('*').limit(1);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Table created successfully!'
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers
    });
  }
};
