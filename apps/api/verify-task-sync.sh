#!/bin/bash
# Quick verification script for Task Sync Bug
# Usage: ./verify-taskSync.sh

echo "=== Task Sync Diagnostics ==="
echo ""

echo "1️⃣ Checking TaskTemplates by Country:"
psql $DATABASE_URL -c "
SELECT 
    country_id,
    COUNT(*) as template_count,
    STRING_AGG(DISTINCT stage, ', ') as stages
FROM task_template 
GROUP BY country_id 
ORDER BY country_id;
"

echo ""
echo "2️⃣ Checking Students and their Task counts:"
psql $DATABASE_URL -c "
SELECT 
    s.id,
    s.full_name,
    s.country_id,
    COUNT(t.id) as task_count
FROM student s
LEFT JOIN task t ON t.student_id = s.id
GROUP BY s.id, s.full_name, s.country_id
ORDER BY s.country_id, s.full_name;
"

echo ""
echo "3️⃣ Students with countryId='at' but 0 tasks (BUG CASES):"
psql $DATABASE_URL -c "
SELECT 
    s.id,
    s.full_name,
    s.country_id,
    s.created_at,
    COUNT(t.id) as task_count
FROM student s
LEFT JOIN task t ON t.student_id = s.id
WHERE s.country_id = 'at'
GROUP BY s.id, s.full_name, s.country_id, s.created_at
HAVING COUNT(t.id) = 0;
"

echo ""
echo "4️⃣ Sample Austrian TaskTemplates:"
psql $DATABASE_URL -c "
SELECT id, country_id, stage, title, xp_reward 
FROM task_template 
WHERE country_id = 'at' 
ORDER BY stage, id 
LIMIT 10;
"

echo ""
echo "✅ Diagnostics complete!"
echo ""
echo "Expected results:"
echo "- Austria (at) should have ~6 task templates"
echo "- All Austrian students should have 6 tasks"
echo "- Query #3 should return ZERO rows (no bug cases)"
