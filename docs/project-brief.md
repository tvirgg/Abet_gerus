# Project Brief: Abbit (Student Admission System)

**Date:** 2026-01-01
**Author:** BMad Analyst
**Context:** MVP Development / SaaS Platform

---

## Executive Summary

**Abbit** is a comprehensive web platform designed to streamline and gamify the university admission process for students applying abroad. It replaces scattered communication channels (chats, spreadsheets) with a centralized system that offers clear roadmaps (Tasks/Quests), document management, and progress tracking.

The system is built as a multi-company SaaS platform, servicing education agencies. It empowers **Students** with a clear path and gamified motivation (XP, Avatars), provides **Curators** with efficient management tools, and offers **Parents** visibility via Telegram integration.

---

## Core Vision

### Problem Statement
Currently, the admission process is chaotic, characterized by:
*   **Disorganized Communication:** Information is scattered across various messengers, emails, and files.
*   **Lack of Transparency:** Students lack a clear understanding of their roadmap, progress, and upcoming deadlines.
*   **Management Overhead:** Curators struggle to track multiple students effectively without a unified dashboard.
*   **Low Engagement:** The routine process of document collection is tedious and demotivating for applicants.

### Proposed Solution
A **Gamified Task-Based Web Platform** that serves as a single source of truth:
*   **For Students:** An interacting "Quest" system where admission steps are tasks. Completing tasks earns XP and unlocks avatar customization.
*   **For Curators:** A dashboard to monitor student progress, review submissions (docs, links), and manage deadlines.
*   **Process Automation:** Integration with **Camunda BPMN** to orchestrate workflows (e.g., Registration, Onboarding).
*   **SaaS Architecture:** Built solely for scalability with multi-tenant support (Company isolation) from Day 1.

### Key Differentiators
1.  **Gamification:** Transforming bureaucracy into an RPG-like experience (XP for tasks, fully customizable Avatars).
2.  **Process-Driven:** Powered by a BPMN engine (Camunda) for flexible process logic managed via API.
3.  **Strict Isolation:** Multi-company architecture allowing multiple agencies to use the platform securely.
4.  **Telegram Integration:** "Binding code" system to link Telegram groups for notifications (Deadlines, Reviews) for Students and Parents.

---

## Target Users

### Primary Users
1.  **Student (The Player):**
    *   **Needs:** Clear instructions, visual progress, motivation, centralized document storage.
    *   **Workflow:** Log in -> Check Dashboard -> specific "Tasks" (Upload doc/Fill form) -> Wait for Review -> Earn XP.
2.  **Curator (The Guide):**
    *   **Needs:** Overview of all assigned students, quick review interface, deadline alerts.
    *   **Workflow:** Dashboard -> Review Inbox (Approve/Reject submissions) -> Communication via comments.

### Secondary Users
*   **Company Admin:** Manages curators, university databases, and task templates.
*   **Parent (Observer):** No direct login in MVP, but receives status updates and alerts via a linked Telegram group.

---

## Success Metrics

### MVP Success Criteria
*   **Functional Core:** Successful registration, task generation, submission, and review cycle.
*   **Engagement:** Students customizing avatars and actively tracking XP.
*   **Efficiency:** Reduction in "What do I do next?" questions to curators.
*   **Stability:** Robust handling of file uploads (MinIO) and BPMN process states.

### Key Performance Indicators (KPIs)
*   **Task Completion Rate:** % of tasks completed on time.
*   **Review Turnaround:** Time taken for a curator to review a submission.
*   **User Retention:** Daily Active Users (DAU) among active applicants.

---

## MVP Scope

### Core Features
1.  **Auth & Profiles:**
    *   Role-based access (Student, Curator, Admin).
    *   Multi-company isolation features.
2.  **Student Dashboard:**
    *   **Task Matrix:** Auto-generated tasks based on Country/Program selection.
    *   **Kanban Board:** Visual status of tasks (Todo, Review, Done).
    *   **My Folder:** Collected documents ready for download.
    *   **Gamification:** XP logic (1000 XP scale) and Avatar rendering.
3.  **Curator Dashboard:**
    *   Student list with progress bars and risk indicators.
    *   Global Review Inbox for quick task approval/rejection.
4.  **Admin Panel:**
    *   Management of Countries, Universities, and Programs.
    *   Task Template editor.
5.  **Notifications:**
    *   Telegram Bot integration for deadline warnings and status updates.

### Out of Scope for MVP
*   Self-registration for Parents/Companies (Manual creation only).
*   In-app chat (Use comments on tasks + Telegram).
*   Billing/Subscription management for Companies.
*   Complex individual timezone management (Default: Asia/Almaty).
*   Native Mobile App (Responsive Web App only).

---

## Technical Preferences

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Zustand.
*   **Backend:** NestJS (Modular Monolith), Prisma ORM.
*   **Database:** PostgreSQL.
*   **Process Engine:** Camunda (via REST).
*   **Storage:** MinIO (S3 compatible).
*   **Infrastructure:** Docker + Docker Compose.

---

## Timeline & Resources

*   **Total Duration:** 8 Weeks (estimated from TZ).
    *   **Weeks 1-2:** Analytics, Design (Figma), Core Backend setup.
    *   **Weeks 3-4:** Backend Core (Tasks, Students) & API.
    *   **Weeks 5-6:** Frontend Student Area.
    *   **Weeks 7-8:** Frontend Curator/Admin Area, Integration, Testing.

---
_Generated based on technical specification "tz.md"._
