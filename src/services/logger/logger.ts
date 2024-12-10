import fs from 'fs';
import path from 'path';
import { format } from 'util';
import { LoggerOptions, LogLevel, LogTransport } from './types';
import { LogLevelColors } from './constants';

export class Logger implements LogTransport {
    private static instance: Logger;
    private context?: string;
    private logToFile: boolean;
    private currentLogLevel: LogLevel;
    private maxLogFiles: number;
    private maxLogSize: number;
    private logDir: string;

    constructor(options: LoggerOptions = {}) {
        this.context = options.context;
        this.logToFile = options.logToFile || false;
        this.currentLogLevel = options.logLevel || LogLevel.INFO;
        this.maxLogFiles = options.maxLogFiles || 5;
        this.maxLogSize = options.maxLogSize || 10 * 1024 * 1024; // 10MB default
        this.logDir = path.resolve(process.cwd(), 'logs');

        // Ensure logs directory exists
        if (this.logToFile) {
            this.ensureLogDirectoryExists();
        }
    }

    public static getInstance(options: LoggerOptions = {}): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(options);
        }
        return Logger.instance;
    }

    private ensureLogDirectoryExists(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    private rotateLogFiles(logType: 'app' | 'error'): void {
        const logFiles = fs
            .readdirSync(this.logDir)
            .filter(
                (file) =>
                    file.startsWith(`${logType}-`) && file.endsWith('.log'),
            )
            .map((file) => path.join(this.logDir, file))
            .sort(
                (a, b) =>
                    fs.statSync(b).mtime.getTime() -
                    fs.statSync(a).mtime.getTime(),
            );

        // Rotate log files
        if (logFiles.length >= this.maxLogFiles) {
            const filesToRemove = logFiles.slice(this.maxLogFiles - 1);
            filesToRemove.forEach((file) => fs.unlinkSync(file));
        }
    }

    private writeToFile(message: string, logType: 'app' | 'error'): void {
        const logFileName = `${logType}-${
            new Date().toISOString().split('T')[0]
        }.log`;
        const logPath = path.join(this.logDir, logFileName);

        // Rotate logs if needed
        this.rotateLogFiles(logType);

        // Check if log file exceeds max size
        if (
            fs.existsSync(logPath) &&
            fs.statSync(logPath).size > this.maxLogSize
        ) {
            this.rotateLogFiles(logType);
        }

        // Append log message
        fs.appendFileSync(logPath, message + '\n', 'utf8');
    }

    private currentTime() {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    }

    private formatMessage(
        level: LogLevel,
        ...args: any[]
    ): { consoleMessage: string; fileMessage: string } {
        const timestamp = this.currentTime()
        const context = this.context ? `${this.context} ` : '';
        const formattedArgs = args.map((arg) =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg,
        );
        const message = format(...formattedArgs);

        const consoleMessage = `${LogLevelColors[level]}${timestamp} | ${context}| ${level} | ${message}\x1b[0m`;
        const fileMessage = `${timestamp} | ${context}| ${level} | ${message}`;

        return { consoleMessage, fileMessage };
    }

    public log(level: LogLevel, ...args: any[]): void {
        // Only log if current log level is less or equal to the message level
        // if (
        //     this.getLevelPriority(level) <
        //     this.getLevelPriority(this.currentLogLevel)
        // ) {
        //     return;
        // }

        const { consoleMessage, fileMessage } = this.formatMessage(
            level,
            ...args,
        );

        // Console output
        switch (level) {
            case LogLevel.DEBUG:
                console.log(consoleMessage);
                break;
            case LogLevel.INFO:
                console.log(consoleMessage);
                break;
            case LogLevel.WARN:
                console.warn(consoleMessage);
                break;
            case LogLevel.ERROR:
                console.error(consoleMessage);
                break;
            case LogLevel.FATAL:
                console.error(consoleMessage);
                break;
        }

        // File logging if enabled
        if (this.logToFile) {
            const logType =
                level === LogLevel.ERROR || level === LogLevel.FATAL
                    ? 'error'
                    : 'app';
            this.writeToFile(fileMessage, logType);
        }
    }

    private getLevelPriority(level: LogLevel): number {
        const priorities: Record<LogLevel, number> = {
            [LogLevel.DEBUG]: 0,
            [LogLevel.INFO]: 1,
            [LogLevel.WARN]: 2,
            [LogLevel.ERROR]: 3,
            [LogLevel.FATAL]: 4,
        };
        return priorities[level];
    }

    // Convenience methods
    public debug(...args: any[]): void {
        this.log(LogLevel.DEBUG, ...args);
    }

    public info(...args: any[]): void {
        this.log(LogLevel.INFO, ...args);
    }

    public warn(...args: any[]): void {
        this.log(LogLevel.WARN, ...args);
    }

    public error(...args: any[]): void {
        this.log(LogLevel.ERROR, ...args);
    }

    public fatal(...args: any[]): void {
        this.log(LogLevel.ERROR, ...args);
    }
}

export { LogLevel };
