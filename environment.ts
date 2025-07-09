import fs from 'fs';
import { config } from 'dotenv';
import { logger } from 'OpenRouterAICore/pino';

if (fs.existsSync('.env')) {
    logger.info('Loading env file from .env');
    config({ path: '.env' });
}
if (process.env.NODE_ENV != '' && fs.existsSync(`.env.${process.env.NODE_ENV}`)) {
    logger.info(`Loading env file from .env.${process.env.NODE_ENV}`);
    config({ path: `.env.${process.env.NODE_ENV}` });
} else {
    logger.info(`stage not set.`);
}

export const ENV_VARIABLES = {
    LOCAL_MACHINE: process.env.LOCAL_MACHINE ?? '0'
}