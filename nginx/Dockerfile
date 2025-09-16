# Nginx Dockerfile for RemoteHive
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy SSL certificates if they exist
COPY ssl/ /etc/nginx/ssl/

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/log/nginx

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx

# Expose port 80 and 443
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]