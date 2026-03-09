import { test, expect } from '@playwright/test';

test.describe('Enterprise AI & CRM Workflow', () => {
    const uniqueEmail = `admin_${Date.now()}@enterprise.com`;
    const password = 'Password123!';

    test('Full lifecycle: Register, Login, Create Customer and AI Brief', async ({ page }) => {
        // 1. Registration
        await page.goto('/');
        await page.click('text=Register Instance');

        await page.fill('input[placeholder="Your corporate name"]', 'AI Enterprise Corp');
        await page.fill('input[placeholder="John Doe"]', 'Lead Executive');
        await page.fill('input[placeholder="john@company.com"]', uniqueEmail);
        await page.fill('input[placeholder="Min. 8 characters"]', password);
        await page.click('button:has-text("Create account")');

        // Should auto-login and show dashboard
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('h1')).toContainText('Dashboard');

        // 2. Customer Creation
        await page.click('nav >> text=Customers');
        await expect(page.locator('h1')).toContainText('Customers');

        await page.click('button:has-text("New Customer")');
        const clientName = `Strategic Partner ${Date.now()}`;
        await page.fill('input[placeholder="e.g. John Doe"]', clientName);
        await page.fill('input[placeholder="e.g. Acme Corp"]', 'Strategic Dynamics');
        await page.fill('input[placeholder="john@example.com"]', 'contact@strategic.com');
        await page.click('button:has-text("Create Customer")');

        // Verify client appears in table
        await expect(page.locator(`text=${clientName}`)).toBeVisible();

        // 3. AI Briefing Flow
        const briefButton = page.locator('button[title="AI Executive Brief"]').first();
        await expect(briefButton).toBeVisible();
        await briefButton.click();

        // Verify Modal opens and loading state appears
        await expect(page.locator('text=Analyzing history and drafting brief...')).toBeVisible();

        // Wait for AI response (even if it's the mock/fallback)
        await expect(page.locator('text=Resumen de')).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Contexto Actual')).toBeVisible();

        await page.click('button:has-text("Close Brief")');
        await expect(page.locator('text=AI Executive Brief')).not.toBeVisible();
    });
});
