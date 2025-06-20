FROM denoland/deno:1.40.0

WORKDIR /app

# Copy the crawler service code
COPY . .

# Cache dependencies
RUN deno cache index.ts

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Run the service
CMD ["deno", "run", "--allow-all", "index.ts"]