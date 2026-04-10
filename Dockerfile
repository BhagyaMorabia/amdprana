# Base image for building the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files and build the project
COPY . .

# Firebase configuration variables
ARG VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID

# Other external APIs
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ARG VITE_USDA_API_KEY
ENV VITE_USDA_API_KEY=$VITE_USDA_API_KEY

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
