import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;

    // Log the incoming request
    this.logger.log(`Request: ${method} ${originalUrl}`);

    // Log the response when it's finished
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(`Response: ${method} ${originalUrl} ${statusCode}`);
    });

    next();
  }
}