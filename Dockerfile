FROM node:lts


COPY package.json .

RUN npm install
RUN npm install discord.js@latest
RUN npx playwright install
RUN npx playwright install-deps  
# Create the bot's directory
RUN mkdir -p /src
WORKDIR /src
COPY . /src


# Start the bot.
CMD ["node", "src/main.js"]