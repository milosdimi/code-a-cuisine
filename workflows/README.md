# n8n Workflows

This folder contains all n8n workflow exports for Code-à-Cuisine.

## Workflows

| File | Description |
|------|-------------|
| mock-workflow.json | Local test workflow with mock recipe data (no API costs) |
| production-workflow.json | Real workflow with Claude AI + Firebase (coming soon) |

## How to import
1. Open n8n
2. Click "..." → "Import from JSON"
3. Paste the content of the desired JSON file
4. Activate the workflow (toggle green)

## Mock Workflow
- Webhook URL: http://localhost:5678/webhook/code-a-cuisine
- Returns 3 hardcoded test recipes
- No Claude API costs
- Use for frontend development and testing

## Production Workflow (coming soon)
- Validates input
- Checks IP quota (Firebase Realtime DB)
- Calls Claude API for real recipe generation
- Saves recipes to Firestore
- Updates quota counter
