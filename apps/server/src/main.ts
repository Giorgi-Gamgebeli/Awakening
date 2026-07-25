// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import * as trpcExpress from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:4200'],
  });

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: () => createContext(authService),
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
