# US5.1: Camunda Synchronization

**Epic:** System Integrations
**Status:** Open

## Description
As a **System**, I want to sync task status with Camunda.

## Acceptance Criteria
- [ ] When a Curator approves a task in Abbit, the corresponding User Task in Camunda is completed
- [ ] When the Camunda process reaches a new User Task, a corresponding Task entity is created in the Abbit database
- [ ] Two-way synchronization ensures state consistency
