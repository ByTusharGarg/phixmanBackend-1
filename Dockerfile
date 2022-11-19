FROM node:14-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
COPY .env.sample .env
CMD ["npm","start"]