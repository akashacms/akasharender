# Workflow State

This file tracks the state of the current development task across agent handoffs.
Copy this template to `WORKFLOW.md` in the project root when starting new work.

## Source Feature Plan
<!-- Path to feature plan file if working from an existing plan, or "N/A" -->
N/A

## Current Phase/Task
<!-- Which phase and specific task from the feature plan, or general description -->
Initial setup

## Task Description
<!-- Brief description of what needs to be built in this iteration -->

## Requirements for This Iteration
<!-- Checkbox list of requirements with acceptance criteria - scoped to current task only -->
- [ ] Requirement 1: Description with acceptance criteria
- [ ] Requirement 2: Description with acceptance criteria

## Workflow Phase
<!-- One of: REQUIREMENTS | BUILDING | CODE_REVIEW | QA | PM_VALIDATION | PHASE_COMPLETE -->
REQUIREMENTS

## Next Agent
<!-- One of: program-manager | builder | code-reviewer | quality-assurance | none -->
program-manager

## Completed Tasks
<!-- Tasks from the feature plan that have been completed -->
- None yet

## Agent History
<!-- Log of agent handoffs -->
| Timestamp | From Agent | To Agent | Status |
|-----------|------------|----------|--------|
| | | program-manager | Started |

## Handoff Notes
<!-- Notes from the current/previous agent for the next agent -->

### From Program Manager
<!-- Requirements clarifications, scope notes -->

### From Builder  
<!-- Implementation decisions, files changed, technical notes -->

### From Code Reviewer
<!-- Review findings, issues to address, approved items -->

### From Quality Assurance
<!-- Test results, coverage notes, bugs found -->

## Files Changed
<!-- List of files modified or created during this workflow -->

## Validation Results
<!-- PM's final validation notes -->

---

## Workflow Process

```
                    +------------------+
                    | Program Manager  |
                    | (Requirements)   |
                    +--------+---------+
                             |
                             v
                    +--------+---------+
                    |     Builder      |
                    | (Implementation) |
                    +--------+---------+
                             |
                     +-------+-------+
                     |               |
                     v               |
            +--------+--------+      |
            |  Code Reviewer  |      |
            | (Quality Check) |      |
            +--------+--------+      |
                     |               |
              +------+------+        |
              |             |        |
         APPROVED      NEEDS_REVISION
              |             |        |
              v             +--------+
     +--------+--------+
     | Quality Assurance|
     |    (Testing)    |
     +--------+--------+
              |
       +------+------+
       |             |
    PASSED        FAILED
       |             |
       v             +---> Builder
+------+-------+
|Program Manager|
| (Validation) |
+------+-------+
       |
+------+------+
|             |
MET        NOT_MET
|             |
v             +---> Builder
COMPLETE
```

## Usage

1. **Starting Work**: Program Manager creates WORKFLOW.md with requirements
2. **Building**: Builder implements, updates handoff notes, routes to Code Reviewer
3. **Review**: Code Reviewer validates, routes to QA or back to Builder
4. **Testing**: QA writes tests, runs them, routes to PM or back to Builder
5. **Validation**: PM verifies requirements met, marks complete or returns to Builder
