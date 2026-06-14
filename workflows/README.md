# ⚙️ n8n Workflows

This folder contains all n8n workflow exports for Code-à-Cuisine.

---

## 📦 Workflows

| File | Status | Description |
|---|---|---|
| `code-a-cuisine-workflow-(P1_+_Quota).json` | ✅ Production | Full workflow with Claude AI, quota system and error handling |

---

## 📥 How to Import

1. Start n8n (`http://localhost:5678`)
2. Go to **Workflows → ⋯ → Import from JSON**
3. Paste or upload the JSON file
4. Add your **Anthropic API key** under **Credentials → Anthropic**
5. Toggle the workflow to **Active** (green)

---

## 🔀 Workflow: P1 + Quota

### Node Overview

```
Webhook (POST /code-a-cuisine)
    ↓
Validate & Sanitize Input     ← validates ingredients, builds prompts, hashes IP
    ↓
Check IP Quota                ← reads Firebase RTDB: quota/{date}/{ipHash}
    ↓
Evaluate Quota                ← IP_LIMIT = 3 / day, SYSTEM_LIMIT = 12 / day
    ↓
Quota Gate (IF)
    ├── ✅ allowed  → Generate 3 Recipes (Claude Sonnet 4.6)
    │                     ↓ (on success)
    │               Parse Claude Response
    │                     ↓ (on success)
    │               Update IP Quota
    │                     ↓
    │               Return Recipes to Angular  ← { success: true, recipes: [...] }
    │
    │               Generate / Parse (on error) ──→ Handle Generation Error
    │                                                ← { success: false, error: '...' }
    └── ❌ blocked → Quota Exceeded Response    ← HTTP 429, error: 'quota_exceeded'
```

### Error Codes returned to Angular

| `error` field | Cause | Angular popup |
|---|---|---|
| `quota_exceeded` | IP or system daily limit reached | "Daily limit reached" |
| `content_refused` | Claude rejected the ingredient (ethical/legal) | "Ingredient not supported" |
| `generation_failed` | Claude API error or invalid JSON response | "Generation failed" |

### Quota System

- IP is **never stored in plaintext** — djb2 hash only
- Date key format: `YYYY-MM-DD` (UTC) → auto-resets at midnight
- Stored in Firebase Realtime Database at `/quota/{dateKey}/{ipHash}`
- System counter at `/quota/{dateKey}/_system`

### Claude Prompt

- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 8000
- **Timeout:** 120s
- Claude always returns valid JSON (enforced in system prompt)
- For refused requests: `{ "error": "content_refused", "reason": "..." }`

---

## 🔧 Requirements

- n8n v2.20+ (Self-Hosted)
- Anthropic API credential configured in n8n
- Firebase Realtime Database with open read/write rules for `/quota/**`
