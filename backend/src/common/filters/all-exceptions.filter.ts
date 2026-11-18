import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';

const TITLES: Record<number, string> = {
  400: 'Solicitud inválida',
  401: 'No autorizado',
  403: 'Acceso denegado',
  404: 'No encontrado',
  413: 'Contenido demasiado grande',
  429: 'Demasiadas solicitudes',
  502: 'Servicio externo no disponible',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'No autorizado. Inicia sesión para continuar.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'No encontramos lo que buscas.',
  413: 'El archivo o la solicitud es demasiado grande.',
  429: 'Demasiadas solicitudes. Inténtalo de nuevo en un minuto.',
  502: 'Un servicio externo no respondió correctamente. Inténtalo de nuevo.',
};

// Mensajes en inglés que generan Nest, multer y el throttler
const ENGLISH_DEFAULT =
  /^(Unauthorized|Forbidden|Not Found|Bad Request|Too Many Requests|ThrottlerException.*|Cannot (GET|POST|PUT|PATCH|DELETE) .*)$/i;

const MULTER_MESSAGES: Record<string, string> = {
  'File too large': 'El archivo supera el tamaño máximo permitido.',
  'Unexpected field': 'Se recibió un archivo en un campo no esperado.',
  'Too many files': 'Se enviaron demasiados archivos a la vez.',
  'Too many parts': 'La solicitud tiene demasiadas partes.',
};

function translate(status: number, message: string): string {
  if (MULTER_MESSAGES[message]) return MULTER_MESSAGES[message];
  if (!message || ENGLISH_DEFAULT.test(message)) {
    return DEFAULT_MESSAGES[status] ?? 'Error en la solicitud.';
  }
  return message;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw : translate(status, raw ?? '');

      response
        .status(status)
        .json({ statusCode: status, error: TITLES[status] ?? 'Error', message });
      return;
    }

    // Errores inesperados: se registra solo el tipo (los mensajes pueden incluir datos de usuarios)
    const name = exception instanceof Error ? exception.name : 'UnknownError';
    const code =
      typeof exception === 'object' && exception !== null && 'code' in exception
        ? ` ${String((exception as { code: unknown }).code)}`
        : '';
    this.logger.error(`${request.method} ${request.path} -> ${name}${code}`);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: 500,
      error: 'Error interno',
      message: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.',
    });
  }
}
