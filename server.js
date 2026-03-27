import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';

const app = express();
const db = new Database('mission_control.db');

app.use(cors());

// THE FIX: Added 'res' to the function arguments below
app.get('/api/tasks/:projectName', (req, res) => {
  try {
    const { projectName } = req.params;
    const project = db.prepare('SELECT id FROM projects WHERE name = ?').get(projectName);
    
    if (!project) {
      return res.json([]);
    }
    
    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(project.id);
    res.json(tasks);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3001, () => console.log('Bridge active on http://localhost:3001'));