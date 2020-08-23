FROM node:12-alpine

WORKDIR /src/app

COPY package.json .

COPY . .

RUN touch .env

RUN npm install --quiet --production --no-audit --no-optional

CMD ["node", "./server.js"]

EXPOSE 5000
