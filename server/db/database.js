const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'inventory.db'))

db.exec(`

  CREATE TABLE IF NOT EXISTS iirup_items (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    property_no             TEXT,
    particulars             TEXT NOT NULL,
    category                TEXT NOT NULL,
    date_acquired           TEXT,
    quantity                INTEGER DEFAULT 1,
    unit_cost               REAL,
    total_cost              REAL,
    accumulated_depreciation REAL,
    carrying_amount         REAL,
    disposal_type           TEXT,
    disposal_status         TEXT DEFAULT 'pending',
    remarks                 TEXT,
    report_date             TEXT,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ppe_items (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    no                      INTEGER,
    accountable_person      TEXT,
    division                TEXT,
    account_name            TEXT,
    description             TEXT NOT NULL,
    property_number         TEXT,
    year                    INTEGER,
    date_acquired           TEXT,
    amount                  REAL,
    quantity                INTEGER DEFAULT 1,
    remarks                 TEXT,
    location                TEXT,
    sticker_status          TEXT,
    type                    TEXT NOT NULL,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rpcppe_items (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    article_no              INTEGER,
    description             TEXT NOT NULL,
    property_number         TEXT,
    unit_of_measure         TEXT,
    unit_value              REAL,
    balance_per_card        INTEGER,
    on_hand_per_count       INTEGER,
    shortage_overage        REAL,
    remarks                 TEXT,
    accountable_person      TEXT,
    date_acquired           TEXT,
    location                TEXT,
    ppe_type                TEXT,
    fund_cluster            TEXT,
    report_date             TEXT,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS supply_items (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name               TEXT NOT NULL,
    category                TEXT DEFAULT 'General',
    section                 TEXT DEFAULT 'General',
    unit                    TEXT NOT NULL,
    quantity_in             REAL DEFAULT 0,
    quantity_out            REAL DEFAULT 0,
    balance                 REAL DEFAULT 0,
    unit_cost               REAL DEFAULT 0,
    division                TEXT,
    office                  TEXT,
    remarks                 TEXT,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rsmi_records (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    ris_no                  TEXT,
    supply_item_id          INTEGER,
    item_name               TEXT NOT NULL,
    section                 TEXT DEFAULT 'General',
    unit                    TEXT,
    quantity_issued         REAL NOT NULL,
    unit_cost               REAL DEFAULT 0,
    amount                  REAL DEFAULT 0,
    division                TEXT,
    office                  TEXT,
    location                TEXT,
    requested_by            TEXT,
    resp_center_code        TEXT,
    po_no                   TEXT,
    stock_no                TEXT,
    date_issued             TEXT,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supply_item_id) REFERENCES supply_items(id)
  );

  CREATE TABLE IF NOT EXISTS supply_history (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    supply_item_id          INTEGER,
    item_name               TEXT NOT NULL,
    section                 TEXT DEFAULT 'General',
    action                  TEXT NOT NULL,
    quantity_changed        REAL,
    old_balance             REAL,
    new_balance             REAL,
    performed_by            TEXT,
    notes                   TEXT,
    fiscal_year             INTEGER DEFAULT 2025,
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    username                TEXT NOT NULL UNIQUE,
    password                TEXT NOT NULL,
    role                    TEXT DEFAULT 'admin',
    created_at              DATETIME DEFAULT CURRENT_TIMESTAMP
  );

`)

// Safely add columns that may not exist yet on older databases
const alterations = [
  'ALTER TABLE supply_items ADD COLUMN division TEXT',
  'ALTER TABLE supply_items ADD COLUMN office TEXT',
  'ALTER TABLE rsmi_records ADD COLUMN division TEXT',
  'ALTER TABLE rsmi_records ADD COLUMN office TEXT',
  'ALTER TABLE rsmi_records ADD COLUMN location TEXT',
]
alterations.forEach(sql => { try { db.exec(sql) } catch (e) {} })

console.log('✅ Database ready! All tables created.')
module.exports = db
