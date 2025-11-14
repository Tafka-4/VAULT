# VAULT

Cloud storage dashboard powered by Nuxt 3 with end‑to‑end encryption backed by the personal KMS located at `../kms`. The app now includes:

- Email/password auth with hashed credentials and HttpOnly sessions
- Server APIs for listing, uploading, deleting, and streaming encrypted files
- AES-256-GCM encryption via the external KMS (RSA key exchange & session tokens)
- Chunked storage backed by SQLite + local blobs, stored under `server/.data`
- Audio/video streaming from the encrypted store with HTTP range support
- Dynamic dashboard, search, upload queue, and preview screens wired to live data

## Getting Started

### Requirements

- Node.js 18+
- A base64url client token that matches the KMS whitelist

### Installation

```bash
npm install
cp .env.example .env
# edit .env with your KMS token/base URL and optional storage overrides
```

### Running VAULT

```bash
# from this repo
npm run dev
# open http://localhost:3000 (default Nuxt port) and register a user
```

### Building for production

```bash
npm run build
npm run preview
```

### Docker

Build and run both the VAULT app and the sibling KMS via Docker:

```bash
docker compose up --build
```

- The Nuxt server is exposed on `http://localhost:3000`.
- Encrypted blobs, the SQLite DB, and session store live in the container at `/data`, which is mounted to the host path `/mnt/data`. Adjust the bind mount in `docker-compose.yml` if your host does not expose `/mnt/data`.

To stop and remove containers:

```bash
docker compose down
```

## Environment Variables

See `.env.example` for full list. Key settings:

- `KMS_BASE_URL` – URL where the KMS service runs.
- `KMS_CLIENT_TOKEN` – base64url token used during RSA key exchange (must match KMS whitelist).
- `STORAGE_DATA_DIR` – directory for the SQLite DB + encrypted blobs (default `server/.data`).
- `STORAGE_SESSION_TTL_DAYS` – session lifetime.
- `REGISTRATION_SEED` – shared secret that seeds the deterministic verification-code generator.
- `CLOUDFLARE_TUNNEL_TOKEN` – required when using the Cloudflare tunnel compose file.

### Verification Codes

The registration form now requires a short-lived verification code. Codes are derived deterministically from `REGISTRATION_SEED` (nothing is stored in the DB) and rotate every 30 minutes.

Run the helper script (it reads `REGISTRATION_SEED` from the environment or `.env`):

```bash
node scripts/showVerificationCode.mjs
```

Share the printed value (format `Vault{...}`) with trusted teammates; they must finish signup before the window rotates. Because the code is deterministic, anyone who knows the shared seed can derive the same value.

## Implementation Notes

- `server/utils/kmsClient.ts` performs the RSA handshake (`/session/init` + `/session/key-exchange`) and wraps `crypto/encrypt|decrypt` calls with automatic retries when sessions expire.
- `server/services/fileService.ts` stores metadata plus encrypted chunks per file, ensuring each chunk stays within the KMS plaintext limit.
- `server/api/files/[id]/stream.get.ts` supports range requests so `<audio>`/`<video>` tags can stream media directly from encrypted storage.
- Front-end state (auth, files, previews) lives in composables under `composables/` and `types/`.
- Route middleware (`middleware/auth.global.ts`) forces login before accessing `/app/**`.

## Testing

- `npm run build` performs both client/server builds and type-checking (already executed successfully).
- Upload/stream flows rely on the external KMS. Ensure it is running before testing those routes.
