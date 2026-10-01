import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: [env.VITE_WEB_BASE_URL],
    credentials: true,
  });

  await app.listen(env.SERVER_PORT);
}

bootstrap();
