import { Page } from '@playwright/test';

export async function mockAuthUser(page: Page, user: {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}) {
  // Create a full session object
  const session = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: {
        id: 'test-company-id',
        name: 'Test Company'
      }
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  // Mock all NextAuth related API calls
  await page.route('**/api/auth/session', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session)
    });
  });

  await page.route('**/api/auth/csrf', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'test-csrf-token' })
    });
  });

  await page.route('**/api/auth/providers', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        google: {
          id: 'google',
          name: 'Google',
          type: 'oauth',
          signinUrl: '/api/auth/signin/google',
          callbackUrl: '/api/auth/callback/google'
        }
      })
    });
  });

  // Set session cookies 
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: `test-session-${user.id}`,
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 24 * 60 * 60
    },
    {
      name: '__Secure-next-auth.session-token',
      value: `test-session-${user.id}`,
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 24 * 60 * 60,
      secure: true
    }
  ]);

  // Add init script to mock client-side session
  await page.addInitScript((sessionData) => {
    // Override any fetch calls to auth endpoints
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [resource] = args;
      if (typeof resource === 'string' && resource.includes('/api/auth/session')) {
        return Promise.resolve(new Response(JSON.stringify(sessionData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return originalFetch.apply(this, args);
    };
    
    // Store session in window for immediate access
    (window as any).__TEST_SESSION__ = sessionData;
  }, session);
}

export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });
}