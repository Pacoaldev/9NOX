# 9NOX Docker

Run 9NOX in an isolated container. 9NOX is a fork of [9Router](https://github.com/decolua/9router) with local development Compose configurations and isolated volumes.

---

# 👤 Quick Start (Development Compose)

Run the pre-configured isolated development container:

```bash
# Clone and build
git clone -b dev https://github.com/Pacoaldev/9NOX.git
cd 9NOX

# Set initial password and start on port 20120
INITIAL_PASSWORD="your-password" docker compose -f docker-compose.dev.yml up -d --build
```

Dashboard runs on port `20120`: http://localhost:20120

## Manage container

```bash
docker compose -f docker-compose.dev.yml logs -f    # view logs
docker compose -f docker-compose.dev.yml stop       # stop
docker compose -f docker-compose.dev.yml start      # start again
docker compose -f docker-compose.dev.yml down       # remove container
```

## Data persistence

```bash
-v "$HOME/.9router:/app/data" \
-e DATA_DIR=/app/data
```

Without `DATA_DIR`, the app falls back to `~/.9router/` (macOS/Linux) or `%APPDATA%\9router\` (Windows). In the container, `DATA_DIR=/app/data` makes the bind mount work.

Data layout under `$DATA_DIR/`:

```text
$DATA_DIR/
├── db/
│   ├── data.sqlite       # main SQLite database
│   └── backups/          # auto backups
└── ...                   # certs, logs, runtime configs
```

Host path: `$HOME/.9router/db/data.sqlite`
Container path: `/app/data/db/data.sqlite`

## Optional env vars

```bash
docker run -d \
  -p 20120:20120 \
  -v 9router-dev-data:/app/data \
  -e DATA_DIR=/app/data \
  -e PORT=20120 \
  -e HOSTNAME=0.0.0.0 \
  -e INITIAL_PASSWORD=123456 \
  --name 9nox-dev \
  9nox-9router-dev:latest
```

## Optional Headroom sidecar

The 9NOX image does not bundle Python or Headroom. To use Headroom in Docker, run it as a separate service and point 9NOX at that proxy:

```yaml
services:
  9nox:
    build: .
    ports:
      - "20120:20120"
    volumes:
      - 9router-dev-data:/app/data
    environment:
      DATA_DIR: /app/data
      PORT: "20120"
      HEADROOM_URL: http://headroom:8787
    depends_on:
      - headroom

  headroom:
    image: ghcr.io/chopratejas/headroom:latest
    ports:
      - "8787:8787"
```

In the dashboard, open `Endpoint` → `Token Saver` → `Headroom`, confirm the URL is `http://headroom:8787`, recheck status, then enable Headroom.

If Headroom runs on the Docker host instead of as a sidecar, use `http://host.docker.internal:8787` on macOS/Windows. On Linux, add `--add-host=host.docker.internal:host-gateway` or the equivalent compose `extra_hosts` entry.

---

# 🛠 For Developers

## Build image locally

```bash
# Build 9NOX development image
docker compose -f docker-compose.dev.yml build

# Or standard docker build
docker build -t 9nox .
```

The workflow rejects SemVer build metadata such as `v1.2.3+build.7` because the `+` form is not a valid Docker image tag. The git tag and both `package.json` versions must match exactly.

```bash
# Use scripts/release.js (recommended)
node scripts/release.js "Release title" "Notes"

# Or manually
git tag v0.5.81 && git push origin v0.5.81
```

To republish an existing tag, run the `Build and Push Docker Image` workflow manually and provide the exact tag, for example `v0.5.81`, in the `release_tag` input. Manual runs publish the numbered tag but leave `latest` unchanged by default:

```text
release_tag:     v0.5.81
promote_latest:  false
```

The `promote_latest` checkbox is an explicit opt-in for changing `latest`. Use it when a deliberate rollback or recovery should make that version the current default:

```text
release_tag:     v0.5.75
promote_latest:  true
```

Numbered image tags are mutable because a republish can replace their manifest. For a deployment that must be immutable, pin the image digest instead:

```bash
docker pull decolua/9router@sha256:<verified-digest>
```

The release workflow runs `/api/health` on each native `amd64` and `arm64` platform image before it uploads the digest artifact or assembles the multi-platform manifest. It then runs a second health check against the resolved version manifest before any requested `latest` promotion.

During recovery, the selected tag remains the application source while the Dockerfile from the workflow revision is used, so an older tag can be rebuilt with the current publishing fixes.

The workflow is tag-driven. Creating a git tag does not automatically create a GitHub Release, so the Releases page and the published package/image tags can be at different versions unless a maintainer creates a release separately.

The upstream repository needs these repository secrets for Docker Hub publishing:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

GHCR publishing uses the workflow's `GITHUB_TOKEN` with package write permission. Forks can publish to their own GHCR namespace, but Docker Hub publication is restricted to the upstream `decolua/9router` repository.

The optional repository variables `ALPINE_MIRROR` and `NPM_REGISTRY` can override the default package mirrors used by the CI Docker build.

Workflow: `.github/workflows/docker-publish.yml`
