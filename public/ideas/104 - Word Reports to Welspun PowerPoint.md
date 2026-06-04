---
title: "104 - Word Reports to Welspun PowerPoint"
category: "Reporting"
department: "Cross-Functional"
complexity: "High"
impact: "Medium"
---

# 104 - Word Reports to Welspun PowerPoint

## Context & Pain Point
Teams frequently produce long-form Word documents or generic reports that must be manually converted into slide decks using the strict Welspun PowerPoint format for meetings and stakeholder presentations. Summarizing and re-formatting is tedious.

## The Solution
An AI utility that takes a text-heavy report (Word/PDF), intelligently summarizes it into bite-sized presentation bullet points, and generates a formatted Welspun PowerPoint deck automatically.

## Agent & Tech Architecture
- **Document Parsing & Generation (Codex CLI / Python):** Python script utilizing `python-docx` to extract text.
- **Summarization (LLM):** Pass chunks of the report to an LLM (e.g., GPT-4o) with instructions to generate slide titles and 3-4 bullet points per section.
- **PPT Output (python-pptx):** Inject the LLM output directly into the Welspun corporate template.

## Implementation Steps
1. Provide a sample Word report and the target PPT template.
2. Develop the LLM prompt chain that chunks the document into logical slides.
3. Use `python-pptx` to render the final presentation file.
