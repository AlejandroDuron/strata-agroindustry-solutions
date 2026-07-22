import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { randomBytes } from 'crypto';

/**
 * Counter to generate unique emails for each test user.
 */
let userCounter = 0;

/**
 * Registers a real user in the database via `POST /users` (as admin bootstrap)
 * or `POST /auth/register`, then logs in via `POST /auth/login` and returns
 * the real JWT access token.
 *
 * This ensures the token corresponds to an actual user in the DB and the full
 * auth pipeline (hashing, validation, JWT signing) is exercised.
 */
export async function loginAs(
  app: INestApplication,
  role: string,
): Promise<string> {
  userCounter++;
  const unique = randomBytes(4).toString('hex');
  const email = `testuser-${role}-${userCounter}-${unique}@test.local`;
  const password = 'TestPassword123!';

  // Create the user with the desired role via the admin endpoint
  // We need a bootstrap admin token first — use the first registered user approach
  if (role === 'operador') {
    // Register via public endpoint (always assigns 'operador')
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
  } else {
    // For non-operador roles, we need to create via POST /users with an admin token.
    // Bootstrap: create a temporary admin user directly in the DB, login, then create the target user.
    const adminToken = await getBootstrapAdminToken(app);

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password, role })
      .expect(201);
  }

  // Login to get a real token
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  // Retry once if we get 401 (rare timing issue with DB connection pool)
  if (loginResponse.status === 401) {
    await new Promise((r) => setTimeout(r, 50));
    const retryResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return retryResponse.body.access_token;
  }

  expect(loginResponse.status).toBe(200);
  return loginResponse.body.access_token;
}

/**
 * Returns the Authorization header value for a real user with the given role.
 */
export async function authHeader(
  app: INestApplication,
  role: string,
): Promise<string> {
  const token = await loginAs(app, role);
  return `Bearer ${token}`;
}

// ─── Bootstrap Admin ─────────────────────────────────────────────────────────

let cachedBootstrapAdminToken: string | null = null;
let cachedBootstrapAppRef: INestApplication | null = null;

/**
 * Creates a bootstrap admin user directly via the register + role promotion path,
 * so we can create users with arbitrary roles through the API.
 */
async function getBootstrapAdminToken(app: INestApplication): Promise<string> {
  // Reset cache if app reference changed (new test suite)
  if (cachedBootstrapAppRef !== app) {
    cachedBootstrapAdminToken = null;
    cachedBootstrapAppRef = app;
  }

  if (cachedBootstrapAdminToken) {
    return cachedBootstrapAdminToken;
  }

  const unique = randomBytes(4).toString('hex');
  const email = `bootstrap-admin-${unique}@test.local`;
  const password = 'BootstrapAdmin123!';

  // Register the user (will get 'operador' role)
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password })
    .expect(201);

  // Promote to admin directly in the DB (this is the only "shortcut" — unavoidable for bootstrapping)
  const dataSource = app.get(DataSource);
  await dataSource.query(
    `UPDATE "user" SET "roleId" = (SELECT id FROM "role" WHERE name = 'admin') WHERE email = $1`,
    [email],
  );

  // Login to get the admin token
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  cachedBootstrapAdminToken = loginResponse.body.access_token;
  return cachedBootstrapAdminToken!;
}

/**
 * Resets the cached bootstrap admin token.
 * Call this in `beforeEach` after cleaning the database.
 */
export function resetTokenCache(): void {
  cachedBootstrapAdminToken = null;
}
