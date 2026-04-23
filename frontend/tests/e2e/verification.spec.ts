import { test, expect } from '@playwright/test';

test.describe('PyCRM Elite: Multi-Tenant Isolation & AI Security', () => {
    
    test.beforeEach(async ({ page }) => {
        // Global timeout for complex AI/DB operations
        test.setTimeout(90000);
        
        // Ensure we start at the login page
        await page.goto('/');
    });

    test('Isolation Armor: Tenant A cannot see Tenant B data', async ({ page, browser }) => {
        // 1. Setup Tenant A
        const emailA = `test_a_${Date.now()}@pycrm.com`;
        const pass = 'SecurityArmor123!';
        
        await page.click('text=¿No tienes cuenta? Regístrate');
        await page.fill('input[placeholder="Nombre completo"]', 'Admin A');
        await page.fill('input[placeholder="correo@empresa.com"]', emailA);
        await page.fill('input[placeholder="Tu contraseña segura"]', pass);
        await page.fill('input[placeholder="Nombre de tu empresa"]', 'Tenant A Corp');
        await page.click('button:has-text("Crear cuenta")');
        
        await page.waitForURL('**/dashboard');
        
        // 2. Create a Client in Tenant A
        await page.click('nav >> text=Clientes');
        await page.click('button:has-text("Añadir")');
        const clientNameA = `Sensitive Client A - ${Date.now()}`;
        await page.fill('input[name="name"]', clientNameA);
        await page.fill('input[name="email"]', 'leak@prevent.com');
        await page.fill('input[name="company"]', 'A Corp');
        await page.click('button:has-text("Solidificar Cliente")');
        await expect(page.locator(`text=${clientNameA}`)).toBeVisible();
        
        const clientUrlA = page.url();

        // 3. Switch to Tenant B (New Context)
        const contextB = await browser.newContext();
        const pageB = await contextB.newPage();
        await pageB.goto('/');
        
        const emailB = `test_b_${Date.now()}@pycrm.com`;
        await pageB.click('text=¿No tienes cuenta? Regístrate');
        await pageB.fill('input[placeholder="Nombre completo"]', 'Admin B');
        await pageB.fill('input[placeholder="correo@empresa.com"]', emailB);
        await pageB.fill('input[placeholder="Tu contraseña segura"]', pass);
        await pageB.fill('input[placeholder="Nombre de tu empresa"]', 'Tenant B Corp');
        await pageB.click('button:has-text("Crear cuenta")');
        await pageB.waitForURL('**/dashboard');

        // 4. Attack: Tenant B tries to access Tenant A's Client URL directly
        await pageB.goto(clientUrlA);
        
        // The Multi-Tenant Interceptor should return 404 or redirect back
        // Based on our Prisma Extension, it will throw a 404 if not found in current tenant
        await expect(pageB.locator('text=Recurso no encontrado')).toBeVisible();
        
        await contextB.close();
    });

    test('AI Core: Verify SSE Client Briefing Streaming', async ({ page }) => {
        // 1. Auth & Navigate to Clients
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@saas.com'); // Using seed admin
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');
        
        await page.click('nav >> text=Clientes');
        // Click on the first available client
        await page.click('table tbody tr >> nth=0'); 

        // 2. Trigger AI Briefing
        await page.click('button:has-text("Generar Briefing IA")');
        
        // 3. Verify real-time streaming content
        const briefingContent = page.locator('.prose'); // Markdown container
        await expect(briefingContent).not.toBeEmpty();
        
        // Heuristic: check if AI mentioned the client name or summary
        await expect(briefingContent).toContainText('Briefing', { timeout: 30000 });
    });

    test('Command Bar: Verify Cmd+K Omni-search', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@saas.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');

        // 1. Open Command Bar
        const isMac = process.platform === 'darwin';
        const modifier = isMac ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+k`);
        
        await expect(page.locator('input[placeholder="Buscar comandos o recursos..."]')).toBeVisible();

        // 2. Navigate via search
        await page.fill('input[placeholder="Buscar comandos o recursos..."]', 'Ventas');
        await page.keyboard.press('Enter');

        // 3. Verify URL change
        await expect(page).toHaveURL(/.*pipeline/);
    });

    test('PWA: Verify Offline Mode Resilience', async ({ page, context }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@saas.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión")');

        // 1. Go Offline
        await context.setOffline(true);
        await page.reload(); // PWA should serve from cache

        // 2. Verify availability
        await expect(page.locator('nav')).toBeVisible();
        await expect(page.locator('text=Modo Offline')).toBeVisible();

        // 3. Back Online
        await context.setOffline(false);
        await page.reload();
        await expect(page.locator('text=Modo Offline')).not.toBeVisible();
    });
});
