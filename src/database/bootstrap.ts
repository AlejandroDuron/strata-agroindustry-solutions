import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { seedDatabase } from './seed';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const isFresh = process.argv.includes('--fresh');

  if (isFresh) {
    console.log('Dropping all tables...');
    // Connect directly without synchronize to drop the database first
    const tempDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'strata_agroindustry',
      synchronize: false,
    });
    await tempDataSource.initialize();
    await tempDataSource.dropDatabase();
    await tempDataSource.destroy();
    console.log('Database dropped.');
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  if (isFresh) {
    console.log('Database recreated from scratch.');
  }

  await seedDatabase(dataSource);
  await app.close();
}

bootstrap();
