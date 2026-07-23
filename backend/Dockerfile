FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

# Migrations + seed are run via docker-compose's command so this image
# can also be used standalone by running:
#   npx prisma migrate deploy && node dist/index.js
CMD ["node", "dist/index.js"]
