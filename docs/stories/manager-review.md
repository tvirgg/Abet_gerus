# Manager Document Review Process (Admin UI)

**Status:** Draft
**Role:** Manager / Curator / Admin

## 1. Overview
This story defines the interface and workflow for a Manager to review documents uploaded by students. The goal is to provide a streamlined "Review Mode" where the manager can efficiently validate documents against specific rules and provide quick feedback (approval or rejection with reasons).

## 2. Student List (Dashboard)
The entry point is a list of students filtered by status.

*   **View:** Table or Card list of students.
*   **Filter Condition:** Status = "Requiring Verification" (or equivalent, e.g., "Review Pending").
*   **Columns/Info:**
    *   Student Name
    *   Course / University
    *   Document Name (e.g., "School Diploma")
    *   Submission Date
    *   **Action:** Click on the row/student to enter **Document Review Mode**.

## 3. Document Review Mode
Upon clicking a student/document, the interface shifts to a focused review dashboard designed for high-throughput validation.

### 3.1 Layout
The screen is split into two main panels:

#### **Left Panel: Document Viewer**
*   **Content:** Displays the file uploaded by the student.
*   **Source:** Fetched securely from MinIO.
*   **Capabilities:**
    *   **PDF:** Built-in PDF viewer with zoom/scroll.
    *   **Image:** Image viewer with zoom/pan capabilities.
    *   **Fallback:** "Download" button if the file type cannot be previewed in-browser.

#### **Right Panel: Validation Checklist**
*   **Source:** Driven by the `document_templates` table, specifically the `validation_rules` field for the current document type.
*   **UI Components:**
    *   A list of checkable items (e.g., "Stamp is visible", "Notary seal present", "Date is within valid range").
    *   These serve as a guide for the manager but may not necessarily require physical checking to proceed (depending on strictness preference, currently treated as a visual guide).

### 3.2 Actions
The footer or top-right of the Review Panel contains the decision actions:

*   **Approve Button (Green):**
    *   **Action:** Marks the document task as `DONE`.
    *   **Feedback:** Toast notification "Document Approved".
    *   **Navigation:** Automatically loads the next pending document (if available) or returns to the list.

*   **Reject Button (Red):**
    *   **Action:** Opens the **Rejection Dialog/Modal**.

## 4. Rejection Workflow
When "Reject" is clicked, the manager **MUST** provide a reason.

### 4.1 Rejection Dialog
*   **Dropdown:** "Reason for Rejection"
    *   **Source:** `rejection_reasons` table/enum.
    *   **Examples:** "Blurry Image", "Wrong Document", "Missing Stamp", "Expired", "Translation Required".
*   **Text Area:** "Comment for Student"
    *   **Behavior:** Auto-filled based on the selected dropdown reason (if a template exists) but editable.
    *   **Requirement:** Mandatory. The manager cannot reject without a comment/reason.

### 4.2 Outcome
*   **System Action:**
    *   Update Task Status to `TODO` (or `REJECTED`).
    *   Save the comment to the task/submission record.
*   **Student Notification:**
    *   The specific comment entered by the manager is sent to the Student.
    *   Appears in the Student's "Action Required" modal or feedback stream.

## 5. Data Sources
*   **Validation Rules:** `document_templates.validation_rules` (JSON/Array).
*   **Rejection Reasons:** `rejection_reasons` (Table/Enum).
*   **Document Files:** MinIO Object Storage.
