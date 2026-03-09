# 1. Estágio de Build (Instala e compila o Next.js)
FROM node:20-alpine AS build
WORKDIR /app

# Copia os arquivos de dependência e instala
COPY package*.json ./
RUN npm install

# Copia o resto do código do Admin
COPY . .

# TRUQUE: Garante que a pasta public exista para o próximo estágio não dar erro
RUN mkdir -p public

# Roda o build de produção do Next.js
RUN npm run build

# 2. Estágio de Execução (Roda o site pronto)
FROM node:20-alpine
WORKDIR /app

# Copia apenas o que importa do estágio anterior (deixa a imagem leve)
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# O Next.js roda na porta 3000 internamente (o Docker fará a ponte para a 3001)
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]