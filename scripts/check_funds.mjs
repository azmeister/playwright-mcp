import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parse/lib/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readCsv(file) {
  const data = await fs.readFile(file, 'utf8');
  return csv(data, { columns: false, skip_empty_lines: true }).map(row => row[0]);
}

async function run(urlsPath) {
  const urls = await readCsv(urlsPath);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  for (const url of urls) {
    const entry = { url, issues: [] };
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      if (!title) entry.issues.push('Missing page title');
      const text = await page.textContent('body');
      if (text && !/important information|disclaimer/i.test(text)) {
        entry.issues.push('Missing compliance disclaimer');
      }
    } catch (e) {
      entry.issues.push(`Navigation error: ${e.message}`);
    }
    results.push(entry);
  }

  await browser.close();
  await fs.writeFile(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
}

const urlsArgIndex = process.argv.indexOf('--urls');
const urlsFile = urlsArgIndex !== -1 ? process.argv[urlsArgIndex + 1] : 'config/urls.csv';
run(urlsFile).catch(e => {
  console.error(e);
  process.exit(1);
});
