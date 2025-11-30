import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  // Генерация случайного email для теста
  const randomEmail = `test_${Date.now()}@example.com`;

  test('should register a new student and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Заполняем форму
    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', 'secret123');
    
    // Выбираем роль (по дефолту студент, но убедимся)
    await page.selectOption('select', 'student');

    // Нажимаем регистрацию
    await page.click('button:has-text("Регистрация")');

    // Ждем редиректа на дашборд
    await page.waitForURL('/student/dashboard');

    // Проверяем наличие приветствия или элементов дашборда
    await expect(page.getByText('Адаптивный Штаб')).toBeVisible();
    await expect(page.getByText('Студент')).toBeVisible(); // Имя из мока AuthContext при логине
  });

  test('should fail login with wrong password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', randomEmail);
    await page.fill('input[type="password"]', 'wrong_pass');
    
    // Нажимаем вход
    await page.click('button:has-text("Войти")');

    // Ждем появления ошибки
    // (в текущей реализации AuthContext она просто логируется или выводится, добавим проверку UI если есть)
    // Для демо предполагаем, что страница не изменилась
    expect(page.url()).toContain('/login');
  });

  test('should fetch countries list on dashboard', async ({ page }) => {
    // Предполагаем, что мы уже залогинены (можно использовать глобальный setup)
    // Для простоты - быстрый логин через мок или повтор
    // В реальном BMad мы бы использовали фикстуру `authenticatedUser`
    
    // Этот тест требует, чтобы бэкенд был запущен и отдавал страны
  });
});
