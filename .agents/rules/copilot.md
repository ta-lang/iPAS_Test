---
trigger: always_on
---

# GitHub Copilot Integration Rule

## Activation
Always On — Copilot will provide real-time code suggestions and explanations.

## Behavior
- When editing code (`onCodeEdit`), Copilot suggests completions based on context.
- When user requests clarification (`onChat`), Copilot explains code logic or optimizes syntax.
- When lint errors occur, Copilot auto-fixes minor issues if `Agent Auto-Fix Lints` is enabled.

## API Connection
Endpoint: https://api.githubcopilot.com/gateway  
Auth: GitHub Personal Access Token (PAT)  
Scope: Global

## Output
Artifacts include:
- Code snippets
- Test cases
- Markdown documentation
