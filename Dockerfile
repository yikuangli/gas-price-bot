FROM node:lts

# Create the bot's directory
RUN mkdir -p /src
WORKDIR /src

COPY package.json /src
RUN npm install

COPY . /src

# Start the bot.
CMD ["node", "main.js"]