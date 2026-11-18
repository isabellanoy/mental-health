import { NestFactory } from '@nestjs/core';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup.js';

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let cached: Promise<NodeHandler> | undefined;

// Punto de entrada serverless de Vercel (GET /api responde { status: 'ok' }).
// La instancia de Nest se reutiliza entre invocaciones (warm start).
function getHandler(): Promise<NodeHandler> {
  cached ??= (async () => {
    const app = await NestFactory.create(AppModule);
    configureApp(app);
    await app.init();
    return app.getHttpAdapter().getInstance() as NodeHandler;
  })();
  return cached;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const server = await getHandler();
  server(req, res);
}
