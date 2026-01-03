import { test, expect } from '@playwright/test';

test.describe('Cascading Tasks Features', () => {

    test('Curator can create a student with University and Program selection', async ({ page }) => {
        // 1. Login as Curator
        await page.goto('/login');
        await page.fill('input[type="email"]', 'curator@abbit.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Войти")');

        await page.waitForURL('/curator/dashboard');

        // 2. Navigate to Students
        await page.goto('/curator/students');

        // 3. Open Create Modal
        await page.click('button:has-text("Новый студент")');

        // 4. Fill Basic Info
        await page.fill('input[type="text"][required]', 'Test Student Cascading');
        await page.fill('input[type="email"][required]', `test_cascading_${Date.now()}@example.com`);

        // 5. Select Country (Austria)
        // Find checkbox by label text
        const austriaParams = page.locator('label').filter({ hasText: 'Австрия' });
        await austriaParams.click();

        // 6. Verify Program Selection appears
        // Should see "University of Vienna" inside the program selector
        await expect(page.getByText('University of Vienna')).toBeVisible();

        // 7. Select a Program
        // Click on "Business Administration"
        await page.locator('label').filter({ hasText: 'Business Administration' }).click();

        // 8. Submit
        await page.click('button:has-text("Создать")');

        // 9. Verify success (modal closes or toast appears or list updates)
        await expect(page.locator('text=Test Student Cascading')).toBeVisible();
    });

    test('Student sees cascaded tasks', async ({ page }) => {
        // 1. Login as the student created above (requires knowing the password or creating one with known password)
        // For this test, let's assume we log in as the student from seed 'student@example.com' 
        // who corresponds to the seed data with Programs.

        await page.goto('/login');
        await page.fill('input[type="email"]', 'student@example.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button:has-text("Войти")');

        await page.waitForURL('/student/dashboard');

        // 2. Verify Program specific task exists
        // From seed: "Загрузить GMAT/GRE (Business)"
        await expect(page.getByText('Загрузить GMAT/GRE (Business)')).toBeVisible();

        // 3. Verify University specific task exists
        // From seed: "Регистрация в u:space (Vienna)"
        await expect(page.getByText('Регистрация в u:space (Vienna)')).toBeVisible();

        // 4. Verify Country specific task exists
        // From seed: "Загрузить скан загранпаспорта"
        await expect(page.getByText('Загрузить скан загранпаспорта')).toBeVisible();
    });
});
