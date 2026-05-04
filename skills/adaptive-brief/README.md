# Adaptive Daily Brief — Copilot CLI Skill

A reusable [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli) skill that generates an adaptive daily brief. The brief adjusts depth and data sources by day of week, pulling from WorkIQ (M365 Copilot), GitHub CLI, Azure DevOps, and optionally Power BI via MCP.

## What It Does

| Day | Depth | Data Sources |
|-----|-------|-------------|
| **Monday** | Full weekly plan | WorkIQ + GitHub + ADO + PBI (all reports) |
| **Tue–Thu** | Focused check-in | WorkIQ + GitHub + PBI (snapshot) |
| **Friday** | Week recap + carry-forward | WorkIQ + GitHub + PBI (snapshot) |
| **1st Monday of month** | Monday + trend analysis | All above + month-over-month PBI comparison |

## Quick Start

1. Copy `SKILL.md` into your repo at `.copilot/skills/adaptive-brief/SKILL.md`
2. Open `SKILL.md` and replace all `{PLACEHOLDER}` values (see [Configuration](#configuration))
3. In Copilot CLI, say: `"daily brief"` or `"monday brief"`

## Configuration

Search for `{PLACEHOLDER}` in `SKILL.md` and replace each one.

### Required

| Placeholder | What It Is | How to Find It | Example |
|-------------|-----------|----------------|---------|
| `{YOUR_NAME}` | Your display name for brief headers | Your preferred name | `Jane Doe` |
| `{GITHUB_AUTHOR}` | Your GitHub username (used for PR/issue queries) | `gh api user --jq .login` | `jdoe` |
| `{MANAGER_NAME}` | Your manager's full name (WorkIQ queries use this to find their asks) | Your org chart | `Pat Smith` |
| `{GITHUB_REPOS}` | Repos you track, one per line in the SKILL.md list | Repos you contribute to | `org/frontend`, `org/backend` |
| `{ADO_ORG_URL}` | Azure DevOps organization URL | Your ADO bookmark | `https://dev.azure.com/my-org` |
| `{ADO_PROJECT}` | Azure DevOps project name | ADO project selector | `MyProject` |
| `{OUTPUT_DIR}` | Relative path from repo root where briefs are saved (created if missing) | Your preference | `briefs/daily` |

### Power BI (optional — remove PBI sections if not used)

PBI integration is **optional**. If you don't use Power BI, delete the `## Power BI Integration` section and the PBI lines from `Data Sources by Day Type` in SKILL.md. Everything else works independently.

If you DO use Power BI, you need:

| Placeholder | What It Is | How to Find It | Example |
|-------------|-----------|----------------|---------|
| `{PBI_AUTHOR}` | Your identity in PBI report filters (may differ from GitHub username) | Check your PBI report filters | `jdoe` |
| `{PBI_REPORT_N_NAME}` | Display name for each report (N = 1, 2, 3) | Your Power BI workspace | `Sales Dashboard` |
| `{PBI_REPORT_N_ID}` | Semantic model GUID | PBI service → report Settings URL → the GUID after `/datasets/` | `aede3e37-62fd-...` |
| `{PBI_REPORT_N_AUTHOR_COL}` | The `Table[Column]` that filters by author | Call `pbi-server-GetSemanticModelSchema` and look for author/owner columns | `Users[Alias]` |
| `{CATEGORIES}` | Comma-separated categories/areas you track in PBI | Your report's grouping dimension | `team-a, team-b, team-c` |

> **First-time PBI MCP setup:**
> 1. Add to `~/.copilot/mcp-config.json`:
>    ```json
>    {
>      "mcpServers": {
>        "powerbi-remote": {
>          "type": "http",
>          "url": "https://api.fabric.microsoft.com/v1/mcp/powerbi"
>        }
>      }
>    }
>    ```
> 2. Restart Copilot CLI (triggers OAuth)
> 3. Test: ask Copilot `"list my Power BI reports"` — if tools load, you're connected
> 4. Find your semantic model ID: open report in PBI service → Settings → copy GUID from URL
> 5. Find your author column: run `pbi-server-GetSemanticModelSchema` with your model ID, look for a column containing author/user/alias values

**Tool naming note:** The MCP config names the server `powerbi-remote`, but the tools Copilot exposes may appear as `pbi-server-*` (e.g., `pbi-server-ExecuteQuery`). Both refer to the same server — the prefix depends on your MCP client version.

## Integrations

| Integration | Required? | What It Provides |
|-------------|-----------|-----------------|
| **WorkIQ** (M365 Copilot) | Recommended | Calendar, emails, Teams messages, manager priorities |
| **GitHub CLI** (`gh`) | Recommended | Open PRs, issues, review requests |
| **Azure DevOps** (`az boards`) | Optional | Work items assigned to you |
| **Power BI MCP** | Optional | Dashboard metrics, trend analysis |

Remove any section from SKILL.md for integrations you don't use.

## Output

Briefs are saved to `{OUTPUT_DIR}/YYYY-MM-DD.md` with emoji-prefixed sections:

- 🔴 Hard deadlines
- 📈 Dashboard health (PBI)
- 📬 Manager's asks
- 📋 Open PRs
- 📊 Work items (ADO)
- 📧 Email/Teams highlights
- 🎯 Suggested priority order

## Troubleshooting

| Problem | Fix |
|---------|-----|
| PBI tools don't load | Restart Copilot CLI to re-auth. Token scope: `https://api.fabric.microsoft.com/.default` |
| WorkIQ returns nothing | Check that WorkIQ MCP is configured and you've accepted the EULA |
| `gh` commands fail | Run `gh auth status` to verify authentication |
| ADO query fails | Verify `az account show` and `az devops configure --defaults organization={ADO_ORG_URL} project={ADO_PROJECT}` |
| Brief is missing a section | The skill degrades gracefully — if a source fails, it notes the gap and continues |

## License

MIT — use, adapt, share freely.
