import fs from 'fs';
import {
    GetProjectDocument,
    GetJiraTitle,
} from './OpenRouterAICore/thirdPartyUtils';
import { GetStore } from './OpenRouterAICore/store/utils';
import { ENV_VARIABLES as GlobalENV } from './OpenRouterAICore/environment';
import { CustomError } from './OpenRouterAICore/customError';
import { logger } from 'OpenRouterAICore/pino';
import { ENV_VARIABLES } from './environment';
import * as path from 'path';

const writeToFile = (path: string, content: string) => {
    if (ENV_VARIABLES.LOCAL_MACHINE == "1") {
        fs.writeFileSync(path, content);
    }
}
const main = async (): Promise<string> => {
    let response = "";
    try {
        const ticketDetails: string = await GetJiraTitle();
        writeToFile('./tmp/' + GlobalENV.JIRA_TICKET_ID + '.txt', ticketDetails);

        const projectDocument: string = await GetProjectDocument(
            GlobalENV.PROJECT_DOCUMENT_PATH
        );
        writeToFile('./tmp/projectDocument.txt', projectDocument);

        const store = GetStore();
        await store.addDocument(GlobalENV.JIRA_PROJECT_KEY + '-index', projectDocument);

        let askPrompt: string = fs.readFileSync(__dirname + '/prompts/askprompt.txt').toString();
        askPrompt = askPrompt.replace("##JIRA_DETAILS##", ticketDetails);
        writeToFile('./tmp/prompt.txt', askPrompt);

        let storeResponse: string = await store.generate(
            GlobalENV.DEFAULT_MODEL.trim(),
            GlobalENV.JIRA_PROJECT_KEY + '-index',
            askPrompt.trim()
        );
        writeToFile('./tmp/output.md', storeResponse);

        const output = "./output_" + Date.now() + "/";
        const regex: RegExp = /```custom_code_for_backend([\s\S]*?)```/g;
        const match = storeResponse.match(regex);
        const regexFile = /---filePath:([\s\S]*?)---/g;
        if (match) {
            for (const aMatch of match) {
                const fileContent: string = aMatch.replace(/```custom_code_for_backend|```/g, '').trim();
                const m1 = fileContent.match(regexFile);
                if (m1) {
                    const fileName: string = m1[0].replace(/---filePath:|---/g, '').trim();
                    fs.mkdirSync(output + path.dirname(fileName), { recursive: true });
                    fs.writeFileSync(
                        output + fileName,
                        fileContent.replace(/---filePath:.*?---/g, '').trim()
                    );
                }
            }
        }
    } catch (error) {
        console.log(error);
        if (error instanceof CustomError) {
            response = `${error.toString()}`;
        } else if (error instanceof Error) {
            response = `❌ Action failed: ${error.message}`;
        } else {
            response = `❌ Action failed: ${String(error)}`;
        }
        logger.error(response);
    } finally {
        // Do not return from finally block
    }
    return response
}

main();