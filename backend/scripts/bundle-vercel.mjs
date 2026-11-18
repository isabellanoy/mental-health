import { build } from 'esbuild';

// Empaqueta Nest en un único ESM: el cargador de Vercel no soporta require() de ESM (@nestjs/throttler es CJS).
await build({
  entryPoints: ['dist-vercel/vercel.js'],
  outfile: 'api/index.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  sourcemap: false,
  external: ['pg-native', '@nestjs/microservices', '@nestjs/websockets', '@nestjs/platform-socket.io', 'class-transformer/storage', '@fastify/static', '@nestjs/mapped-types'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
});
