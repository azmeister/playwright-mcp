import json
import os
from datetime import datetime
from google.cloud import bigquery

# Get BigQuery credentials from environment variable
key_json = os.environ.get('BQ_KEY_JSON')
if not key_json:
    raise SystemExit('BQ_KEY_JSON env var is required')

credentials = bigquery.Client.from_service_account_info(json.loads(key_json))
client = credentials

def load_results(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

results = load_results(os.path.join(os.path.dirname(__file__), 'results.json'))

rows = []
for entry in results:
    for issue in entry.get('issues', []):
        rows.append({
            'timestamp': datetime.utcnow().isoformat(),
            'url': entry['url'],
            'issue': issue,
        })

if rows:
    table_id = os.environ.get('BQ_TABLE', 'fund_monitor.issues')
    errors = client.insert_rows_json(table_id, rows)
    if errors:
        raise RuntimeError(f'Failed to insert rows: {errors}')
    print(f'Inserted {len(rows)} rows into {table_id}')
else:
    print('No issues found; nothing to insert')
