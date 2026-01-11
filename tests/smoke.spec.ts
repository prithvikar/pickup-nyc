import { test, expect } from '@playwright/test';

/**
 * Smoke Test Suite for Pickup NYC
 * Basic sanity checks to ensure the app loads correctly
 */

test.describe('Smoke Tests', () => {

    test('homepage loads successfully', async ({ page }) => {
        await page.goto('/');

        // Wait for the page to be fully loaded
        await page.waitForLoadState('networkidle');
    });

    test('page title is "Pickup NYC"', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle('Pickup NYC');
    });

    test('map component is visible', async ({ page }) => {
        await page.goto('/');

        // Wait for map container to be visible
        // The map uses Leaflet which renders in a div with class "leaflet-container"
        const mapContainer = page.locator('.leaflet-container');
        await expect(mapContainer).toBeVisible({ timeout: 10000 });
    });

    test('navbar exists and has navigation items', async ({ page }) => {
        await page.goto('/');

        // Check navbar is present
        const navbar = page.locator('nav');
        await expect(navbar).toBeVisible();

        // Check for navigation links
        await expect(page.getByRole('link', { name: /map/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /courts/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /check-in/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
    });

    test('courts page is accessible', async ({ page }) => {
        await page.goto('/courts');

        // Check for courts list heading
        const heading = page.getByRole('heading', { name: /all courts/i });
        await expect(heading).toBeVisible();
    });

    test('clicking a court expands the schedule', async ({ page }) => {
        await page.goto('/courts');

        // Click on the first court card
        const firstCourt = page.locator('button').filter({ hasText: /mccarren park/i }).first();
        await firstCourt.click();

        // Check that schedule grid appears
        const scheduleSection = page.locator('text=Daily Schedule');
        await expect(scheduleSection).toBeVisible({ timeout: 5000 });
    });
});
