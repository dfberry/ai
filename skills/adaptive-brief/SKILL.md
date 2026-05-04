---
name: "adaptive-brief"
description: "Adaptive daily brief. Monday: full weekly plan + dashboards. Tue–Thu: meetings, actions, carry-forward + snapshot. Friday: recap. First Monday of month: adds trends."
metadata:
  domain: "reporting"
  confidence: "high"
---

## USE FOR

- "daily brief" / "morning brief" / "what's today look like"
- "monday brief" / "weekly brief"
- "monthly brief" / "monthly review"
- "friday recap"

## DO NOT USE FOR

- Scheduled automated reporting
- Ad-hoc PBI-only queries

## Prerequisites

- `gh` CLI authenticated
- `az` CLI authenticated (`{ADO_ORG_URL}`, Project: `{ADO_PROJECT}`)
- (Optional) PBI MCP server connected — see README.md for setup

## Day Detection

| Condition | Day Type |
|-----------|----------|
| Monday AND first Monday of month | **Monthly** (superset of Monday) |
| Monday (not first of month) | **Monday** |
| Tuesday–Thursday | **Midweek** |
| Friday | **Friday** |

---

## Data Sources by Day Type

### ALL Days — Common Sources (run in parallel)

**WorkIQ** — via `workiq-ask_work_iq`:
- Flagged/important emails (last 3 days)
- Teams messages (since last business day)
- Today's calendar / key meetings
- {MANAGER_NAME}'s priorities and asks

**GitHub PRs** — via `gh` CLI (run for each tracked repo):
```bash
# For each repo in your tracked list:
gh pr list --author {GITHUB_AUTHOR} --state open --repo <owner/repo>
gh pr list --search "review-requested:{GITHUB_AUTHOR}" --state open --repo <owner/repo>
gh issue list --assignee {GITHUB_AUTHOR} --state open --repo <owner/repo>
```

Tracked repos:
- {GITHUB_REPOS} <!-- replace with one `- owner/repo` per line -->

**Power BI** (if configured) — via PBI MCP tools:
- **Midweek/Friday:** Summary metrics from {PBI_REPORT_1_NAME} only
- **Monday:** Full report across all PBI reports
- **Monthly:** Full report + month-over-month trend analysis

### Monday-Only Sources (add to common)

**Azure DevOps:**
```bash
az boards query --wiql "SELECT [System.Id],[System.Title],[System.WorkItemType],[System.State] FROM workitems WHERE [System.AssignedTo] = @me AND [System.State] <> 'Closed' ORDER BY [Microsoft.VSTS.Common.Priority]" --org {ADO_ORG_URL} --project {ADO_PROJECT} --output json
```

---

## Power BI Integration

> Remove this entire section if you don't use Power BI.

### Reports

| Report | Semantic Model ID | Author Filter Column |
|--------|-------------------|---------------------|
| {PBI_REPORT_1_NAME} | `{PBI_REPORT_1_ID}` | `{PBI_REPORT_1_AUTHOR_COL}` |
| {PBI_REPORT_2_NAME} | `{PBI_REPORT_2_ID}` | `{PBI_REPORT_2_AUTHOR_COL}` |
| {PBI_REPORT_3_NAME} | `{PBI_REPORT_3_ID}` | `{PBI_REPORT_3_AUTHOR_COL}` |

### Query Workflow

1. Call `GetSemanticModelSchema` for each report to discover tables/columns/measures
2. Try `GenerateQuery` with schema + natural language question → DAX
3. If GenerateQuery fails, write DAX manually using the schema
4. Execute with `ExecuteQuery`, always filtering by author = `{PBI_AUTHOR}`

### Query Rules

- Always filter by author = `{PBI_AUTHOR}`
- Always scope to latest reporting period
- Categories: {CATEGORIES}
- Never pull all-time data unless explicitly asked

### PBI by Day Type

**Midweek/Friday — Snapshot:** Query {PBI_REPORT_1_NAME} only. Return key metrics as a compact table.

**Monday — Full:** Query all reports. Per-category breakdown.

**Monthly — Trends:** Full Monday report + month-over-month comparison.

---

## Execution Order

### Monday / Monthly

```
PARALLEL BATCH 1:
├── ADO: az boards query
├── PBI: Query all reports (Monthly: + previous month)
├── WorkIQ: flagged emails (3d)
├── WorkIQ: Teams since last business day
├── WorkIQ: calendar today
└── WorkIQ: {MANAGER_NAME}'s priorities

BATCH 2 (after batch 1):
├── Read carry-forward from last brief
└── Check active initiatives / stored context

COMPILE → Save to {OUTPUT_DIR}/YYYY-MM-DD.md
```

### Midweek (Tue–Thu)

```
PARALLEL:
├── WorkIQ: emails, Teams, calendar
├── gh pr list + gh issue list (per tracked repo)
├── PBI: Snapshot ({PBI_REPORT_1_NAME} only)
└── Read carry-forward from Monday brief

COMPILE → Save
```

### Friday

```
PARALLEL:
├── WorkIQ: emails, Teams, calendar
├── gh pr list + gh issue list (per tracked repo)
├── PBI: Snapshot + week-over-week delta if available
└── Read carry-forward from Monday brief

COMPILE (add Friday sections) → Save
```

---

## Output Structure

**File:** `{OUTPUT_DIR}/YYYY-MM-DD.md`

### Monday

```markdown
# Monday Morning Brief — {date}

## 🔴 This Week's Hard Deadlines
## 🔔 Reminders
## 📊 Signals (table: Source | Count | P0 | P1)
### P0 Items (Do Today)
### P1 Items (This Week)
## 📈 Dashboard Health (PBI)
## 📬 {MANAGER_NAME}'s Asks
## 📋 Open PRs
## 📊 ADO Work Items
## 📧 Email Highlights
## 💬 Teams Highlights
## 📅 Key Meetings
## 🎯 Suggested Priority Order
```

### Midweek (Tue–Thu)

```markdown
# Daily Brief — {date} ({day})

## 📅 Meetings Today
## ✅ Action Items
## 📈 Dashboard Snapshot
## 📋 Open PRs
## 📧 Email/Teams Highlights
## 🔄 Carry-Forward
```

### Friday

```markdown
# Friday Recap — {date}

## 📅 Meetings Today
## ✅ Action Items
## 🏆 This Week's Wins
## 📈 Dashboard Snapshot
## 📋 Open PRs
## 📧 Email/Teams Highlights
## 🔄 Carry-Forward for Next Week
```

### Monthly Addition (first Monday)

```markdown
## 📊 Monthly Trends
### Month-over-Month (table: Category | Last Month | This Month | Δ)
### Newly Flagged
### Resolved
### Recommendations
```

---

## Notes

- If PBI auth fails: "⏳ Dashboard data unavailable — restart CLI to re-auth"
- Include `Last updated: {ISO timestamp}` at bottom of every brief
- If any data source fails, note the gap and continue — don't block the brief
