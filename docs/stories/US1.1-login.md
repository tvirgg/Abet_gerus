# US1.1: User Login

**Epic:** SaaS Foundation & Identity
**Status:** Review

## Description
As a **User**, I want to log in using my email and password so I can access the system.

## Acceptance Criteria
- [ ] User can authenticate with valid email and password
- [ ] System issues a JWT upon successful login
- [ ] System displays an error message for invalid credentials
- [ ] User is redirected to the appropriate dashboard based on their role after login

## In Scope
- JWT generation and validation
- Basic email/password check against DB (User entity)
- Role guard payload in JWT
- Frontend Login Page with error handling
- Redirection logic

## Out of Scope
- Registration (handled in Admin onboarding or separate story)
- Forgot Password
- 2FA

## Tasks/Subtasks

### Backend (apps/api)
- [x] **Setup Auth Module**: Create `AuthModule`, `AuthService`, `AuthController`
- [x] **Implement User Entity**: Define `User` entity with email, password (hashed), role, companyId
- [x] **Implement Login Logic**: `validateUser` checks credentials; `login` returns JWT
- [x] **Configure JWT Strategy**: Setup Passport JWT strategy
- [x] **Add Role Guard**: Create `RolesGuard` and `@Roles` decorator (preparatory for US1.3 but needed for login redirection logic validation)

### Frontend (apps/web)
- [x] **Create Login Page**: `app/login/page.tsx` with Email/Password inputs
- [x] **Implement API Integration**: Service/Function to call `POST /auth/login`
- [x] **Handle Auth State**: Store JWT (in cookie/localStorage) and User info using Zustand
- [x] **Implement Redirection**: Logic to route to `/dashboard` (Student) or `/admin` (Admin) based on role

### Testing
- [x] **Backend Unit Tests**: coverage for `AuthService`
- [x] **E2E Test**: `POST /auth/login` valid and invalid cases

## Dev Agent Record

### Debug Log
- [ ] 

### Completion Notes
- [ ] 

## File List
- [ ] 

## Change Log
- [ ] 
