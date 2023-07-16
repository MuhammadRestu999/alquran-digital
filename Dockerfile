FROM node:latest

COPY . /app
WORKDIR /app
RUN npm install
RUN node fetch_data.js

EXPOSE 80

CMD ["node", "index"]
