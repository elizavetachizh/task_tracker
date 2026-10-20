import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { validationPipeOptions } from './validation-pipe.options.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
  });
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));

  await app.listen(config.get<string>('PORT') ?? 3000);
}
await bootstrap();
