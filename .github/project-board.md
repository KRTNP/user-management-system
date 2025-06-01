# Project Board Configuration

This document describes the project board configuration for the User Management System. You'll need to create this board manually in the GitHub interface.

## Board Name: User Management System Development

## Columns:
1. **To Do**
   - Items that are planned but not yet started
   - Automatically add newly created issues here

2. **In Progress**
   - Items currently being worked on
   - Move here manually when work begins

3. **Code Review**
   - Items that have a PR and are awaiting review
   - Link to pull requests

4. **QA Testing**
   - Items that have passed code review and need testing
   - For tracking testing status

5. **Done**
   - Completed items
   - Automatically move issues here when the linked PR is merged

## Automation Rules:
- When issues are created, add them to "To Do"
- When a pull request is created for an issue, move the issue to "Code Review"
- When a pull request is merged, move the issue to "Done"

## Labels for Cards:
- Priority: High, Medium, Low
- Type: Bug, Feature, Documentation, Refactoring
- Difficulty: Easy, Medium, Hard
