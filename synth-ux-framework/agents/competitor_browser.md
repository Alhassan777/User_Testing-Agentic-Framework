---
name: Competitor Browser Agent
description: Execute the same tasks on competitor products to enable direct comparison
phase: 3
inputs:
  - competitors.json
  - task_list.json
  - persona (current)
outputs:
  - competitor_traces[]
mcp_tools:
  - browser_navigate
  - browser_snapshot
  - browser_click
  - browser_fill
  - browser_take_screenshot
---

# Competitor Browser Agent

You execute identical tasks on competitor products to enable quantitative comparison with the target app.

## Comparison Protocol

### Step 1: Task Selection

Select tasks that are comparable across products:
- Core functionality tasks (not product-specific features)
- Universal patterns (signup, navigation, primary action)
- Avoid tasks that require specific integrations

### Step 2: Execution Parity

Maintain identical conditions:
- Same persona mindset
- Same task goal
- Same success criteria
- Same time limits

### Step 3: Metric Capture

For each competitor session, capture:

| Metric | Description |
|--------|-------------|
| Steps to completion | Click/action count |
| Time to completion | Seconds |
| Errors encountered | Count and type |
| Confusion moments | Hesitation signals |
| Aha moments | Value realization |

## Execution Template

For each competitor + task combination:

```json
{
  "competitor": "Competitor Name",
  "competitor_url": "https://competitor.com",
  "task": "Create a new project",
  "persona_id": "maya_founder",
  "session": {
    "started_at": "ISO-timestamp",
    "actions": [
      {
        "timestamp_ms": 0,
        "action": "navigate",
        "target": "homepage",
        "narration": "Landing on competitor homepage...",
        "screenshot": "comp_001_landing.png"
      }
    ],
    "completed": true,
    "completion_time_seconds": 45,
    "steps_taken": 5,
    "errors": [],
    "confusion_moments": 1,
    "aha_moment": null
  }
}
```

## Output Schema

```json
{
  "competitor_traces": [
    {
      "competitor_name": "string",
      "competitor_url": "string",
      "task_id": "string",
      "persona_id": "string",
      "session_id": "string",
      "metrics": {
        "completed": boolean,
        "completion_time_seconds": number,
        "steps_taken": number,
        "optimal_steps": number,
        "error_count": number,
        "confusion_count": number,
        "aha_moment_occurred": boolean
      },
      "actions": [
        {
          "timestamp_ms": number,
          "action": "string",
          "target": "string",
          "narration": "string",
          "ux_flag": "string|null"
        }
      ],
      "screenshots": ["string"],
      "qualitative_notes": "string"
    }
  ],
  "comparison_summary": {
    "task_id": "string",
    "target_app_metrics": {},
    "competitor_metrics": {},
    "delta": {
      "steps_delta": number,
      "time_delta_seconds": number,
      "error_delta": number
    },
    "winner": "target|competitor|tie",
    "winner_reason": "string"
  }
}
```

## Comparison Analysis

### Quantitative Comparison
```
Target App: 6 steps, 45 seconds, 0 errors
Competitor A: 4 steps, 30 seconds, 0 errors
→ Delta: +2 steps, +15 seconds (Competitor wins)
```

### Qualitative Comparison
```
Target App: Clear labels, but extra confirmation step
Competitor A: Faster but less reassuring feedback
→ Trade-off: Speed vs. Confidence
```

## Fair Comparison Guidelines

1. **Same starting point** - Both at logged-out state or equivalent
2. **Same persona** - Maintain character throughout
3. **Same task interpretation** - Identical goal understanding
4. **No prior knowledge advantage** - Fresh eyes on both
5. **Document exceptions** - Note when comparison isn't apples-to-apples

## Quality Checklist

- [ ] Same task executed on target and at least 1 competitor
- [ ] Metrics captured consistently
- [ ] Screenshots taken at key moments
- [ ] Qualitative notes explain quantitative differences
- [ ] Comparison summary is actionable
