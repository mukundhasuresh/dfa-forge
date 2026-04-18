import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

DB_PATH = "dfa_forge.db"

@dataclass
class Case:
    id: int
    name: str
    image_path: str
    created_at: str
    status: str

@dataclass
class Artifact:
    id: int
    case_id: int
    type: str
    value: str
    severity: str
    source: str
    defanged_value: str

@dataclass
class TTP:
    id: int
    case_id: int
    technique_id: str
    technique_name: str
    tactic: str
    confidence: str

@dataclass
class TimelineEvent:
    id: int
    case_id: int
    timestamp: str
    event_type: str
    description: str
    path: str

class Database:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize database tables"""
        with self.get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    image_path TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    status TEXT DEFAULT 'pending'
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS artifacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id INTEGER,
                    type TEXT,
                    value TEXT,
                    severity TEXT,
                    source TEXT,
                    defanged_value TEXT,
                    FOREIGN KEY(case_id) REFERENCES cases(id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ttps (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id INTEGER,
                    technique_id TEXT,
                    technique_name TEXT,
                    tactic TEXT,
                    confidence TEXT,
                    FOREIGN KEY(case_id) REFERENCES cases(id)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS timeline (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id INTEGER,
                    timestamp TEXT,
                    event_type TEXT,
                    description TEXT,
                    path TEXT,
                    FOREIGN KEY(case_id) REFERENCES cases(id)
                )
            """)
            
            conn.commit()

    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def create_case(self, name: str, image_path: str) -> int:
        """Create new case"""
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO cases (name, image_path, created_at, status) VALUES (?, ?, ?, ?)",
                (name, image_path, datetime.now().isoformat(), "pending")
            )
            case_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
            conn.commit()
            return case_id

    def update_case_status(self, case_id: int, status: str):
        """Update case status"""
        with self.get_connection() as conn:
            conn.execute(
                "UPDATE cases SET status = ? WHERE id = ?",
                (status, case_id)
            )

    def update_case_progress(self, case_id: int, progress: int):
        """Update case scan progress"""
        with self.get_connection() as conn:
            conn.execute(
                "UPDATE cases SET status = ? WHERE id = ?",
                (f"scanning:{progress}", case_id)
            )

    def get_case(self, case_id: int) -> Optional[Dict[str, Any]]:
        """Get case by ID"""
        with self.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM cases WHERE id = ?",
                (case_id,)
            ).fetchone()
            return dict(row) if row else None

    def get_cases(self) -> List[Dict[str, Any]]:
        """Get all cases"""
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM cases ORDER BY created_at DESC").fetchall()
            return [dict(row) for row in rows]

    def add_artifact(self, case_id: int, artifact_type: str, value: str, 
                    severity: str, source: str, defanged_value: str):
        """Add artifact"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO artifacts (case_id, type, value, severity, source, defanged_value)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (case_id, artifact_type, value, severity, source, defanged_value))

    def get_artifacts(self, case_id: int) -> List[Dict[str, Any]]:
        """Get artifacts for case"""
        with self.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM artifacts WHERE case_id = ? ORDER BY id",
                (case_id,)
            ).fetchall()
            return [dict(row) for row in rows]

    def add_ttp(self, case_id: int, technique_id: str, technique_name: str, 
                tactic: str, confidence: str):
        """Add TTP mapping"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO ttps (case_id, technique_id, technique_name, tactic, confidence)
                VALUES (?, ?, ?, ?, ?)
            """, (case_id, technique_id, technique_name, tactic, confidence))

    def get_ttps(self, case_id: int) -> List[Dict[str, Any]]:
        """Get TTPs for case"""
        with self.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM ttps WHERE case_id = ?",
                (case_id,)
            ).fetchall()
            return [dict(row) for row in rows]

    def add_timeline_event(self, case_id: int, timestamp: str, event_type: str, 
                          description: str, path: str):
        """Add timeline event"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO timeline (case_id, timestamp, event_type, description, path)
                VALUES (?, ?, ?, ?, ?)
            """, (case_id, timestamp, event_type, description, path))

    def get_timeline(self, case_id: int) -> List[Dict[str, Any]]:
        """Get timeline for case"""
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT * FROM timeline WHERE case_id = ?
                ORDER BY timestamp
            """, (case_id,)).fetchall()
            return [dict(row) for row in rows]

# Global database instance
db = Database()

