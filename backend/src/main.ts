import { NestFactory } from '@nestjs/core';
import { AppModule } from ' ./app.module ';

async fuction bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enabeCors({ origin: 'http://localhost:3000' });
  await app.listen(process.env.PORT ?? 3001 );
}
bootstrap ();