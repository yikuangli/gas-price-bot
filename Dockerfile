FROM node:lts

# Create the bot's directory
RUN mkdir -p /src
WORKDIR /src

COPY package.json /src
RUN npm install
RUN npm install discord.js@latest
RUN npx playwright install
RUN npx playwright install-deps  

COPY . /src

# Start the bot.
CMD ["node", "main.js"]