import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'reports.db')
const db = new Database(dbPath)

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective TEXT NOT NULL,
    variables TEXT NOT NULL,
    constraints TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

export const saveReport = (objective: string, variables: string[], constraints: string[]) => {
  const stmt = db.prepare(`
    INSERT INTO reports (objective, variables, constraints)
    VALUES (?, ?, ?)
  `)
  
  return stmt.run(
    objective,
    JSON.stringify(variables),
    JSON.stringify(constraints)
  )
}

export const getReports = () => {
  const stmt = db.prepare('SELECT * FROM reports ORDER BY created_at DESC')
  return stmt.all()
}

export default db 