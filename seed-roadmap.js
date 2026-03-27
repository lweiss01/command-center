import Database from 'better-sqlite3';
const db = new Database('mission_control.db');

// Create the tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    status TEXT,
    version TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    title TEXT,
    category TEXT,
    status TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );
`);

// 1. Seed NewsThread (Based on your v0.7.0 Beta status)
const newsThread = db.prepare('INSERT OR IGNORE INTO projects (name, status, version) VALUES (?, ?, ?)').run('newsthread', 'Stress Testing', '0.7.0');
const ntId = newsThread.lastInsertRowid || 1; 

const ntTasks = [
  ['UI Polish (Phase 10.1)', 'Frontend', 'Todo'],
  ['Architecture Refactor (Phase 11)', 'Backend', 'Todo'],
  ['Fix empty finally block (Jules Bot)', 'Bug', 'In-Progress'],
  ['Fix duplicate functions', 'Bug', 'Todo'],
  ['Troubleshoot GitHub Pages Deployment', 'DevOps', 'In-Progress']
];

// 2. Seed PayDirt (Based on your domain renewal and Core Vision)
const payDirt = db.prepare('INSERT OR IGNORE INTO projects (name, status, version) VALUES (?, ?, ?)').run('paydirt', 'Domain Secured', '0.1.0');
const pdId = payDirt.lastInsertRowid || 2;

const pdTasks = [
  ['Integrate Aave v3 on Base', 'Web3', 'Todo'],
  ['Configure Chainlink VRF for Motherlode Draw', 'Smart Contract', 'Todo'],
  ['React Native Frontend Scaffolding', 'Frontend', 'Todo'],
  ['Connect paydirt.cash domain', 'DevOps', 'Done']
];

// Insert the tasks
const insertTask = db.prepare('INSERT INTO tasks (project_id, title, category, status) VALUES (?, ?, ?, ?)');
[...ntTasks.map(t => [ntId, ...t]), ...pdTasks.map(t => [pdId, ...t])].forEach(t => insertTask.run(t));

console.log("Database initialized and seeded with NewsThread and PayDirt roadmaps!");