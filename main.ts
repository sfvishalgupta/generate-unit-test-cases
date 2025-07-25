import fs from "fs";
import {
  GetProjectDocument,
  GetJiraTitle,
  GetUserPrompt,
} from "./OpenRouterAICore/thirdPartyUtils";
import { GetStore } from "./OpenRouterAICore/store/utils";
import { ENV_VARIABLES as GlobalENV } from "./OpenRouterAICore/environment";
import { CustomError } from "./OpenRouterAICore/customError";
import { logger } from "OpenRouterAICore/pino";
import { ENV_VARIABLES } from "./environment";
import * as path from "path";

const output: string = "./output/" + Date.now();
const createOutputFilesBackend = (outFolder: string, storeResponse: string) => {
  logger.info(`Creating output files for Backend:- ${outFolder}`);
  const regex: RegExp = /```typescript([\s\S]*?)```/g;
  const match: RegExpMatchArray | null = storeResponse.match(regex);
  const regexFile: RegExp = /---filePath:([\s\S]*?)---/g;
  if (match) {
    for (const aMatch of match) {
      try {
        const fileContent: string = aMatch
          .replace(/```typescript|```/g, "")
          .trim();
        const m1 = fileContent.match(regexFile);
        if (m1) {
          for (const m of m1) {
            const fileName: string = m.replace(/---filePath:|---/g, "").trim();
            fs.mkdirSync(outFolder + path.dirname(fileName), {
              recursive: true,
            });
            fs.writeFileSync(
              outFolder + fileName,
              fileContent
                .split(`---filePath:${fileName}---`)[1]
                .split("---filePath")[0]
                .trim(),
              // fileContent.replace(/---filePath:.*?---/g, '').trim()
            );
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};

const logToFile = (path: string, content: string) => {
  if (ENV_VARIABLES.LOCAL_MACHINE == "1") {
    fs.writeFileSync(path, content);
  }
};
const main = async (): Promise<string> => {
  let response = "";
  try {
    const ticketDetails: string = await GetJiraTitle();
    logToFile("./tmp/" + GlobalENV.JIRA_TICKET_ID + ".txt", ticketDetails);

    const projectDocument: string = await GetProjectDocument(
      GlobalENV.PROJECT_DOCUMENT_PATH,
    );
    logToFile("./tmp/projectDocument.txt", projectDocument);

    const store = GetStore();
    await store.addDocument(
      GlobalENV.JIRA_PROJECT_KEY + "-index",
      projectDocument,
    );

    const promptFiles: string[] = GlobalENV.USE_FOR.split(",").map(a => {
      a = a.includes(".") ? a : a + '.txt';
      return a.trim()
    });

    for (const promptFile of promptFiles) {
      let askPrompt: string = await GetUserPrompt(promptFile);
      askPrompt = askPrompt.replace("##JIRA_DETAILS##", ticketDetails);
      logToFile("./tmp/prompt.txt", askPrompt);

      const modelArr: string[] = GlobalENV.OPEN_ROUTER_MODEL.trim().split(",");
      for (const model of modelArr) {
        logger.info(`For Model ${model.trim()}`);
        const storeResponse: string = await store.generate(
          model.trim(),
          GlobalENV.JIRA_PROJECT_KEY + "-index",
          askPrompt.trim(),
        );
        const outputFolder = output + "-" + model.trim().replace("/", "-") + "/";

        if (storeResponse.toLowerCase().includes("frontend")) {
          logToFile("./tmp/output-ui.md", storeResponse);
          createOutputFilesBackend(outputFolder + '/ui/', storeResponse);
          // createOutputFilesFrontend(outputFolder + '/ui/', storeResponse);
        } else {
          logToFile("./tmp/output-api.md", storeResponse);
          createOutputFilesBackend(outputFolder + '/api/', storeResponse);
        }
      }
    }
  } catch (error) {
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
  return response;
};

main();
