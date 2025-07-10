import fs from 'fs';
import { config } from 'dotenv';
import { logger } from 'OpenRouterAICore/pino';
import { CustomError } from 'OpenRouterAICore/customError';
import { ERRORS } from 'OpenRouterAICore/environment';


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
    LOCAL_MACHINE: process.env.LOCAL_MACHINE ?? '0',
    // OUTPUT_REPO: process.env.OUTPUT_REPO?.trim() ?? ''
}

// if(ENV_VARIABLES.OUTPUT_REPO === ''){
//     throw new CustomError(ERRORS.ENV_NOT_SET, 'OUTPUT_REPO not set.');
// }

