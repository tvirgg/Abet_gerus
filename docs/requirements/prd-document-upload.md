# PRD: Document Upload System & Requirements
**Version:** 1.0
**Date:** 2026-01-01
**Author:** Mary (Business Analyst)

## 1. System Overview
This Product Requirements Document (PRD) defines the specific requirements, validation logic, and user guidance for the document upload module within the Student Admission System. The goal is to minimize rejection rates by providing clear, "Advice"-driven interfaces and strict validation criteria.

---

## 2. Global Technical Requirements
These requirements apply to **all** document types unless specified otherwise.

*   **File Formats:** PDF (preferred for documents), JPEG/PNG (acceptable for photos/scans).
*   **Max File Size:** 10 MB per file.
*   **Filename:** Auto-normalized by system (e.g., `{student_id}_{doc_type}_{timestamp}.pdf`).
*   **Compression:** Automatic server-side compression if > 5MB (optional optimization).

---

## 3. Document Types & Specifications

### 3.1. Passport (International) / Паспорт
*   **Description:** The main identity document for visa and admission.
*   **Format:** PDF or JPEG (High Quality).
*   **Advice (Instruction):**
    1.  Go to the Public Service Center (PSC / ЦОН) or Migration Police.
    2.  Request an International Passport (distinct from ID card).
    3.  Scan the **main spread** (photo + signature page) in color.
    4.  Ensure validity is at least 6-12 months beyond the intended start of studies.
*   **Validation (Checklist):**
    *   [ ] Full spread visible (all 4 corners).
    *   [ ] No glare on the photo or text.
    *   [ ] MRZ code (bottom lines) fully legible.
    *   [ ] Signature present.
*   **Typical Errors:**
    *   Scanning only one page instead of the spread.
    *   Flash glare obscuring details.
    *   Expired or expiring soon.

### 3.2. Digital Photo / Фотография (3x4 or 3.5x4.5)
*   **Description:** Official photo for student ID and visa application forms.
*   **Format:** JPEG/PNG only (Original digital file, not a scan of a photo).
*   **Advice (Instruction):**
    1.  Visit a professional photo studio.
    2.  Ask for a digital version (emailed to you).
    3.  Background: White or Light Grey (neutral).
    4.  Expression: Neutral, looking directly at the camera.
*   **Validation (Checklist):**
    *   [ ] Aspect ratio correct (3:4 or 3.5:4.5).
    *   [ ] White uniform background.
    *   [ ] Face takes up 70-80% of the height.
    *   [ ] High resolution (> 600dpi equivalent).
*   **Typical Errors:**
    *   Selfie or cropped casual photo.
    *   Scan of a printed photo (visible grain/texture).
    *   Colored or busy background.

### 3.3. High School Diploma / Аттестат
*   **Description:** Certificate of Completed Secondary Education.
*   **Format:** PDF (Color Scan).
*   **Advice (Instruction):**
    1.  Obtain the original document from your school administration after graduation.
    2.  Scan the hard cover and the main title page.
    3.  Ensure the "Series" and "Number" are clearly visible.
*   **Validation (Checklist):**
    *   [ ] Official School Stamp visible.
    *   [ ] Director/Principal signature present.
    *   [ ] Document Series/Number legible.
    *   [ ] No physical damage/tears.
*   **Typical Errors:**
    *   Uploading a copy instead of the original.
    *   Missing the cover page (if required).
    *   Blurry text.

### 3.4. Transcript / Табель (Приложение к аттестату)
*   **Description:** The complete list of grades/subjects accompanying the Diploma.
*   **Format:** PDF (Multi-page scan).
*   **Advice (Instruction):**
    1.  Usually issued together with the Attestat.
    2.  If not yet graduated, request a "Preliminary Transcript" (Spravka) from the school office.
    3.  Scan all pages (including the grading scale explanation).
*   **Validation (Checklist):**
    *   [ ] All subjects and grades listed.
    *   [ ] Matches the Attestat number.
    *   [ ] School stamp on every page (if multi-page).
*   **Typical Errors:**
    *   Missing pages.
    *   Partially cropped grades.
    *   Submitted a widely different format (e.g., a diary text dump).

