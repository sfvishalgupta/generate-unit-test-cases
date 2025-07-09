pwd=$(pwd)
rm -rf cd ${pwd}/OpenRouterAICore
cd ${pwd} && git clone --branch=main --depth=1 https://github.com/sfvishalgupta/OpenRouterAICore.git ./OpenRouterAICore && rm -rf OpenRouterAICore/.git
cd ${pwd}/OpenRouterAICore && npm install
cd ${pwd} && rm -rf node_modules package-lock.json && npm install
cd ${pwd} && npm i