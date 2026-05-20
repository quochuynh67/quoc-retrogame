import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function run(gameName) {
  console.log(`Starting test for game: ${gameName}`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logFile = path.join(process.cwd(), 'scratch', `${gameName}_boot.log`);
  fs.writeFileSync(logFile, `=== Boot log for ${gameName} ===\n`);

  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}\n`;
    fs.appendFileSync(logFile, text);
    console.log(`[Browser] ${text.trim()}`);
  });

  page.on('pageerror', err => {
    const text = `[ERROR] ${err.toString()}\n`;
    fs.appendFileSync(logFile, text);
    console.error(`[Browser Error] ${text.trim()}`);
  });

  try {
    await page.goto(`http://localhost:5173/?game=${gameName}`, { timeout: 30000 });
    console.log(`Page loaded for ${gameName}. Waiting for 15 seconds to capture logs...`);
    await page.waitForTimeout(15000);
  } catch (e) {
    console.error(`Error during run:`, e);
  } finally {
    await browser.close();
    console.log(`Finished test for game: ${gameName}. Logs written to ${logFile}`);
  }
}

const game = process.argv[2] || 'kov';
run(game);
