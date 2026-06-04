---
title: "103 - Financial Data to Board Presentations"
category: "Finance"
department: "Executive Management"
complexity: "High"
impact: "High"
---

# 103 - Financial Data to Board Presentations

## Context & Pain Point
Translating monthly financial data (from Excel or SAP exports) into highly formatted Board Presentation slides is a repetitive, error-prone, and manual process that consumes hours of the finance team's time each month.

## The Solution
An automated generator that ingests the standard monthly financial dataset and maps the key metrics directly into the official Welspun PowerPoint Board Presentation template, optionally generating narrative summaries using an LLM.

## Agent & Tech Architecture
- **Data Processing & Slide Generation (Codex CLI / Python):** A Python script using `pandas` to calculate variances and `python-pptx` to populate placeholder shapes/charts inside a base `.pptx` template.
- **LLM Integration:** Use an LLM to read the financial variances and draft bullet points explaining the month-over-month performance.

## Implementation Steps
1. Identify the input data format (Excel/CSV).
2. Obtain the official Board Presentation `.pptx` template and insert identifiable tags for `python-pptx`.
3. Write the Python logic to map the data to the slides.
