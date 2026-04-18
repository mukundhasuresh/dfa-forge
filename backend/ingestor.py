import subprocess
import os
import re
import json
from pathlib import Path
from typing import List, Dict
from backend.database import db, Case

def run_sleuthkit_command(image_path: str, case_id: int, command: List[str]):
    """Run sleuthkit command and parse output"""
    try:
        # Create output directory
        output_dir = f"cases/case_{case_id}"
        os.makedirs(output_dir, exist_ok=True)
        
        full_cmd = ["tsk_recover"] + command + [image_path, output_dir]
        result = subprocess.run(
            full_cmd, 
            capture_output=True, 
            text=True, 
            timeout=3600
        )
        
        if result.returncode != 0:
            print(f"Sleuthkit error: {result.stderr}")
            return False
            
        return True
    except subprocess.TimeoutExpired:
        print("Sleuthkit command timed out")
        return False
    except Exception as e:
        print(f"Sleuthkit error: {e}")
        return False

def parse_fls_output(output: str) -> List[Dict]:
    """Parse fls output for filesystem listing"""
    artifacts = []
    lines = output.strip().split('\n')
    
    for line in lines:
        if line.strip():
            parts = re.split(r'\s+', line.strip(), maxsplit=3)
            if len(parts) >= 4:
                inode, type_char, addr, path = parts[0], parts[1], parts[2], parts[3]
                
                # Create timeline event
                event = {
                    'timestamp': '0000-00-00 00:00:00',  # mactime would populate this
                    'event_type': type_char,
                    'description': f"Inode {inode}",
                    'path': path
                }
                db.add_timeline_event(case_id=None, **event)  # case_id set later
                
                # Artifact detection
                if type_char in ['f', 'r']:  # file or regular file
                    artifacts.append({
                        'type': 'file',
                        'value': path,
                        'severity': 'low',
                        'source': 'fls',
                        'defanged_value': path
                    })
    
    return artifacts

def run_bulk_extractor(image_path: str, case_id: int):
    """Run bulk_extractor on disk image"""
    try:
        output_dir = f"cases/case_{case_id}/bulk"
        os.makedirs(output_dir, exist_ok=True)
        
        cmd = ["bulk_extractor", image_path, "-o", output_dir]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=7200
        )
        
        if result.returncode == 0:
            # Parse bulk_extractor features files
            parse_bulk_features(output_dir, case_id)
            return True
        else:
            print(f"Bulk extractor error: {result.stderr}")
            return False
    except Exception as e:
        print(f"Bulk extractor error: {e}")
        return False

def parse_bulk_features(output_dir: str, case_id: int):
    """Parse bulk_extractor feature files"""
    feature_files = Path(output_dir).glob("*.txt")
    
    for feature_file in feature_files:
        feature_name = feature_file.stem
        with open(feature_file) as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if line:
                    if feature_name == "email":
                        db.add_artifact(case_id, "email", line, "medium", "bulk_extractor", line)
                    elif feature_name == "url":
                        db.add_artifact(case_id, "url", line, "medium", "bulk_extractor", defang_url(line))
                    elif feature_name == "ip-address":
                        db.add_artifact(case_id, "ip", line, "low", "bulk_extractor", defang_ip(line))
                    elif feature_name == "md5":
                        db.add_artifact(case_id, "hash", line, "medium", "bulk_extractor", line)

def defang_ip(ip: str) -> str:
    """Defang IP address"""
    return re.sub(r'\.', '[.]', ip)

def defang_url(url: str) -> str:
    """Defang URL"""
    url = re.sub(r'http(s)?://', 'hxxp\\1://', url)
    url = re.sub(r'\.', '[.]', url)
    return url

class Ingestor:
    def __init__(self, case_id: int):
        self.case_id = case_id
        self.case = db.get_case(case_id)
    
    def scan(self) -> bool:
        """Main scan function"""
        if not self.case:
            return False
            
        image_path = self.case['image_path']
        
        # Update progress
        db.update_case_progress(self.case_id, 0)
        
        # Phase 1: FLS (filesystem listing)
        print("Phase 1: Running fls...")
        db.update_case_progress(self.case_id, 25)
        fls_output = subprocess.run(
            ["fls", image_path], 
            capture_output=True, 
            text=True
        )
        artifacts = parse_fls_output(fls_output.stdout)
        db.update_case_progress(self.case_id, 50)
        
        # Phase 2: Bulk extractor
        print("Phase 2: Running bulk_extractor...")
        success = run_bulk_extractor(image_path, self.case_id)
        db.update_case_progress(self.case_id, 75)
        
        # Phase 3: MAC time
        print("Phase 3: Generating timeline...")
        mactime_output = subprocess.run(
            ["mactime", "-b", "bodyfile", image_path, "-o", "timeline.body"], 
            capture_output=True
        )
        db.update_case_progress(self.case_id, 90)
        
        # Finalize
        db.update_case_status(self.case_id, "completed")
        db.update_case_progress(self.case_id, 100)
        
        return success

if __name__ == "__main__":
    case_id = 1  # Example
    ingestor = Ingestor(case_id)
    ingestor.scan()

