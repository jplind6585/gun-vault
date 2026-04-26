// ═══════════════════════════════════════════════════════════════════════════
//  Lindcott Armory — Supabase → Google Sheets Weekly Mirror
//
//  SOURCE OF TRUTH: Supabase. This script is READ-ONLY against Supabase.
//  The Sheet is a mirror — do not edit it; changes will be overwritten.
//
//  HOW TO SET UP:
//  1. Go to https://script.google.com → New project → paste this entire file
//  2. Click the gear icon (Project Settings) → Script Properties → Add:
//       SUPABASE_URL   = https://joturvmcygdmpnhfsslu.supabase.co
//       SUPABASE_KEY   = <your anon key from web/.env>
//  3. Run installTrigger() once (Run menu → Run function → installTrigger)
//     — authorize when prompted
//  4. Run runNow() to do the first sync immediately
//  5. The Sheet "Lindcott Armory — Reference Data" will appear in your Drive
//
//  ADDING NEW TABLES:
//  Just add the table name to the TABLES array below. Next sync will
//  auto-create the tab, write headers from actual column names, and populate.
//
//  COLUMN CHANGES:
//  Handled automatically. Headers are derived from live Supabase data each
//  sync, so new or removed columns update without any script changes.
// ═══════════════════════════════════════════════════════════════════════════

// ── Configuration ────────────────────────────────────────────────────────────

const SHEET_NAME = 'Lindcott Armory — Reference Data';

// All tables to mirror. Add new ones here as they're created in Supabase.
const TABLES = [
  'manufacturers',
  'gun_models',
  'optic_models',
  'ammo_brands',
  'bullet_types',
  'powder_brands',
  'primer_types',
  'gun_ranges',
  'gun_clubs',
  'cartridges',
  'retailers',
  'retailer_categories',
];

// Columns to put first in each tab (rest follow alphabetically).
// Add overrides here for any table if you want a specific column order.
const COLUMN_ORDER_HINTS = {
  manufacturers:  ['name', 'country_of_origin', 'founded_year', 'active', 'categories'],
  gun_models:     ['make', 'model', 'caliber', 'type', 'action', 'capacity', 'year_introduced'],
  optic_models:   ['brand', 'model', 'optic_type', 'magnification_min', 'magnification_max', 'objective_mm', 'msrp_usd'],
  ammo_brands:    ['name', 'country_of_origin', 'active', 'specialties'],
  bullet_types:   ['name', 'abbreviation', 'best_use', 'construction'],
  powder_brands:  ['brand', 'product_name', 'burn_rate_rank', 'powder_type', 'best_use'],
  primer_types:   ['name', 'category', 'brand', 'common_calibers'],
  gun_ranges:     ['name', 'city', 'state', 'range_types', 'max_distance_yards'],
  gun_clubs:      ['name', 'city', 'state', 'affiliations', 'founded_year'],
  cartridges:          ['name', 'type', 'caliber', 'year_introduced', 'country_of_origin'],
  retailers:           ['name', 'ownership_type', 'url', 'active', 'notes'],
  retailer_categories: ['retailer_id', 'primary_category', 'secondary_categories', 'featured'],
};

// Tab colors per table (hex). Optional — comment out any line to use default.
const TAB_COLORS = {
  manufacturers:  '#e8f4f8',
  gun_models:     '#fef9e7',
  optic_models:   '#f0f8e8',
  ammo_brands:    '#fce8f0',
  bullet_types:   '#f8ece8',
  powder_brands:  '#ece8f8',
  primer_types:   '#e8f8ec',
  gun_ranges:     '#f8f0e8',
  gun_clubs:      '#e8ecf8',
  cartridges:          '#f0e8f8',
  retailers:           '#e8f8f0',
  retailer_categories: '#f8f8e8',
};

// ── Entry points ─────────────────────────────────────────────────────────────

/** Called by the weekly trigger. Syncs all tables. */
function weeklySync() {
  _sync();
}

/** Call manually from the Run menu to sync immediately. */
function runNow() {
  _sync();
}

/** Run once to install the weekly trigger (Monday 6 AM). */
function installTrigger() {
  // Remove any existing weeklySync triggers to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'weeklySync')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('weeklySync')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(6)
    .create();

  Logger.log('✓ Weekly trigger installed: every Monday at 6:00 AM');
}

// ── Core sync ─────────────────────────────────────────────────────────────────

function _sync() {
  const props = PropertiesService.getScriptProperties();
  const url   = props.getProperty('SUPABASE_URL');
  const key   = props.getProperty('SUPABASE_KEY');

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in Script Properties. See setup instructions at top of file.');
  }

  const ss  = _getOrCreateSheet();
  const log = [`Sync started: ${new Date().toISOString()}`, ''];

  for (const table of TABLES) {
    try {
      const rows = _fetchAll(url, key, table);
      _writeTable(ss, table, rows);
      log.push(`✓  ${table.padEnd(20)} ${rows.length} rows`);
      Logger.log(`✓ ${table}: ${rows.length} rows`);
    } catch (err) {
      log.push(`✗  ${table.padEnd(20)} ERROR: ${err.message}`);
      Logger.log(`✗ ${table}: ${err.message}`);
    }
  }

  log.push('', `Sync completed: ${new Date().toISOString()}`);
  _appendLog(ss, log);
}

