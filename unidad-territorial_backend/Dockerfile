# Usa la imagen oficial de Node
FROM node:18

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copia package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del backend
COPY . .

# Expone el puerto del backend
EXPOSE 4000

# Comando para iniciar el backend
CMD ["node", "index.js"]
