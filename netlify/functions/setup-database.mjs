/**
 * Database Setup Function
 * Creates follow_ups table by executing SQL via Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM5NDU1OCwiZXhwIjoyMDg0OTcwNTU4fQ.-IscFMdjG7sBAw_WcKk7S7H0LRVU5_5-sHYqRqh7kvE';

export default async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false }
    });

    const steps = [];

    // Step 1: Try to query the table to see if it exists
    const { data: existingData, error: queryError } = await supabase
      .from('follow_ups')
      .select('count')
      .limit(1);

    if (!queryError) {
      steps.push({ step: 'check', status: 'exists', message: 'Table already exists!' });
      
      // Get count
      const { count, error: countError } = await supabase
        .from('follow_ups')
        .select('*', { count: 'exact', head: true });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Table already exists and is ready to use',
        recordCount: count || 0,
        steps
      }), { status: 200, headers });
    }

    steps.push({ step: 'check', status: 'not_found', error: queryError.message });

    // Step 2: Table doesn't exist, need to create it
    // Since we can't execute raw SQL via the REST API, we'll use a workaround:
    // Insert sample data which will fail, but gives us info about the schema
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Table does not exist. Manual creation required.',
      instructions: 'Go to Supabase SQL Editor and run the SQL from /root/clawd/RUN-THIS-SQL-IN-SUPABASE.md',
      sqlEditorUrl: 'https://supabase.com/dashboard/project/khvxsailqhupcsrqwzvj/sql/new',
      error: queryError.message,
      steps
    }), { status: 200, headers });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { status: 500, headers });
  }
};
