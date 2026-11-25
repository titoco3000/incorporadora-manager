// Lambda entry point (Function URL behind CloudFront). Bundled by `make build-api`.
import { handle } from 'hono/aws-lambda';
import { app } from './app.ts';

export const handler = handle(app);
