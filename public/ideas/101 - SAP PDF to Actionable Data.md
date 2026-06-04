---
title: "101 - SAP PDF to Actionable Data"
category: "Data & Automation"
department: "Cross-Functional"
complexity: "Medium"
impact: "High"
---

# 101 - SAP PDF to Actionable Data

## Context & Pain Point
SAP auto-generates various PDF reports and sends them via email. These unstructured or semi-structured PDF files create a manual bottleneck, as teams must read, interpret, and re-key the data into other systems (Excel, dashboards) to make it actionable.

## The Solution
Create an intelligent pipeline that intercepts these SAP PDF emails, processes the layouts to extract tabular and unstructured data, and pushes it into a queryable format (like a OneDrive List or SQL Database). 

## Agent & Tech Architecture
- **Workflow Trigger (n8n):** Monitors a dedicated inbox for SAP-generated PDF reports.
- **Extraction Engine (Codex CLI / Python):** A Python script uses a Document AI or Vision LLM (e.g., Azure Document Intelligence, OpenAI) to parse the PDF, handle anomalies, and convert it to clean JSON.
- **Data Destination:** Pushed via n8n to a PowerBI dashboard dataset or OneDrive list.

## Implementation Steps
1. Gather a sample set of the most critical SAP PDF layouts.
2. Develop the extraction script (`Codex CLI`).
3. Setup the `n8n` workflow to stitch the email intake and data export together.
