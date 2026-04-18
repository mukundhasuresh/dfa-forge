import requests
import os
from dotenv import load_dotenv
from typing import Dict, Optional, List
from database import db

load_dotenv()

VT_API_KEY = os.getenv('VIRUSTOTAL_API_KEY')
ABUSEIPDB_API_KEY = os.getenv('ABUSEIPDB_API_KEY')

VT_BASE_URL = "https://www.virustotal.com/vtapi/v2"
ABUSEIPDB_BASE_URL = "https://api.abuseipdb.com/api/v2"

def get_severity_score(detections: int, abuse_score: int = 0) -> str:
    """Calculate severity based on detection ratios"""
    if detections > 20 or abuse_score > 80:
        return "critical"
    elif detections >= 5 or abuse_score >= 50:
        return "high"
    elif detections >= 1 or abuse_score >= 20:
        return "medium"
    else:
        return "low"

def defang_value(value: str, artifact_type: str) -> str:
    """Defang IOC values"""
    if artifact_type == "ip":
        return value.replace(".", "[.]")
    elif artifact_type == "url":
        value = value.replace("http://", "hxxp://").replace("https://", "hxxps://")
        return value.replace(".", "[.]")
    elif artifact_type in ["email", "hash", "file"]:
        return value
    return value

class Enricher:
    @staticmethod
    def enrich_ip(ip: str, case_id: int):
        """Enrich IP address with AbuseIPDB"""
        if not ABUSEIPDB_API_KEY:
            print("No AbuseIPDB API key")
            return
            
        try:
            headers = {
                'Key': ABUSEIPDB_API_KEY,
                'Accept': 'application/json'
            }
            params = {'ipAddress': ip, 'maxAgeInDays': 90}
            
            response = requests.get(ABUSEIPDB_BASE_URL + '/check', 
                                  headers=headers, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()['data']
                abuse_confidence = int(data['abuseConfidenceScore'])
                severity = get_severity_score(0, abuse_confidence)
                
                # Update or add enriched artifact
                defanged = defang_value(ip, "ip")
                db.add_artifact(case_id, "ip", ip, severity, "abuseipdb", defanged)
                
        except Exception as e:
            print(f"IP enrichment error for {ip}: {e}")

    @staticmethod
    def enrich_hash(hash_value: str, case_id: int):
        """Enrich file hash with VirusTotal"""
        if not VT_API_KEY:
            print("No VirusTotal API key")
            return
            
        try:
            params = {'apikey': VT_API_KEY, 'resource': hash_value}
            response = requests.get(f"{VT_BASE_URL}/file/report", params=params, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response_code') == 1:
                    scans = result.get('scans', {})
                    detections = sum(1 for engine in scans.values() if engine.get('detected'))
                    total = len(scans)
                    detection_ratio = detections / total if total > 0 else 0
                    
                    severity = get_severity_score(int(detection_ratio * 100))
                    defanged = defang_value(hash_value, "hash")
                    
                    db.add_artifact(case_id, "hash", hash_value, severity, "virustotal", defanged)
                    
        except Exception as e:
            print(f"Hash enrichment error for {hash_value}: {e}")

    @staticmethod
    def enrich_url(url: str, case_id: int):
        """Enrich URL with VirusTotal"""
        if not VT_API_KEY:
            print("No VirusTotal API key")
            return
            
        try:
            params = {'apikey': VT_API_KEY, 'resource': url}
            response = requests.post(f"{VT_BASE_URL}/url/report", data=params, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('response_code') == 1:
                    scans = result.get('scans', {})
                    detections = sum(1 for engine in scans.values() if engine.get('detected'))
                    total = len(scans)
                    detection_ratio = detections / total if total > 0 else 0
                    
                    severity = get_severity_score(int(detection_ratio * 100))
                    defanged = defang_value(url, "url")
                    
                    db.add_artifact(case_id, "url", url, severity, "virustotal", defanged)
                    
        except Exception as e:
            print(f"URL enrichment error for {url}: {e}")

    @classmethod
    def enrich_artifacts(cls, case_id: int):
        """Enrich all artifacts for a case"""
        artifacts = db.get_artifacts(case_id)
        
        for artifact in artifacts:
            artifact_type = artifact['type']
            value = artifact['value']
            
            if artifact_type == "ip":
                cls.enrich_ip(value, case_id)
            elif artifact_type == "hash":
                cls.enrich_hash(value, case_id)
            elif artifact_type == "url":
                cls.enrich_url(value, case_id)

if __name__ == "__main__":
    # Example usage
    Enricher.enrich_artifacts(1)

