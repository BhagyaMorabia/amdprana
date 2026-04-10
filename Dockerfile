# Base image for building the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files and build the project
COPY . .
RUN npm run build

# Stage 2: Serve the app with a lightweight Node server (or nginx)
FROM nginx:alpine

# Copy the built Vite app from builder stage to the default Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom nginx configuration to handle React Router properly
# (Cloud Run expects apps to listen on port 8080 by default)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 as that's what Cloud Run expects
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
