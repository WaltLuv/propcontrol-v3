/**
 * Monday.com Complete Sync - ALL BOARDS
 * Unit Turns, Move-Out Inspections, Reno Projects, New Onboarding, Field Visits
 */

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://khvxsailqhupcsrqwzvj.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodnhzYWlscWh1cGNzcnF3enZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzOTQ1NTgsImV4cCI6MjA4NDk3MDU1OH0.6MgcJlsvBIXjRBainZzt-yrqUoth1BWJ6fpiNs0ntkM';

const MONDAY_EMAIL = 'mmanager@10xpropertymanagers.com';
const MONDAY_PASSWORD = 'Newvintage17!';

// Board URLs you need to track
const BOARDS = {
  UNIT_TURNS: 'https://10xpropertymanagers.monday.com/boards/unit-turns',
  MOVE_OUT_INSPECTIONS: 'https://10xpropertymanagers.monday.com/boards/move-out-inspections',
  RENO_PROJECTS: 'https://10xpropertymanagers.monday.com/boards/renovations',
  NEW_ONBOARDING: 'https://10xpropertymanagers.monday.com/boards/onboarding',
  FIELD_VISITS: 'https://10xpropertymanagers.monday.com/boards/field-visits'
};

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
    console.log('🚀 Starting Monday.com FULL SYNC...');
    
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login to Monday.com
    console.log('🔐 Logging into Monday.com...');
    await page.goto('https://auth.monday.com/users/sign_in');
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    await page.fill('input[name="email"], input[type="email"]', MONDAY_EMAIL);
    await page.fill('input[name="password"], input[type="password"]', MONDAY_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Log in")');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const allTasks = [];

    // Function to scrape a Monday.com board
    const scrapeBoard = async (boardName, boardUrl) => {
      console.log(`📋 Scraping ${boardName}...`);
      
      try {
        await page.goto(boardUrl, { timeout: 15000, waitUntil: 'networkidle' });
        await page.waitForTimeout(3000); // Let board load
        
        const boardData = await page.evaluate((name) => {
          const results = [];
          
          // Monday.com uses complex selectors - try multiple approaches
          const itemRows = document.querySelectorAll(
            '[data-testid="item-row"], .board-row, [class*="pulse"], [class*="item"]'
          );
          
          console.log(`Found ${itemRows.length} rows in ${name}`);
          
          itemRows.forEach((row, index) => {
            try {
              const text = row.textContent || '';
              
              // Extract property/unit from first column
              const firstCol = row.querySelector('[data-testid="cell-0"], .first-cell, [class*="name"]');
              const property = firstCol?.textContent?.trim() || `Item ${index + 1}`;
              
              // Extract status
              const statusCol = row.querySelector('[data-testid*="status"], [class*="status"]');
              const status = statusCol?.textContent?.trim() || 'Active';
              
              // Extract date if available
              const dateCol = row.querySelector('[data-testid*="date"], [class*="date"]');
              const dateText = dateCol?.textContent?.trim();
              
              // Extract owner/assigned
              const ownerCol = row.querySelector('[data-testid*="person"], [class*="person"]');
              const owner = ownerCol?.textContent?.trim() || 'Unassigned';
              
              // Get priority from color or label
              let priority = 'MEDIUM';
              if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap')) {
                priority = 'URGENT';
              } else if (text.toLowerCase().includes('high priority')) {
                priority = 'HIGH';
              }
              
              if (property && property.length > 2) {
                results.push({
                  boardName: name,
                  property: property,
                  status: status,
                  dueDate: dateText,
                  assignedTo: owner,
                  priority: priority,
                  rawText: text.slice(0, 200)
                });
              }
            } catch (err) {
              console.error(`Error parsing row in ${name}:`, err);
            }
          });
          
          return results;
        }, boardName);
        
        console.log(`✅ ${boardName}: Found ${boardData.length} items`);
        return boardData;
        
      } catch (err) {
        console.error(`❌ Failed to scrape ${boardName}:`, err.message);
        return [];
      }
    };

    // Scrape all boards
    const unitTurns = await scrapeBoard('Unit Turns', BOARDS.UNIT_TURNS);
    const moveOuts = await scrapeBoard('Move-Out Inspections', BOARDS.MOVE_OUT_INSPECTIONS);
    const renoProjects = await scrapeBoard('Reno Projects', BOARDS.RENO_PROJECTS);
    const onboarding = await scrapeBoard('New Onboarding', BOARDS.NEW_ONBOARDING);
    const fieldVisits = await scrapeBoard('Field Visits', BOARDS.FIELD_VISITS);

    // Combine all tasks
    allTasks.push(...unitTurns, ...moveOuts, ...renoProjects, ...onboarding, ...fieldVisits);
    
    console.log(`📊 TOTAL TASKS FOUND: ${allTasks.length}`);

    // Save to Supabase
    if (allTasks.length > 0) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      
      const followUps = allTasks.map((task, idx) => {
        // Determine follow-up type based on board
        let type = 'VENDOR_QUOTE';
        if (task.boardName.includes('Move-Out')) type = 'OWNER_APPROVAL';
        if (task.boardName.includes('Onboarding')) type = 'VENDOR_QUOTE';
        if (task.boardName.includes('Field')) type = 'TURN_DEADLINE';
        
        // Calculate due date
        let dueDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours default
        if (task.dueDate) {
          try {
            const parsed = new Date(task.dueDate);
            if (!isNaN(parsed.getTime())) {
              dueDate = parsed;
            }
          } catch (e) {}
        }
        
        return {
          id: `monday-${task.boardName.toLowerCase().replace(/\s+/g, '-')}-${idx}-${Date.now()}`,
          type: type,
          status: task.status.toLowerCase().includes('done') ? 'COMPLETED' : 'PENDING',
          priority: task.priority,
          property_address: task.property,
          title: `${task.boardName}: ${task.property}`,
          description: `Board: ${task.boardName}\nStatus: ${task.status}\nAssigned: ${task.assignedTo}`,
          action_needed: `Follow up on ${task.property} - ${task.boardName}`,
          created_at: new Date().toISOString(),
          due_date: dueDate.toISOString(),
          remind_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
          message_template: `📋 MONDAY.COM UPDATE\n\nBoard: ${task.boardName}\nProperty: ${task.property}\nStatus: ${task.status}\nAssigned: ${task.assignedTo}\n${task.dueDate ? `Due: ${task.dueDate}\n` : ''}\nAction: Follow up needed`,
          metadata: JSON.stringify({
            source: 'monday_com',
            board: task.boardName,
            status: task.status,
            assigned_to: task.assignedTo,
            due_date: task.dueDate,
            imported_at: new Date().toISOString()
          })
        };
      });

      const { error } = await supabase
        .from('follow_ups')
        .upsert(followUps, { onConflict: 'id' });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(`Failed to save follow-ups: ${error.message}`);
      }

      console.log(`💾 Saved ${followUps.length} Monday.com follow-ups to database`);
    }

    await browser.close();

    // Generate summary by board
    const summary = {
      unitTurns: unitTurns.length,
      moveOutInspections: moveOuts.length,
      renoProjects: renoProjects.length,
      newOnboarding: onboarding.length,
      fieldVisits: fieldVisits.length,
      total: allTasks.length
    };

    return new Response(
      JSON.stringify({
        success: true,
        summary: summary,
        tasks: allTasks,
        message: `Successfully synced ${allTasks.length} tasks from Monday.com across all boards`
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('❌ Monday.com sync failed:', error);
    
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
