---
title: "102 - Excel Maintenance Logs Dashboard"
category: "Maintenance"
department: "Plant Operations"
complexity: "Medium"
impact: "Medium"
---

# 102 - Excel Maintenance Logs Dashboard

## Context & Pain Point
The maintenance team tracks machine call logs across day and night shifts in a daily Excel sheet stored on OneDrive. A single month has 31 sheets (one for each day), making it highly tedious to manually identify trends, calculate frequency of machine breakdowns, or track resolution times over a prolonged period.

## The Solution
Build an automated data extraction and visualization pipeline that reads the daily sheets, aggregates the maintenance logs across shifts and days, and visualizes the trend of machine calls and resolution times on a dashboard.

## Agent & Tech Architecture
- **Data Processing (Codex CLI / Python):** A Python script uses `pandas` to open the 31-tab Excel workbook, normalize the day/night shift data, and output a clean, consolidated dataset.
- **Workflow (n8n):** A scheduled n8n job that pulls the latest Excel file from OneDrive and runs the transformation.
- **Frontend Visualization (Claude Code):** A dashboard (Next.js/Vite or PowerBI) that consumes the cleaned data to display historical trends.

## Implementation Steps
1. Obtain the current month's Excel file as a template.
2. Build the `Codex CLI` Python script to loop through sheets `01` to `31` and standardize columns.
3. Hook up the transformed output to a dashboard UI.
