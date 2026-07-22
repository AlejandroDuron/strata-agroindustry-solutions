import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { seedDatabase } from './seed';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const isFresh = process.argv.includes('--fresh');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  if (isFresh) {
    console.log('Dropping all tables...');
    await dataSource.dropDatabase();
    await dataSource.synchronize();
    console.log('Database recreated from scratch.');
  }

  await seedDatabase(dataSource);
  await app.close();
}

bootstrap();
