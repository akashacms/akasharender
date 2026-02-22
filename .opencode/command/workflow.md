---
description: Start or continue the multi-agent development workflow
agent: program-manager
---

# Multi-Agent Development Workflow

This command initiates or continues the collaborative development workflow involving four specialized agents:

1. **Program Manager** - Requirements and validation
2. **Builder** - Implementation
3. **Code Reviewer** - Quality and architecture checks  
4. **Quality Assurance** - Testing

## Starting New Work

If no `WORKFLOW.md` exists in the project root, create one using the template at `.opencode/agents/WORKFLOW-TEMPLATE.md`.

## Continuing Work

If `WORKFLOW.md` exists:
1. Read it to understand current state
2. Check the "Next Agent" field to determine who should work
3. Continue from current phase

## Agent Handoff Protocol

Each agent must:
1. Read `WORKFLOW.md` at start
2. Update `WORKFLOW.md` before finishing
3. Set "Next Agent" appropriately
4. Add detailed handoff notes

## Workflow Command

To invoke a specific agent:
- `@program-manager` - Define requirements or validate completion
- `@builder` - Implement code
- `@code-reviewer` - Review code quality
- `@quality-assurance` - Write and run tests
