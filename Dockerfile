FROM node:lts

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install
RUN npx playwright install
RUN npx playwright install-deps  


CMD ["node", "main.js"]
