FROM node:14-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

EXPOSE 9000

CMD ["npm", "start"]
