FROM node:latest

WORKDIR /Rosenbot-v2

COPY package.json /Rosenbot-v2
RUN npm install

COPY . /Rosenbot-v2

CMD ["node", "index.js"]
