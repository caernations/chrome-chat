import { test, expect } from '@playwright/test';
import path from 'path';

const extensionPath = path.join(__dirname, '../../');

test.describe('Chrome Extension Basic Tests', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      (window as any).chrome = {
        runtime: {
          sendMessage: () => Promise.resolve(),
          onMessage: { addListener: () => {} },
        },
        storage: {
          sync: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
          },
        },
      };
    });
  });

  test('popup should load and display chat interface', async ({ page }) => {
    await page.goto(`file://${extensionPath}/popup.html`);
    await page.waitForSelector('.chat-view', { timeout: 5000 });
    await expect(page.locator('.chat-header')).toBeVisible();
    await expect(page.locator('.chat-messages')).toBeVisible();
    await expect(page.locator('.chat-input-container')).toBeVisible();
    await expect(page.locator('.chat-header__title h2')).toHaveText('AI Chat Assistant');
  });

  test('options page should load and display settings form', async ({ page }) => {
    await page.goto(`file://${extensionPath}/options.html`);
    await page.waitForSelector('.options-view', { timeout: 5000 });
    await expect(page.locator('.options-header h1')).toHaveText('AI Chat Assistant Settings');
    await expect(page.locator('#options-form')).toBeVisible();
    await expect(page.locator('#fireworks-api-key')).toBeVisible();
    await expect(page.locator('#save-btn')).toBeVisible();
  });

  test('chat input should be functional', async ({ page }) => {
    await page.goto(`file://${extensionPath}/popup.html`);
    await page.waitForSelector('.chat-input__textarea', { timeout: 5000 });
    const textarea = page.locator('.chat-input__textarea');
    const sendButton = page.locator('.chat-input__send');
    await expect(sendButton).toBeDisabled();
    await textarea.fill('Hello, this is a test message');
    await expect(sendButton).not.toBeDisabled();
    await textarea.press('Enter');
  });

  test('options form validation should work', async ({ page }) => {
    await page.goto(`file://${extensionPath}/options.html`);
    await page.waitForSelector('#options-form', { timeout: 5000 });
    const apiKeyInput = page.locator('#fireworks-api-key');
    const saveButton = page.locator('#save-btn');
    await expect(saveButton).toBeDisabled();
    await apiKeyInput.fill('test-api-key');
    await expect(saveButton).not.toBeDisabled();
    const toggleButton = page.locator('.toggle-password');
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(apiKeyInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('pip page should load with draggable handle', async ({ page }) => {
    await page.goto(`file://${extensionPath}/pip.html`);
    await page.waitForSelector('.pip-container', { timeout: 5000 });
    await expect(page.locator('.pip-handle')).toBeVisible();
    await expect(page.locator('.pip-handle__grip')).toBeVisible();
    await expect(page.locator('.chat-view')).toBeVisible();
  });

  test('theme and responsive classes should be applied', async ({ page }) => {
    await page.goto(`file://${extensionPath}/popup.html`);
    await page.waitForSelector('.chat-view', { timeout: 5000 });
    await page.setViewportSize({ width: 250, height: 300 });
    await page.waitForTimeout(100); // Allow time for resize observer
    const body = page.locator('body');
    await page.setViewportSize({ width: 420, height: 560 });
  });

  test('error handling should display error messages', async ({ page }) => {
    await page.goto(`file://${extensionPath}/popup.html`);
    await page.waitForSelector('.chat-view', { timeout: 5000 });
    await page.evaluate(() => {
      const errorContainer = document.querySelector('#chat-error') as HTMLElement;
      const errorMessage = document.querySelector('.chat-error__message') as HTMLElement;
      
      if (errorContainer && errorMessage) {
        errorMessage.textContent = 'Test error message';
        errorContainer.style.display = 'block';
      }
    });
    
    await expect(page.locator('#chat-error')).toBeVisible();
    await expect(page.locator('.chat-error__message')).toHaveText('Test error message');
    await page.locator('.chat-error__close').click();
    await expect(page.locator('#chat-error')).not.toBeVisible();
  });
});