# US5.4: Secure File Storage (MinIO)

**Epic:** System Integrations
**Status:** Open

## Description
As a **System**, I want to store files securely in MinIO.

## Acceptance Criteria
- [ ] Files are uploaded to MinIO buckets structured by `{companyId}/{studentId}/...`
- [ ] Files are NOT accessible via public public URLs
- [ ] Access is granted only via generated presigned URLs with short expiration
