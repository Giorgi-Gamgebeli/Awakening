FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install -g npm@11.6.2
RUN npm ci

EXPOSE 5173

CMD ["npm", "run", "dev", "--workspace=frontend", "--", "--host", "0.0.0.0"]