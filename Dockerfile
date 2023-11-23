FROM node:lts

# Create the bot's directory
RUN mkdir -p /src
WORKDIR /src

COPY . /src
RUN npm install
RUN npm install discord.js@latest
RUN npx playwright install
RUN npx playwright install-deps  



# Start the bot.
CMD ["node", "main.js"]