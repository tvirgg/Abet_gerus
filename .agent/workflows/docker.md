---
description: Build and run Docker containers
---

# Docker Workflow

This workflow builds and runs the application using Docker.

## Steps

1. **Build Docker images**
   ```bash
   docker-compose build
   ```

2. **Start containers**
   ```bash
   docker-compose up -d
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop containers**
   ```bash
   docker-compose down
   ```

## Rebuild and Restart

If you need to rebuild and restart:

```bash
docker-compose down
docker-compose up -d --build
```

## Notes
- Make sure Docker and Docker Compose are installed
- The `-d` flag runs containers in detached mode
- Use `docker-compose logs -f [service-name]` to view logs for a specific service
- Check `docker-compose.yml` for service configurations
