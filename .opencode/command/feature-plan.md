---
description: Start or continue work from a feature plan file
agent: program-manager
---

# Feature Plan Workflow

This command initiates work from an existing feature plan file (e.g., `FEATURE-*.md`).

## Usage

Provide the path to the feature plan file:

```
/feature-plan FEATURE-Tag-Wrangling.md
```

Or reference it with @:

```
@program-manager Please start working on @FEATURE-Tag-Wrangling.md
```

## What Program Manager Will Do

1. **Read the feature plan** completely to understand:
   - Problem context and background
   - Requested functionality
   - Main tasks with specifications
   - Phased plan
   - Testing requirements

2. **Identify current state**:
   - Which tasks are marked DONE
   - Which phase to start/continue
   - Dependencies between tasks

3. **Create WORKFLOW.md** with:
   - Reference to the source feature plan
   - Current phase/task being worked on
   - Specific requirements for this iteration
   - Acceptance criteria derived from the plan

4. **Hand off to Builder** for implementation

## Incremental Delivery

The agents work through the plan phase by phase:
- Phase 1 completes fully before Phase 2 starts
- Each task goes through: Build -> Code Review -> QA -> PM Validation
- Completed tasks get marked in the feature plan

## Example Feature Plan Structure

```markdown
# Feature Name

## Background
Context about the problem...

## Requested Functionality
- Feature A
- Feature B

## Main Tasks

### 1. First Task
DONE: Description of completed work

### 2. Second Task
Details of what needs to be built...

## Plan

### Phase 1: Setup
1. Task 1.1
2. Task 1.2

### Phase 2: Implementation
3. Task 2.1
...
```

## Continuing Work

If `WORKFLOW.md` exists and references a feature plan:
1. Program Manager reads both files
2. Validates current task completion
3. Moves to next task in the plan
4. Updates `WORKFLOW.md` for the new task
