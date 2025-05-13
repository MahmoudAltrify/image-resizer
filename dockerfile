# Dockerfile
FROM public.ecr.aws/lambda/nodejs:18

# Install ImageMagick
RUN yum install -y ImageMagick && yum clean all

# Set working directory
WORKDIR /var/task

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Set default command
CMD ["src/handler.resizeImage"]