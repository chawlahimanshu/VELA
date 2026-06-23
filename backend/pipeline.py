from dotenv import load_dotenv
import os
from google.cloud import bigquery

load_dotenv()

client = bigquery.Client(project="vela-project-500205")

query = """
    SELECT * FROM `vela-project-500205.Vela_MetLife_SampleData.Vela_MetLife_TrainingData`
    LIMIT 5
"""

rows = client.query_and_wait(query)

print("BigQuery data:")
for row in rows:
    print(row)