### 3.5. Apostille Certificate / Апостиль
*   **Description:** International legalization stamp confirming the document's validity.
*   **Format:** PDF (Scan of the Apostilled document or the separate Apostille page).
*   **Advice (Instruction):**
    1.  Take your original Diploma/Attestat to the Public Service Center (PSC/ЦОН).
    2.  Submit for "Apostille" (Ministry of Education service).
    3.  Wait 15-30 days (Standard processing time).
    4.  The stamp is usually placed on the back of the original or on a bound ribbon-tied sheet.
*   **Validation (Checklist):**
    *   [ ] Stamp title "Apostille (Convention de La Haye)".
    *   [ ] Bound securely to the original document (ribbon/seal integrity).
    *   [ ] Signature of the Ministry official.
*   **Typical Errors:**
    *   Apostille on a *Notarized Copy* instead of the *Original* (some countries reject copies).
    *   Scanning only the stamp without the document it validates.

### 3.6. Notarized Translations / Нотариальные Переводы
*   **Description:** Official translation of Diploma, Passport, etc., into English (or target language).
*   **Format:** PDF.
*   **Advice (Instruction):**
    1.  Go to a licensed Translation Bureau.
    2.  Request "Notarized Translation" (Perevod s zavereniem).
    3.  The translator signs, and the Notary certifies the signature.
    4.  Must be bound (sewn) to a copy of the original document.
*   **Validation (Checklist):**
    *   [ ] Notary's stamp and seal.
    *   [ ] Translator's signature.
    *   [ ] Stitching/Binding integrity shown in scan.
    *   [ ] Correct spelling of Names (Must match Passport exactly).
*   **Typical Errors:**
    *   Name spelling mismatch (e.g., "Alexey" vs "Aleksei").
    *   Plain translation without Notary seal.
    *   Translating the Apostille stamp incorrectly.

### 3.7. Language Certificate / Сертификат (IELTS/TOEFL)
*   **Description:** Proof of English proficiency.
*   **Format:** PDF (Digital Certificate or Scan).
*   **Advice (Instruction):**
    1.  Register for the exam at British Council or IDP.
    2.  Take the exam and wait 13 days for results.
    3.  Download the "e-TRF" (Test Report Form) or scan the paper certificate.
*   **Validation (Checklist):**
    *   [ ] "Academic" module (not General Training).
    *   [ ] Test Report Form Number visible (for online verification).
    *   [ ] Note score validity (usually 2 years).
    *   [ ] Scores match minimum requirements (e.g., Overall 6.0).
*   **Typical Errors:**
    *   Expired certificate (>2 years).
    *   "General Training" module submitter.
    *   Screenshot of website results instead of official TRF.

### 3.8. Bank Statement / Справка из Банка (Proof of Funds)
*   **Description:** Financial guarantee for Visa/University.
*   **Format:** PDF.
*   **Advice (Instruction):**
    1.  Open your Banking App or visit a branch.
    2.  Request a "Certificate of Balance" (English language).
    3.  If possible, include "Transaction History" for 3-6 months.
    4.  Ensure currency equivalent is shown (USD/EUR).
*   **Validation (Checklist):**
    *   [ ] Issued on Bank Letterhead.
    *   [ ] Wet stamp or QR code for digital verification.
    *   [ ] Date of issue fresh (< 1 month).
    *   [ ] Sufficient amount covering tuition + living expenses.
*   **Typical Errors:**
    *   Statement in local language only (no English).
    *   Old statement (> 3 months).
    *   "Deposit Agreement" instead of "Balance Certificate".

---

## 4. Status Workflow

The system tracks the lifecycle of each document through the following statuses:

1.  **Ожидает (Pending)**
    *   **Meaning:** Task created, no file uploaded yet.
    *   **User Action:** User needs to click "Upload" and select a file.
    *   **System Action:** Timer running (if deadline exists).

2.  **На проверке (Under Review)**
    *   **Meaning:** File uploaded by Student. Waiting for Curator action.
    *   **User Action:** Locked (cannot edit unless retracted).
    *   **Curator Action:** Review file against Validation Checklist. Approve or Reject.

3.  **Требует доработки (Needs Revision)**
    *   **Meaning:** Curator rejected the document.
    *   **User Action:** Read comment (e.g., "Glare on photo"), delete old file, upload new one.
    *   **System Action:** Notification sent to Student.

4.  **Принято (Accepted)**
    *   **Meaning:** Document passed all specific checks.
    *   **User Action:** View only (cannot delete).
    *   **System Action:** File locked, XP awarded, logic proceeds to next step.
