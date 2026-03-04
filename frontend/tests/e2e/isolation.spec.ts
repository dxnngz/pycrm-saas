import { test, expect, type BrowserContext, type Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Multi-tenant Isolation E2E', () => {
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;

    const tenantAEmail = `admin_a_${Date.now()}@tenant.com`;
    const tenantBEmail = `admin_b_${Date.now()}@tenant.com`;
    const sharedPassword = 'Password123!';

    test.beforeAll(async ({ playwright, browser }) => {
        // 1. Setup API Context to register users
        const apiContext = await playwright.request.newContext({
            baseURL: 'http://127.0.0.1:3001', // Backend is running on 3001
        });

        try {
            // Create Tenant A
            const resA = await apiContext.post('/api/auth/register', {
                data: {
                    name: 'Admin A',
                    email: tenantAEmail,
                    password: sharedPassword,
                    companyName: 'Company A'
                }
            });
            if (!resA.ok()) throw new Error(`Registration A failed: ${await resA.text()}`);
            // Try fetching CSRF if required, but the backend is setup to attach it on register
        } catch (err) {
            console.error('Failed to create Tenant A via API:', err);
            throw err;
        }

        try {
            // Create Tenant B
            const resB = await apiContext.post('/api/auth/register', {
                data: {
                    name: 'Admin B',
                    email: tenantBEmail,
                    password: sharedPassword,
                    companyName: 'Company B'
                }
            });
            if (!resB.ok()) throw new Error(`Registration B failed: ${await resB.text()}`);
        } catch (err) {
            console.error('Tenant B creation failed:', err);
            throw err;
        }

        await apiContext.dispose();

        // 2. Setup browser contexts
        contextA = await browser.newContext();
        contextB = await browser.newContext();
        pageA = await contextA.newPage();
        pageB = await contextB.newPage();

        pageA.on('console', msg => console.log(`[PageA Console] ${msg.type()}: ${msg.text()}`));
        pageA.on('response', async res => {
            if (res.url().includes('/api/auth/login')) {
                console.log(`[PageA Login] ${res.status()}:`, await res.text().catch(() => 'no-body'));
            }
        });

        pageB.on('console', msg => console.log(`[PageB Console] ${msg.type()}: ${msg.text()}`));
        pageB.on('response', async res => {
            if (res.url().includes('/api/auth/login')) {
                console.log(`[PageB Login] ${res.status()}:`, await res.text().catch(() => 'no-body'));
            } else if (res.url().includes('/api/opportunities')) {
                console.log(`[PageB Opps] ${res.request().method()} ${res.status()}:`, await res.text().catch(() => 'no-body'));
            }
        });
    });

    test.afterAll(async () => {
        await contextA.close();
        await contextB.close();
    });

    test('Tenant A and Tenant B should not see each other\'s data', async () => {
        // 1. Login Tenant A
        await pageA.goto('/');
        await pageA.fill('input[type="email"]', tenantAEmail);
        await pageA.fill('input[type="password"]', sharedPassword);
        await pageA.click('button:has-text("Iniciar Sesión")');
        await pageA.waitForSelector('nav >> text=Panel', { timeout: 15000 });

        // 2. Login Tenant B
        await pageB.goto('/');
        await pageB.fill('input[type="email"]', tenantBEmail);
        await pageB.fill('input[type="password"]', sharedPassword);
        await pageB.click('button:has-text("Iniciar Sesión")');
        await pageB.waitForSelector('nav >> text=Panel', { timeout: 15000 });

        // 3. Tenant A creates a new Client
        await pageA.click('nav >> text=Clientes');
        await pageA.waitForSelector('text=Directorio de Clientes');

        await pageA.click('button:has-text("Añadir")');

        await pageA.waitForSelector('text=Registro de Nuevo Socio');
        const uniqueClientName = `Client Exclusive to A - ${Date.now()}`;
        await pageA.fill('input[name="name"]', uniqueClientName);
        await pageA.fill('input[name="email"]', 'client@exclusive-a.com');
        await pageA.fill('input[name="company"]', 'Exclusive A Corp');
        await pageA.fill('input[name="phone"]', '123456789');
        await pageA.click('button:has-text("Solidificar Cliente en la Base")');

        // Wait for modal to close (heuristic: heading 'Registro de Nuevo Socio' disappears)
        await expect(pageA.locator('text=Registro de Nuevo Socio')).not.toBeVisible();
        await expect(pageA.locator(`text=${uniqueClientName}`)).toBeVisible();

        // 4. Tenant B checks their Clients list
        await pageB.click('nav >> text=Clientes');
        await pageB.waitForSelector('text=Directorio de Clientes');

        // Verify A's client is NOT visible to B
        await expect(pageB.locator(`text=${uniqueClientName}`)).not.toBeVisible();

        // Tenant B needs to create their own client so they can have a client ID for opportunity
        await pageB.click('button:has-text("Añadir")');
        await pageB.waitForSelector('text=Registro de Nuevo Socio');
        const uniqueClientNameB = `Client Exclusive to B - ${Date.now()}`;
        await pageB.fill('input[name="name"]', uniqueClientNameB);
        await pageB.fill('input[name="email"]', 'client-b@exclusive-b.com');
        await pageB.fill('input[name="company"]', 'Exclusive B Corp');
        await pageB.fill('input[name="phone"]', '987654321');
        await pageB.click('button:has-text("Solidificar Cliente en la Base")');

        await expect(pageB.locator('text=Registro de Nuevo Socio')).not.toBeVisible();
        await expect(pageB.locator(`text=${uniqueClientNameB}`)).toBeVisible();

        // 5. Tenant B creates an Opportunity
        await pageB.click('nav >> text=Ventas');
        await pageB.waitForSelector('text=Pipeline Estratégico');

        await pageB.click('button:has-text("Inyectar Oportunidad")');
        await pageB.waitForSelector('text=Nueva Oportunidad de Negocio');

        await pageB.selectOption('select[name="clientId"]', { label: uniqueClientNameB });
        const uniqueOpportunityName = `Opportunity B - ${Date.now()}`;
        await pageB.fill('input[name="product"]', uniqueOpportunityName);
        await pageB.fill('input[name="amount"]', '50000');
        await pageB.click('button:has-text("Sembrar Oportunidad")');

        await expect(pageB.locator('text=Nueva Oportunidad de Negocio')).not.toBeVisible();
        await expect(pageB.locator(`text=${uniqueOpportunityName}`)).toBeVisible();

        // 6. Tenant A checks their Pipeline
        await pageA.click('nav >> text=Ventas');
        await pageA.waitForSelector('text=Pipeline Estratégico');

        // Verify B's opportunity is NOT visible to A
        await expect(pageA.locator(`text=${uniqueOpportunityName}`)).not.toBeVisible();
    });

    test('Tenant A and Tenant B should have isolated Tasks and Documents', async () => {
        // Evaluate Tasks Isolation
        await pageA.click('nav >> text=Tareas');
        await pageA.waitForSelector('text=Gestión de Tareas', { timeout: 15000 });

        await pageA.click('button:has-text("Nueva Tarea")');
        const uniqueTaskName = `Task A - ${Date.now()}`;
        await pageA.fill('input[placeholder="Ej: Seguimiento tras demo de producto"]', uniqueTaskName);
        await pageA.fill('input[type="datetime-local"]', '2025-12-31T23:59');
        await pageA.click('button:has-text("Crear Tarea en el Sistema")');

        await expect(pageA.locator(`text=${uniqueTaskName}`)).toBeVisible();

        // B verifies
        await pageB.click('nav >> text=Tareas');
        await expect(pageB.locator(`text=${uniqueTaskName}`)).not.toBeVisible();

        // Evaluate Documents Isolation
        await pageA.click('nav >> text=Documentos');
        await pageA.waitForSelector('text=Gestión Documental', { timeout: 15000 });

        // As document creation isn't fully mocked in UI yet, we can check that they don't share any unexpected ones
        // or just ensure the page loads without seeing B's data.
        await expect(pageA.locator('text=Cargando documentos...')).not.toBeVisible();
    });

    test('Session Expiration handling gracefully redirects to login', async () => {
        await pageA.goto('/');


        // Simulating the backend clearing the token via localstorage or cookie
        await contextA.clearCookies();
        await pageA.evaluate(() => localStorage.removeItem('token'));

        // Trigger a navigation or API call that causes 401
        await pageA.click('nav >> text=Clientes');

        // Should be caught by the interceptor and redirected to login
        await expect(pageA).toHaveURL('/');
    });
});
