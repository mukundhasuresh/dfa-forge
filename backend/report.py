import os
import json
from datetime import datetime
from typing import Dict, Any
from database import Database
from ai_narrative import generate_narrative

db = Database()

def generate_html_report(case_id: int, output_path: str = None) -> str:
    """Generate self-contained HTML forensic report"""
    case = db.get_case(case_id)
    if not case:
        return ""
    
    artifacts = db.get_artifacts(case_id)
    ttps = db.get_ttps(case_id)
    timeline = db.get_timeline(case_id)
    narrative = generate_narrative(case_id)
    
    # Case info
    case_info = {
        'id': case['id'],
        'name': case['name'],
        'image_path': os.path.basename(case['image_path']),
        'created_at': case['created_at'],
        'status': case['status']
    }
    
    # Severity stats
    severity_counts = {}
    for artifact in artifacts:
        sev = artifact['severity']
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DFA/forge Forensic Report - Case {case['id']}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&amp;family=Syne:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'IBM Plex Mono', monospace;
            background: #0a0c10;
            color: #e8ecf4;
            line-height: 1.6;
            padding: 40px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 60px;
            border-bottom: 1px solid #1e2330;
            padding-bottom: 40px;
        }}
        
        h1 {{
            font-family: 'Syne', sans-serif;
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #00d4aa 0%, #0099ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
        }}
        
        .case-badge {{
            display: inline-block;
            background: #111318;
            color: #00d4aa;
            padding: 12px 24px;
            border-radius: 8px;
            border: 1px solid #1e2330;
            font-weight: 500;
            font-size: 1.1rem;
        }}
        
        .section {{
            margin-bottom: 60px;
            background: #111318;
            border: 1px solid #1e2330;
            border-radius: 12px;
            padding: 40px;
        }}
        
        .section h2 {{
            font-family: 'Syne', sans-serif;
            font-size: 2rem;
            font-weight: 600;
            color: #00d4aa;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        
        .metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .metric-card {{
            background: #181c24;
            border: 1px solid #1e2330;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
        }}
        
        .metric-number {{
            font-size: 2.5rem;
            font-weight: 700;
            font-family: 'Syne', sans-serif;
            color: #00d4aa;
            margin-bottom: 8px;
        }}
        
        .severity-badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            margin: 4px;
        }}
        
        .critical {{ background: #ef4444; color: white; }}
        .high {{ background: #f59e0b; color: white; }}
        .medium {{ background: #0099ff; color: white; }}
        .low {{ background: #5a6480; color: #e8ecf4; }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            background: #181c24;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }}
        
        th {{
            background: #1e2330;
            padding: 16px 20px;
            text-align: left;
            font-weight: 600;
            color: #e8ecf4;
            border-bottom: 1px solid #2a3441;
        }}
        
        td {{
            padding: 16px 20px;
            border-bottom: 1px solid #1e2330;
        }}
        
        tr:hover {{
            background: #181c24;
        }}
        
        .ttp-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }}
        
        .ttp-card {{
            background: #181c24;
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            border-radius: 0 8px 8px 0;
        }}
        
        .narrative {{
            background: linear-gradient(135deg, #0a1a0a 0%, #0f1f0f 100%);
            border: 1px solid #00d4aa;
            padding: 32px;
            border-radius: 12px;
            position: relative;
        }}
        
        .ai-badge {{
            position: absolute;
            top: 20px;
            right: 20px;
            background: #00d4aa;
            color: #0a0c10;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }}
        
        @media print {{
            body {{ 
                background: white !important;
                color: black !important;
                padding: 20px;
            }}
            .section {{ 
                break-inside: avoid;
                background: white !important;
                border: 1px solid #ccc !important;
            }}
        }}
        
        @page {{ margin: 1in; }}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>DFA/forge</h1>
            <div class="case-badge">
                Case #{case_info['id']} • {case_info['name']} • {case_info['status']}
            </div>
        </header>
        
        <div class="section">
            <h2>📊 Executive Summary</h2>
            <div class="narrative">
                <div class="ai-badge">🤖 AI Generated</div>
                <div>{narrative.get('executive_summary', 'N/A')}</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📈 Metrics</h2>
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-number">{len(artifacts)}</div>
                    <div>Total Artifacts</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">{severity_counts.get('critical', 0)}</div>
                    <div>Critical</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">{len(ttps)}</div>
                    <div>ATT&amp;CK TTPs</div>
                </div>
                <div class="metric-card">
                    <div class="metric-number">{len(timeline)}</div>
                    <div>Timeline Events</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Key Findings</h2>
            <ul style="list-style: none;">
    """
    
    # Add key findings
    for finding in narrative.get('key_findings', []):
        html_content += f"""
                <li style="padding: 12px 0; border-bottom: 1px solid #1e2330;">
                    • {finding}
                </li>
        """
    
    html_content += """
            </ul>
        </div>
        
        <div class="section">
            <h2>📋 Artifacts</h2>
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Severity</th>
                        <th>Source</th>
                    </tr>
                </thead>
                <tbody>
    """
    
    # Add artifacts table
    for artifact in artifacts:
        severity_class = artifact['severity']
        html_content += f"""
                    <tr>
                        <td><span class="severity-badge {severity_class}">{artifact['type'].upper()}</span></td>
                        <td><code>{artifact['defanged_value']}</code></td>
                        <td><span class="severity-badge {severity_class}">{artifact['severity'].upper()}</span></td>
                        <td>{artifact['source']}</td>
                    </tr>
        """
    
    html_content += """
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>🛡️ MITRE ATT&amp;CK TTPs</h2>
    """
    
    if ttps:
        html_content += '<div class="ttp-grid">'
        for ttp in ttps:
            html_content += f"""
                <div class="ttp-card">
                    <h3 style="color: #8b5cf6; margin-bottom: 8px;">{ttp['technique_name']}</h3>
                    <div style="color: #5a6480; font-size: 0.9rem;">{ttp['tactic']}</div>
                    <div style="color: #00d4aa; font-weight: 500; margin: 12px 0;">Confidence: {ttp['confidence'].upper()}</div>
                </div>
            """
        html_content += '</div>'
    else:
        html_content += '<p style="color: #5a6480;">No TTP mappings found.</p>'
    
    html_content += """
        </div>
        
        <div class="section">
            <h2>📖 Attack Narrative</h2>
            <div class="narrative">
                <div>{narrative.get('attack_narrative', 'N/A')}</div>
            </div>
        </div>
        
        <div class="section">
            <h2>⚠️ Recommendations</h2>
            <ul>
    """
    
    for action in narrative.get('recommended_actions', []):
        html_content += f"<li style='margin-bottom: 12px;'>• {action}</li>"
    
    html_content += f"""
            </ul>
            <div style="margin-top: 24px; padding: 20px; background: #181c24; border-radius: 8px;">
                <strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}<br>
                <strong>Confidence:</strong> {narrative.get('confidence_level', 'N/A')} - {narrative.get('confidence_reason', '')}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 60px; padding-top: 40px; border-top: 1px solid #1e2330; color: #5a6480; font-size: 0.9rem;">
            Generated by DFA/forge • Digital Forensics Automation Tool
        </div>
    </div>
</body>
</html>
    """
    
    if output_path:
        os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        return output_path
    else:
        return html_content

if __name__ == "__main__":
    # Generate sample report
    report_path = f"reports/case_1_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
    os.makedirs("reports", exist_ok=True)
    path = generate_html_report(1, report_path)
    print(f"Report generated: {path}")

