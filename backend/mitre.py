import json
import re
import os
from pathlib import Path
from typing import List, Dict
from database import db

MITRE_RULES_PATH = "mitre_rules.json"

class MITREMapper:
    def __init__(self):
        self.rules = self.load_rules()
    
    def load_rules(self) -> List[Dict]:
        """Load MITRE ATT&CK rules"""
        if not os.path.exists(MITRE_RULES_PATH):
            print(f"MITRE rules file not found: {MITRE_RULES_PATH}")
            return []
        
        try:
            with open(MITRE_RULES_PATH, 'r') as f:
                data = json.load(f)
                return data.get('rules', [])
        except Exception as e:
            print(f"Error loading MITRE rules: {e}")
            return []
    
    def match_artifact_to_ttp(self, artifact: Dict) -> List[Dict]:
        """Match single artifact to TTPs"""
        matches = []
        artifact_value = artifact['value'].lower()
        artifact_type = artifact['type']
        
        for rule in self.rules:
            if rule['artifact_type'] != artifact_type:
                continue
            
            pattern = rule['pattern']
            # Parse regex pattern
            if pattern.startswith('regex:'):
                regex_pattern = pattern[6:]  # Remove 'regex:' prefix
                try:
                    if re.search(regex_pattern, artifact_value):
                        matches.append({
                            'technique_id': rule['ttp_id'],
                            'technique_name': rule['ttp_name'],
                            'tactic': rule['tactic'],
                            'confidence': rule['confidence'],
                            'description': rule['description'],
                            'source_artifact': artifact_value[:50] + '...' if len(artifact_value) > 50 else artifact_value
                        })
                except re.error:
                    continue
            elif pattern.startswith('contains:'):
                contains_str = pattern[9:]  # Remove 'contains:' prefix
                if contains_str.lower() in artifact_value:
                    matches.append({
                        'technique_id': rule['ttp_id'],
                        'technique_name': rule['ttp_name'],
                        'tactic': rule['tactic'],
                        'confidence': rule['confidence'],
                        'description': rule['description'],
                        'source_artifact': artifact_value[:50] + '...' if len(artifact_value) > 50 else artifact_value
                    })
        
        return matches
    
    def map_case_artifacts(self, case_id: int):
        """Map all artifacts in case to MITRE ATT&CK TTPs"""
        artifacts = db.get_artifacts(case_id)
        seen_ttps = set()
        
        for artifact in artifacts:
            ttps = self.match_artifact_to_ttp(artifact)
            
            for ttp in ttps:
                ttp_key = f"{ttp['technique_id']}_{ttp['confidence']}"
                if ttp_key not in seen_ttps:
                    # Add to database if not already added
                    db.add_ttp(
                        case_id,
                        ttp['technique_id'],
                        ttp['technique_name'],
                        ttp['tactic'],
                        ttp['confidence']
                    )
                    seen_ttps.add(ttp_key)
        
        print(f"Mapped {len(seen_ttps)} unique TTPs for case {case_id}")

def map_all_cases():
    """Map TTPs for all cases"""
    cases = db.get_cases()
    mapper = MITREMapper()
    
    for case in cases:
        print(f"Mapping case {case['id']}: {case['name']}")
        mapper.map_case_artifacts(case['id'])

if __name__ == "__main__":
    mapper = MITREMapper()
    mapper.map_case_artifacts(1)  # Example case ID

