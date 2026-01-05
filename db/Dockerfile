FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

CMD ["npm", "run", "seed"]
