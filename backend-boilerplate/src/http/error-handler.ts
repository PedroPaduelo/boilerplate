import type { FastifyInstance } from 'fastify';
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { ZodError, z } from 'zod';
import { generateErrorMessage } from 'zod-error';

import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/http/routes/_errors';

type FastifyErrorHandler = FastifyInstance['errorHandler'];

const ErrorSchema = z.object({
  error: z.object({
    code: z.enum(['unprocessable_entity']),
    message: z.string({
      description: 'A human readable error message.',
    }),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

export function fromZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: 'unprocessable_entity',
      message: generateErrorMessage(error.issues, {
        maxErrors: 1,
        delimiter: {
          component: ': ',
        },
        path: {
          enabled: true,
          type: 'objectNotation',
          label: '',
        },
        code: {
          enabled: true,
          label: '',
        },
        message: {
          enabled: true,
          label: '',
        },
      }),
    },
  };
}

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  // Zod Fastify schema validation errors
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.validation.map((e) => ({
        message: e.message,
        path: e.params.issue.path.join('.'),
      })),
    });
  }

  // Zod errors
  if (error instanceof ZodError) {
    return reply.status(422).send(fromZodError(error));
  }

  // Custom errors
  if (error instanceof BadRequestError) {
    return reply.status(400).send({ message: error.message });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({ message: error.message });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    return reply.status(404).send({ message: error.message });
  }

  // Log error for debugging - only in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Unhandled error:', error);
    if (typeof error === 'object' && error !== null && 'stack' in error) {
      console.error('Stack:', error.stack);
    }
  } else {
    // Production: log minimal info without sensitive details
    console.error(`[${new Date().toISOString()}] Error: ${error.name} - ${error.message}`);
  }

  // Generic error response
  return reply.status(500).send({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null && 'message' in error && { error: String(error.message) }),
  });
};
