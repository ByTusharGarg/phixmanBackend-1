FROM node:14-alpine
WORKDIR /app
RUN npm install -g nodemon
COPY package.json .
RUN npm install
COPY .env.sample .env
COPY . .
CMD ["npm","start"]