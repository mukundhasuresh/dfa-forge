import json
import os
from typing import Dict, Any
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from dotenv import load_dotenv
from backend.database import db

load_dotenv()

class AINarrativeGenerator:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        if not self.client.api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
    
    def generate_narrative(self, case_id: int) -> Dict[str, Any]:
        """Generate AI forensic narrative for case"""
        case = db.get_case(case_id)
        if not case:
            return {}
        
        artifacts = db.get_artifacts(case_id)
        ttps = db.get_ttps(case_id)
        timeline = db.get_timeline(case_id)
        
        # Format data for prompt
        artifacts_str = "\n".join([f"- {a['type']}: {a['value']} (severity: {a['severity']})" 
                                 for a in artifacts[:20]])  # Limit to 20
        
        ttps_str = "\n".join([f"- {t['technique_name']} ({t['tactic']}) confidence: {t['confidence']}" 
                            for t in ttps])
        
        timeline_str = "\n".join([f"- {t['timestamp']}: {t['event_type']} {t['path']}" 
                                for t in timeline[-10:]])  # Last 10 events
        
        user_prompt = f"""Given these artifacts: {artifacts_str}

And these MITRE TTPs: {ttps_str}

And this filesystem timeline: {timeline_str}

Write a forensic narrative. Respond ONLY in this JSON format, no markdown, no preamble:
{{
  'executive_summary': '2-3 sentence summary',
  'attack_narrative': 'detailed paragraph of full attack chain in order',
  'key_findings': ['finding1', 'finding2', 'finding3'],
  'attacker_objectives': 'what attacker wanted',
  'confidence_level': 'high or medium or low',
  'confidence_reason': 'why this confidence',
  'recommended_actions': ['action1', 'action2', 'action3'],
  'tags': ['tag1', 'tag2', 'tag3']
}}"""
        
        system_prompt = """You are a senior digital forensic analyst with 15 years of experience in SOC and incident response."""
        
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}]
            )
            
            # Extract JSON from response
            content = message.content[0].text.strip()
            # Try to parse JSON response
            start = content.find('{')
            end = content.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = content[start:end]
                narrative = json.loads(json_str)
            else:
                # Fallback if JSON extraction fails
                narrative = {
                    "executive_summary": "Analysis complete. Review artifacts and TTPs.",
                    "attack_narrative": "Automated analysis identified artifacts and TTP mappings. Manual review recommended.",
                    "key_findings": ["Artifacts extracted", "TTPs mapped", "Timeline generated"],
                    "attacker_objectives": "Unknown - requires human analysis",
                    "confidence_level": "medium",
                    "confidence_reason": "Automated analysis with AI assistance",
                    "recommended_actions": ["Review artifacts", "Validate TTP mappings", "Conduct threat hunting"],
                    "tags": ["automated", "preliminary"]
                }
            
            return narrative
            
        except Exception as e:
            print(f"AI narrative generation error: {e}")
            return {
                "executive_summary": f"Error generating narrative: {str(e)}",
                "attack_narrative": "Unable to generate narrative due to API error.",
                "key_findings": [],
                "confidence_level": "low",
                "tags": ["error"]
            }

# Global instance
ai_narrative = AINarrativeGenerator()

if __name__ == "__main__":
    # Test
    narrative = ai_narrative.generate_narrative(1)
    print(json.dumps(narrative, indent=2))

