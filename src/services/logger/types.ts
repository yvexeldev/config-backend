export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
}

export interface LogTransport {
    log(message: string, level: LogLevel): void;
}

export interface LoggerOptions {
    context?: string;
    logToFile?: boolean;
    logLevel?: LogLevel;
    maxLogFiles?: number;
    maxLogSize?: number; // in bytes
}
