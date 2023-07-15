# Start from the official Node.js LTS base image
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Install python and make, these are needed by node-gyp and the canvas package
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev jpeg-dev pango-dev giflib-dev

# Copy package.json and package-lock.json before other files
# Utilize Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy all files
COPY . .

# Build the application
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Run npm start script
CMD ["npm", "start"]
