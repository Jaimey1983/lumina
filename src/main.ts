import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') || 'http://localhost:3001',
    credentials: true,
  });

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  console.log(`🚀 Lumina Backend corriendo en puerto ${port}`);
}

void bootstrap();