// ── Supabase fetch with pagination ───────────────────────────────────────────

function _fetchAll(supabaseUrl, key, table) {
  const PAGE = 1000;
  const all  = [];
  let offset = 0;

  for (;;) {
    const endpoint = `${supabaseUrl}/rest/v1/${table}?select=*&limit=${PAGE}&offset=${offset}`;
    const res = UrlFetchApp.fetch(endpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Accept': 'application/json',
      },
      muteHttpExceptions: true,
    });

    const code = res.getResponseCode();
    if (code !== 200) {
      const body = res.getContentText().slice(0, 400);
      throw new Error(`HTTP ${code} — ${body}`);
    }

    const page = JSON.parse(res.getContentText());
    if (!Array.isArray(page) || page.length === 0) break;

    all.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }

  return all;
}

// ── Write one table to a tab ──────────────────────────────────────────────────

function _writeTable(ss, tableName, rows) {
  // Create tab if missing
  let sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    sheet = ss.insertSheet(tableName);
    Logger.log(`Created new tab: ${tableName}`);
  }

  // Apply tab color if configured
  if (TAB_COLORS[tableName]) {
    sheet.setTabColor(TAB_COLORS[tableName]);
  }

  sheet.clearContents();
  sheet.clearFormats();
  sheet.clearNotes();

  if (rows.length === 0) {
    sheet.getRange(1, 1).setValue(`(${tableName} has no rows yet)`);
    sheet.getRange(1, 1).setFontColor('#999999').setFontStyle('italic');
    return;
  }

  // Build column order: hints first, then remaining keys alphabetically
  const allKeys   = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const hints     = COLUMN_ORDER_HINTS[tableName] || [];
  const hintCols  = hints.filter(h => allKeys.includes(h));
  const restCols  = allKeys.filter(k => !hintCols.includes(k)).sort();
  const columns   = [...hintCols, ...restCols];

  // Build 2D array
  const matrix = [
    columns,
    ...rows.map(row =>
      columns.map(col => {
        const v = row[col];
        if (v === null || v === undefined) return '';
        if (Array.isArray(v))             return v.join(', ');
        if (typeof v === 'object')        return JSON.stringify(v);
        if (typeof v === 'boolean')       return v ? 'TRUE' : 'FALSE';
        return v;
      })
    ),
  ];

  // Write all at once
  sheet.getRange(1, 1, matrix.length, columns.length).setValues(matrix);

  // ── Header styling ──
  const headerRow = sheet.getRange(1, 1, 1, columns.length);
  headerRow
    .setBackground('#1a1a2e')
    .setFontColor('#ffd43b')
    .setFontWeight('bold')
    .setFontFamily('Courier New')
    .setFontSize(9)
    .setWrap(false);

  // ── Alternating row bands ──
  const dataRows = sheet.getRange(2, 1, rows.length, columns.length);
  dataRows.setFontFamily('Courier New').setFontSize(9);

  for (let r = 2; r <= rows.length + 1; r++) {
    const bg = r % 2 === 0 ? '#f5f5f5' : '#ffffff';
    sheet.getRange(r, 1, 1, columns.length).setBackground(bg);
  }

  // ── Freeze + auto-resize ──
  sheet.setFrozenRows(1);
  for (let c = 1; c <= columns.length; c++) {
    sheet.autoResizeColumn(c);
    const w = sheet.getColumnWidth(c);
    if (w > 320) sheet.setColumnWidth(c, 320);
    if (w < 60)  sheet.setColumnWidth(c, 60);
  }

  // ── Sync timestamp note on header ──
  sheet.getRange(1, 1).setNote(`Last synced: ${new Date().toISOString()}\n${rows.length} rows`);
}

// ── Sync log tab ─────────────────────────────────────────────────────────────

function _appendLog(ss, lines) {
  const TAB = '_sync_log';
  let sheet = ss.getSheetByName(TAB);
  if (!sheet) {
    sheet = ss.insertSheet(TAB);
    // Keep log tab at the far right
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(ss.getNumSheets());
    sheet.setTabColor('#cccccc');
  }

  // Insert a blank separator row, then the new log block at the top
  const blockHeight = lines.length + 1;
  sheet.insertRowsBefore(1, blockHeight);

  lines.forEach((line, i) => {
    const cell = sheet.getRange(i + 1, 1);
    cell.setValue(line);
    if (line.startsWith('✓')) cell.setFontColor('#2d6a4f');
    else if (line.startsWith('✗')) cell.setFontColor('#c0392b');
    else if (i === 0) cell.setFontWeight('bold');
  });

  sheet.autoResizeColumn(1);
}

// ── Get or create the spreadsheet ────────────────────────────────────────────

function _getOrCreateSheet() {
  // Search Drive for an existing sheet with this name
  const iter = DriveApp.getFilesByName(SHEET_NAME);
  if (iter.hasNext()) {
    return SpreadsheetApp.openById(iter.next().getId());
  }

  // Not found — create it
  const ss = SpreadsheetApp.create(SHEET_NAME);
  Logger.log(`Created new spreadsheet: ${SHEET_NAME}`);

  // Delete the default blank sheet
  const blank = ss.getSheetByName('Sheet1');
  if (blank) {
    ss.insertSheet('_placeholder');
    ss.deleteSheet(blank);
  }

  return ss;
}
