# Abbit - Product Requirements Document

**Author:** BMad PM
**Date:** 2026-01-01
**Version:** 1.0
**Source Document:** docs/project-brief.md

---

## Executive Summary

Abbit is a comprehensive SaaS platform designed to gamify and streamline the university admission process for study abroad agencies. It replaces chaotic communication channels with a structured, centralized "Quest" system.

### What Makes This Special

**Gamified Bureaucracy ("RPG Life"):** The core differentiator is transforming the tedious admission process into an engaging RPG experience where students help their "Avatar" progress by completing real-world tasks (uploading docs, filling forms). This is powered by a robust **Camunda BPMN** engine and protected by strict **Multi-Tenant SaaS** isolation.

---

## Project Classification

**Technical Type:** SaaS B2B (Web Platform)
**Domain:** EdTech (Admissions)
**Complexity:** Medium/High

### Domain Context

As an EdTech platform handling student data, **Privacy** and **Clarity** are paramount. The system serves three distinct personas (Student, Curator, Parent) who need different views of the same data. The "Agency" model requires strict data isolation (Multi-tenancy).

---

## Success Criteria

### Measures of Success
1.  **Functional Adoption:** Agencies successfully onboard students who complete the full admission cycle via the platform.
2.  **Engagement:** Students actively interact with the Avatar/XP system, reducing "dropout" or procrastination.
3.  **Operational Efficiency:** Curators spend less time answering "what's next?" and more time on high-value guidance.

### Business Metrics (KPIs)
-   **Task Completion Rate:** % of tasks completed on schedule.
-   **Review Turnaround:** Average time from Submission -> Review Decision.
-   **Daily Active Users (DAU):** Student engagement monitoring.

---

## Product Scope

### MVP - Minimum Viable Product
1.  **Multi-Tenant Auth:** Secure login for Students, Curators, Admins with Company isolation.
2.  **Student Quest Dashboard:** Kanban board, Task Matrix, File Uploads, XP/Avatar display.
3.  **Curator Command Center:** Student list, Review Inbox, Approval/Rejection flow.
4.  **Admin Tools:** Management of University/Country data and Task Templates.
5.  **Notifications:** Telegram Bot integration for status updates.
6.  **Core Integrations:** MinIO (Storage), Camunda (Process Engine).

### Growth Features (Post-MVP)
-   Self-service registration for new Agencies/Parents.
-   Billing and Subscription management.
-   In-app real-time chat (replacing task comments).
-   Mobile Native App.

### Vision (Future)
-   AI-driven university recommendations.
-   Global marketplace for universities.

---

## Domain-Specific Requirements (EdTech/SaaS)

1.  **Data Isolation (Privacy):** Student data must never leak between Agencies (Tenants).
2.  **Auditability:** Every document submission and review decision must be logged (Process history).
3.  **Clarity:** Instructions must be unambiguous to reduce anxiety for teenage applicants.

---

## Functional Requirements

### User Management & Security
-   **FR1:** Users (Student, Curator, Admin) can log in via email and password using secure authentication.
-   **FR2:** System must enforce **Tenancy Isolation**, ensuring users only access data within their `companyId`.
-   **FR3:** System must enforce **Role-Based Access Control (RBAC)** for Student, Curator, and Admin flows.
-   **FR4:** Students can link their Telegram account via a "Binding Code" to receive notifications.

### Student Experience ("The Quest")
-   **FR5:** Students can view a **Task Matrix** (Roadmap) tailored to their Country/Program selection.
-   **FR6:** Students can view tasks on a **Kanban Board** categorized by status (Todo, Review, Done).
-   **FR7:** Students can view detailed instructions for a specific Task.
-   **FR8:** Students can **upload documents/files** to a customized "Submission" area for a task.
-   **FR9:** Students can **submit** a task for review once requirements are met.
-   **FR10:** Students receive **XP (Experience Points)** automatically upon task completion (Review Approval).
-   **FR11:** Students can view their **Avatar** and its current level/customization based on XP.
-   **FR12:** Students can download a "My Folder" archive of all approved documents.

### Curator Experience ("The Guide")
-   **FR13:** Curators can view a searchable/filterable list of **Students assigned to them**.
-   **FR14:** Curators can view a **Review Inbox** showing all pending task submissions.
-   **FR15:** Curators can **Approve** a submission, which unlocks the next process step for the student.
-   **FR16:** Curators can **Reject** a submission with a mandatory **Comment/Reason**, returning the task to "Todo".
-   **FR17:** Curators can view a student's progress bar and "Risk" indicators (e.g., missed deadlines).

### Admin & Content
-   **FR18:** Admins can manage global data: **Universities**, **Countries**, and **Programs**.
-   **FR19:** Admins can create and edit **Task Templates** (linking to BPMN steps).
-   **FR20:** Admins can manage Curator accounts and assign them to students.

### System Behaviors
-   **FR21:** System triggers **Telegram Notifications** to Student (and linked Parent) upon Review outcomes.
-   **FR22:** System integrates with **Camunda** to orchestrate task availability (e.g., Task B only opens after Task A is Done).
-   **FR23:** System stores all file uploads securely in **MinIO** with presigned URL access.
-   **FR24:** System validates file types and sizes during upload.

---

## Non-Functional Requirements

### User Experience (Aesthetics)
-   **NFR1:** The interface must feature a **Premium, "Wow" Design** with vibrant colors, glassmorphism, and dark mode support.
-   **NFR2:** Transitions and interactions (especially Avatar updates and Kanban moves) must be smooth and animated.

### Performance & Scalability
-   **NFR3:** Dashboard load time should be under **1.5 seconds** (p95).
-   **NFR4:** System must support horizontal scaling for the API and Consumers to handle peak admission seasons.

### Security
-   **NFR5:** All API requests must be validated with JWTs containing `userId` and `companyId`.
-   **NFR6:** File access must be strictly controlled via short-lived presigned URLs.

---

## Innovation & Novel Patterns
**Bureaucracy as a Game:** By treating document collection as a "Quest" with tangible rewards (XP, Avatar items), we flip the emotional context from "Stress" to "Achievement".
