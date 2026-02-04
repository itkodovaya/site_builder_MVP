/**
 * Logger
 * Structured logging using Pino
 */

import pino from 'pino';

export interface LoggerConfig {
  level: string;
  prettyPrint?: boolean;
}

export function createLogger(config: LoggerConfig) {
  return pino({
    level: config.level,
    transport: config.prettyPrint
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  });
}
