import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { resetTokenCache } from './build-token';

/**
 * Creates a full NestJS application backed by a real PostgreSQL test database.
 * Use this in e2e tests instead of mocked repositories.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();
  return app;
}

/**
 * Truncates all tables in the test database, resetting auto-increment sequences.
 * Called between tests to ensure isolation.
 */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const entities = dataSource.entityMetadatas;

  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  if (tableNames.length > 0) {
    await dataSource.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }
}

/**
 * Seeds the roles table with the standard application roles.
 */
export async function seedRoles(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query(`
    INSERT INTO "role" (name, description)
    VALUES 
      ('admin', 'Full access'),
      ('gerente', 'Farm management'),
      ('operador', 'Operational recording'),
      ('auditor', 'Read-only reports')
    ON CONFLICT (name) DO NOTHING
  `);
}

/**
 * Full reset: truncates tables, seeds roles, and clears any cached auth tokens.
 * Use this in beforeEach for complete test isolation.
 */
export async function resetDatabase(app: INestApplication): Promise<void> {
  await cleanDatabase(app);
  await seedRoles(app);
  resetTokenCache();
}
