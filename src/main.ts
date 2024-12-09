import { Logger } from './services';

// Basic usage
const logger = new Logger({
    context: 'Main',
    logToFile: true,
});
logger.info('Application started');
logger.warn('Potential issue detected');
logger.error('Something went wrong');
