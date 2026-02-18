/**
 * Property Meld Sync Function - UNIT TURNS FROM PROJECTS TAB
 * Scrapes REAL unit turn data from Property Meld Projects section
 * Using Puppeteer + chrome-aws-lambda for Netlify compatibility
 */

import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTQ1NTgsImV4cCI6MjA4NDk3MDU1OH0.6MgcJlsvBIXjRBainZzt-yrqUoth1BWJ6fpiNs0ntkM';

const PM_EMAIL = 'mmanager@10xpropertymanagers.com';
const PM_PASSWORD = 'Fieldmanager17!';

export default async (req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  let browser;
  try {
    console.log('🚀 Starting Property Meld UNIT TURNS sync...');
    
    // Launch browser with chrome-aws-lambda
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Login to Property Meld
    console.log('🔐 Logging into Property Meld...');
    await page.goto('https://app.propertymeld.com/login', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    await page.type('input[name="email"], input[type="email"]', PM_EMAIL);
    await page.type('input[name="password"], input[type="password"]', PM_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });

    // Navigate to Projects tab
    console.log('📋 Navigating to Projects tab...');
    await page.goto('https://app.propertymeld.com/2197/m/2197/projects/?completed=false&order_by=due_date', { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    // Wait for the grid to load
    await page.waitForSelector('div[role="grid"]', { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Extract unit turn data from the table
    const unitTurns = await page.evaluate(() => {
      const results = [];
      
      // Find all project rows in the grid
      const rows = document.querySelectorAll('div[role="grid"] div[role="rowgroup"]:not(:first-child) div[role="row"]');
      
      console.log('Found project rows:', rows.length);
      
      rows.forEach((row, index) => {
        try {
          const cells = row.querySelectorAll('div[role="gridcell"]');
          
          if (cells.length >= 4) {
            // Extract data from cells
            const nameCell = cells[0];
            const propertyCell = cells[1];
            const addressCell = cells[2];
            const unitCell = cells[3];
            
            const projectName = nameCell?.textContent?.trim() || '';
            const propertyName = propertyCell?.textContent?.trim() || '';
            const address = addressCell?.textContent?.trim() || '';
            const unit = unitCell?.textContent?.trim() || '';
            
            // Extract project ID from the link
            const link = nameCell.querySelector('a');
            const projectUrl = link?.getAttribute('href') || '';
            const projectIdMatch = projectUrl.match(/\/projects\/(\d+)\//);
            const projectId = projectIdMatch ? projectIdMatch[1] : `proj-${index}`;
            
            if (projectName && address) {
              results.push({
                id: projectId,
                name: projectName,
                property: propertyName,
                address: address,
                unit: unit,
                url: projectUrl ? `https://app.propertymeld.com${projectUrl}` : null,
                status: 'Active',
                type: 'Turn'
              });
            }
          }
        } catch (err) {
          console.error('Error parsing project row:', err);
        }
      });
      
      return results;
    });

    console.log(`✅ Found ${unitTurns.length} unit turns in Projects tab`);

    // Save to Supabase follow_ups table
    if (unitTurns.length > 0) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const followUps = unitTurns.map(turn => ({
        property_address: turn.address,
        contact_name: turn.property,
        follow_up_type: 'UNIT_TURN',
        priority: 'high',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Unit Turn Project: ${turn.name}\n\nProperty: ${turn.property}\nUnit: ${turn.unit}\nAddress: ${turn.address}\n\nProject URL: ${turn.url}`,
        status: 'pending',
        created_by: 'property-meld-sync',
        reminder_sent: false
      }));

      const { data, error } = await supabase
        .from('follow_ups')
        .insert(followUps);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Failed to save follow-ups: ${error.message}`);
      }

      console.log(`💾 Saved ${followUps.length} unit turn follow-ups to database`);
    }

    await browser.close();

    return new Response(
      JSON.stringify({
        success: true,
        unitTurns: unitTurns,
        count: unitTurns.length,
        message: unitTurns.length > 0 
          ? `Successfully synced ${unitTurns.length} unit turns from Property Meld Projects`
          : 'No unit turns found in Projects tab.',
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('❌ Property Meld sync failed:', error);
    
    if (browser) {
      await browser.close();
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers }
    );
  }
};
