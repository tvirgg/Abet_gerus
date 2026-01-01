# Abbit - Epics & User Stories

**Based on:** docs/prd.md
**Status:** Ready for Development

---

## Epic 1: SaaS Foundation & Identity
**Goal:** Establish a secure, multi-tenant environment where agencies manage their own users and data in isolation.

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **US1.1** | As a **User**, I want to log in using my email and password so I can access the system. | - JWT issued upon success<br>- Error message for invalid creds<br>- Redirect to approp. dashboard |
| **US1.2** | As a **Tenant Admin**, I want to ensure my data is invisible to other companies. | - API enforces `companyId` filter on ALL queries<br>- Users cannot access resources of other tenants |
| **US1.3** | As a **System**, I want to handle roles (Student, Curator, Admin) so users see only what they need. | - Guards/Decorators in NestJS for Roles<br>- UI hides unauthorized menu items |

---

## Epic 2: The Student Quest (Gamified Journey)
**Goal:** Transform the student's admission process into an engaging, roadmap-driven experience.

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **US2.1** | As a **Student**, I want to see a Task Matrix (Roadmap) so I know exactly what steps are required. | - List of tasks ordered by phase<br>- "Locked" vs "Unlocked" states tailored by Camunda |
| **US2.2** | As a **Student**, I want to use a Kanban Board to track my progress. | - Columns: Todo, Review, Done<br>- Drag and drop disabled (state managed by system flows) |
| **US2.3** | As a **Student**, I want to upload documents (PDF/Img) for a task so I can submit my work. | - File picker with type validation<br>- Upload progress bar<br>- Preview of uploaded file |
| **US2.4** | As a **Student**, I want to "Submit" a task for review so I can move to the next step. | - Button active only if file uploaded<br>- Task status changes to "Review" |
| **US2.5** | As a **Student**, I want to earn XP and see my Avatar level up so I feel rewarded. | - XP animation on "Task Approved"<br>- Progress bar to next level<br>- Avatar visual changes |
| **US2.6** | As a **Student**, I want to download all my approved docs as a ZIP so I have a backup. | - Single click download<br>- Contains only "Done" files |

---

## Epic 3: Curator Command Center
**Goal:** Enable curators to efficiently manage multiple students and review submissions quickly.

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **US3.1** | As a **Curator**, I want to see a list of my assigned students with "Risk" indicators. | - Filterable table<br>- Progress % shown<br>- Red flag if deadline near/missed |
| **US3.2** | As a **Curator**, I want a global "Review Inbox" so I can see all pending work in one place. | - List of all tasks in "Review" status across my students |
| **US3.3** | As a **Curator**, I want to Approve a submission. | - Moves task to "Done"<br>- Triggers XP award<br>- Notifies student |
| **US3.4** | As a **Curator**, I want to Reject a submission with a comment. | - Mandatory text field for reason<br>- Moves task to "Todo"<br>- Student sees comment highlighted |

---

## Epic 4: Administration & Content
**Goal:** Allow admins to configure the admission logic and master data.

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **US4.1** | As an **Admin**, I want to manage Universities and Countries. | - CRUD operations for reference data |
| **US4.2** | As an **Admin**, I want to create Task Templates linked to BPMN IDs. | - Editor to define Title, Desc, XP value, and Camunda Activity ID |
| **US4.3** | As an **Admin**, I want to onboard new Curators. | - Invite/Create account flow |

---

## Epic 5: System Integrations
**Goal:** Connect the web platform to external engines (process, storage, messaging).

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| **US5.1** | As a **System**, I want to sync task status with Camunda. | - Complete user task in Camunda when Curator approves<br>- Create new DB task when Camunda process reaches user task |
| **US5.2** | As a **Student**, I want to link my Telegram account. | - "Get Binding Code" button in Profile<br>- Send code to Bot to link `chat_id` |
| **US5.3** | As a **Parent**, I want to receive Telegram notifications about my child's progress. | - Notifications on: Submission, Approval, Rejection, Deadline |
| **US5.4** | As a **System**, I want to store files securely in MinIO. | - Uploads go to bucket `{companyId}/{studentId}/...`<br>- Access only via signed URLs |
