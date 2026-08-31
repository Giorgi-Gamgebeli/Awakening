import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: [env.VITE_WEB_BASE_URL],
    credentials: true,
  });

  await app.listen(env.SERVER_PORT);
}

bootstrap();