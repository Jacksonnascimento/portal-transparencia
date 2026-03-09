# 1. Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app

# Recebe a variável do GitHub Actions
ARG NEXT_PUBLIC_API_URL
# Transforma o ARG em ENV para o Next.js enxergar durante o 'npm run build'
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install
COPY . .

RUN mkdir -p public
RUN npm run build

# 2. Estágio de Execução
FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]