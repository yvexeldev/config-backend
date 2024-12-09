import { LogLevel } from './types';

export const LogLevelColors: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[37m', // White
    [LogLevel.INFO]: '\x1b[32m', // Green
    [LogLevel.WARN]: '\x1b[33m', // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[41m', // Red Background
};
