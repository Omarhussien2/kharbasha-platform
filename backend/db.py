import sqlite3
import os
import json

DB_DIR = os.getenv("DB_DIR", "data/db")
DB_PATH = os.path.join(DB_DIR, "kharbasha.db")

def _get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    conn = _get_db()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                url TEXT,
                type TEXT,
                status TEXT,
                dialect TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT,
                url TEXT,
                content TEXT,
                metadata_json TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_sessions (
                id TEXT PRIMARY KEY,
                task TEXT,
                history_json TEXT,
                final_result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
    finally:
        conn.close()

def create_job(job_id, url, job_type, dialect):
    conn = _get_db()
    try:
        conn.execute(
            "INSERT INTO jobs (id, url, type, status, dialect) VALUES (?, ?, ?, ?, ?)",
            (job_id, url, job_type, "pending", dialect)
        )
        conn.commit()
    finally:
        conn.close()

def update_job_status(job_id, status):
    conn = _get_db()
    try:
        conn.execute("UPDATE jobs SET status = ? WHERE id = ?", (status, job_id))
        conn.commit()
    finally:
        conn.close()

def save_result(job_id, url, content, metadata=None):
    conn = _get_db()
    try:
        conn.execute(
            "INSERT INTO results (job_id, url, content, metadata_json) VALUES (?, ?, ?, ?)",
            (job_id, url, content, json.dumps(metadata) if metadata else None)
        )
        conn.commit()
    finally:
        conn.close()

def save_agent_session(session_id, task, history, final_result=None):
    conn = _get_db()
    try:
        conn.execute(
            "INSERT OR REPLACE INTO agent_sessions (id, task, history_json, final_result) VALUES (?, ?, ?, ?)",
            (session_id, task, json.dumps(history), final_result)
        )
        conn.commit()
    finally:
        conn.close()

def get_history(limit=20):
    conn = _get_db()
    try:
        rows = conn.execute("""
            SELECT j.*, r.url as result_url, r.content as result_content 
            FROM jobs j 
            LEFT JOIN results r ON j.id = r.job_id 
            ORDER BY j.created_at DESC 
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def delete_job(job_id):
    conn = _get_db()
    try:
        conn.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        conn.execute("DELETE FROM results WHERE job_id = ?", (job_id,))
        conn.commit()
        return {"success": True, "id": job_id}
    finally:
        conn.close()
