import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';
import { ApiException } from './api-exception.js';
import type { ErrorDetail } from './api-exception.js';

export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') return value;
    const schema = (metadata.metatype as { schema?: ZodType } | undefined)?.schema;
    if (!schema) {
      throw new ApiException(500, { code: 'INTERNAL_ERROR', message: 'No se pudo completar la solicitud.', details: [] });
    }
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    const details: ErrorDetail[] = result.error.issues.flatMap(issue => {
      if (issue.code === 'unrecognized_keys') return issue.keys.map(field => ({ field, reason: 'Campo no admitido.' }));
      return [{ field: issue.path.map(String).join('.') || 'body', reason: issue.code === 'custom' ? issue.message : 'Dato obligatorio o tipo inválido.' }];
    });
    throw new ApiException(400, { code: 'INVALID_INPUT', message: 'Revisa los datos enviados.', details });
  }
}
