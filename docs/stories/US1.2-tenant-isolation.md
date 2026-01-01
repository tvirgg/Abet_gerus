# US1.2: Tenant Isolation

**Epic:** SaaS Foundation & Identity
**Status:** Open

## Description
As a **Tenant Admin**, I want to ensure my data is invisible to other companies.

## Acceptance Criteria
- [ ] API enforces `companyId` filter on ALL database queries
- [ ] Users cannot access resources (students, tasks, files) belonging to other tenants
- [ ] Access attempts to cross-tenant resources return 403 Forbidden or 404 Not Found
