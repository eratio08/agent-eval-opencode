# Using Docker Sandbox with agent-eval

This guide explains how to set up Docker for running evals locally. Docker is an alternative to Vercel Sandbox that runs on your own machine.

## When to Use Docker vs Vercel Sandbox

| Feature | Docker | Vercel Sandbox |
|---------|--------|----------------|
| **Setup** | Requires Docker installed locally | Requires Vercel account + token |
| **Cost** | Free (uses your machine) | May incur Vercel usage costs |
| **Speed** | Depends on your machine | Fast, cloud-based |
| **Network** | Full internet access | Sandboxed network |
| **Best for** | Local development, CI/CD | Production, benchmarks |

## How It Works

agent-eval automatically detects which sandbox to use:

1. **If `VERCEL_TOKEN` or `VERCEL_OIDC_TOKEN` is set** → Uses Vercel Sandbox
2. **Otherwise** → Uses Docker Sandbox

You can override this with `SANDBOX_BACKEND=docker` or `SANDBOX_BACKEND=vercel`.

## Installing Docker

### macOS

The easiest way is to install Docker Desktop:

```bash
# Using Homebrew (recommended)
brew install --cask docker
```

**Or download directly:**
1. Go to https://www.docker.com/products/docker-desktop
2. Download "Docker Desktop for Mac"
3. Open the `.dmg` file and drag Docker to Applications
4. Open Docker from Applications

**After installation:**
- Docker Desktop will appear in your menu bar (whale icon)
- Wait for it to say "Docker Desktop is running"
- This may take a minute on first launch

**Verify it's working:**
```bash
docker --version
# Docker version 24.x.x, build xxxxx

docker run hello-world
# Should print "Hello from Docker!"
```

### Windows

1. **Check Windows version:**
   - Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041+)
   - Windows 11 64-bit: Any edition
   - For Windows 10 Home, you need WSL 2

2. **Install WSL 2 (if not already installed):**
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   ```
   Restart your computer after this.

3. **Install Docker Desktop:**
   - Download from https://www.docker.com/products/docker-desktop
   - Run the installer
   - Select "Use WSL 2 instead of Hyper-V" when prompted
   - Restart if prompted

4. **Start Docker Desktop:**
   - Find Docker Desktop in Start Menu
   - Wait for "Docker Desktop is running" in the system tray

**Verify it's working:**
```powershell
docker --version
docker run hello-world
```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# IMPORTANT: Log out and log back in for group changes to take effect
# Or run: newgrp docker
```

**Verify it's working:**
```bash
docker --version
docker run hello-world
```

### Linux (Fedora/RHEL/CentOS)

```bash
# Install Docker
sudo dnf install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and log back in
```

## Troubleshooting

### "Cannot connect to the Docker daemon"

**On macOS/Windows:**
- Make sure Docker Desktop is running (check for the whale icon in menu bar/system tray)
- Try restarting Docker Desktop

**On Linux:**
```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if it's not running
sudo systemctl start docker
```

### "permission denied while trying to connect to the Docker daemon socket"

**On Linux:**
```bash
# Add yourself to the docker group
sudo usermod -aG docker $USER

# Then log out and log back in
# Or run this to apply immediately (for current terminal):
newgrp docker
```

### "image not found" or slow first run

The first time you run an eval with Docker, it needs to download the Node.js image (~200MB). This is normal and only happens once. Subsequent runs will be fast.

### "no space left on device"

Docker images can take up disk space. Clean up unused images:

```bash
# Remove unused images, containers, and volumes
docker system prune -a

# Check how much space Docker is using
docker system df
```

### Docker Desktop uses too much memory/CPU

You can limit resources in Docker Desktop:
1. Open Docker Desktop
2. Go to Settings (gear icon)
3. Select "Resources"
4. Adjust Memory and CPU limits
5. Click "Apply & Restart"

## Usage Examples

### Running evals with Docker (automatic)

```bash
# If no VERCEL_TOKEN is set, Docker is used automatically
agent-eval my-experiment

# Output will show:
# Sandbox: docker (auto-detected: no VERCEL_TOKEN, using Docker)
```

### Explicitly using Docker

```bash
# Force Docker even if VERCEL_TOKEN is set
SANDBOX_BACKEND=docker agent-eval my-experiment

# Output will show:
# Sandbox: docker (explicit)
```

### Explicitly using Vercel Sandbox

```bash
# Force Vercel Sandbox
SANDBOX_BACKEND=vercel VERCEL_TOKEN=your-token agent-eval my-experiment

# Output will show:
# Sandbox: vercel (explicit)
```

## How Docker Sandbox Works Internally

When you run an eval with Docker:

1. **Container Creation** - Creates a new Docker container with Node.js 24
2. **File Upload** - Copies your fixture files into the container
3. **Dependencies** - Runs `npm install` inside the container
4. **Agent Execution** - Runs the AI agent (Claude Code, Codex, etc.)
5. **Validation** - Runs your EVAL.ts tests
6. **Cleanup** - Container is automatically removed

Each eval runs in complete isolation - containers don't share state.

## Testing & Development

### Testing Docker Sandbox

The project includes several test commands for verifying Docker sandbox functionality:

```bash
# Quick sanity check - runs basic Docker sandbox operations
npm run test:sandbox

# Run Docker-specific unit tests
npm run test:docker

# Run full integration tests with Docker sandbox
# (Requires AI_GATEWAY_API_KEY or other agent API keys)
npm run test:docker:integration

# Run integration tests (uses auto-detected sandbox)
npm run test:integration
```

### Manual Testing

You can also test the Docker sandbox manually:

```bash
# Test basic sandbox operations
npx tsx scripts/test-docker-sandbox.ts

# Test full eval flow with Docker (no API key needed)
SANDBOX_BACKEND=docker npx tsx scripts/test-docker-eval-flow.ts
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SANDBOX_BACKEND` | Force sandbox backend: `docker` or `vercel` |
| `VERCEL_TOKEN` | Vercel API token (auto-selects Vercel sandbox if set) |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC token (for CI/CD) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key |
| `ANTHROPIC_API_KEY` | Direct Anthropic API key |
| `OPENAI_API_KEY` | Direct OpenAI API key |

## FAQ

**Q: Is Docker free?**
A: Yes, Docker Desktop is free for personal use and small businesses. Docker Engine on Linux is completely free.

**Q: How much disk space does Docker need?**
A: The Node.js image is about 200MB. Each eval uses temporary containers that are cleaned up automatically.

**Q: Can I use Docker in CI/CD?**
A: Yes! Docker is available in most CI environments (GitHub Actions, GitLab CI, etc.). Just make sure the Docker service is running.

**Q: Is Docker as secure as Vercel Sandbox?**
A: Docker provides good isolation, but Vercel Sandbox has additional security layers. For untrusted code, consider using Vercel Sandbox.

**Q: Why is the first run slow?**
A: Docker needs to download the Node.js image (~200MB) the first time. This is cached for future runs.
