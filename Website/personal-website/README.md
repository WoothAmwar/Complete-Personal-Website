This is the [Next.js](https://nextjs.org/) frontend for the Personal Media Viewing Website. See the [repo-root README](../../README.md) for the full project overview.

## Install

```bash
cd Website/personal-website
npm install
```

## Local Development States

Pick whichever state matches what you're testing. Each block is a full, exact command sequence from a fresh clone.

### A. Frontend-only, fully offline (mock backend + mock auth)

No Python, MongoDB, or API keys needed.

```bash
cd Website/personal-website
npm install
npm run dev:mock
```

Open http://localhost:3000. `npm run dev:mock` starts Next.js and `mocks/server.js` together and sets `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_USE_MOCK_AUTH` for you — no `.env.local` needed.

### B. Full backend, local MongoDB, mock YouTube data (fixture JSON)

Real Flask + Mongo, but YouTube data comes from the checked-in `automatic*.json` fixtures instead of the live API.

```bash
# Terminal 1 — backend
cd server
python3 -m venv server_venv && source server_venv/bin/activate   # skip if you already have a venv
pip install -r requirements.txt
docker compose up -d
cp ../.env.example ../.env.local
# edit ../.env.local: set USE_MOCK_YOUTUBE=1
python seed_dev_data.py          # or seed_dev_data_large.py for a bigger fixture set
python application.py

# Terminal 2 — frontend
cd Website/personal-website
npm install
cp .env.example .env.local
# edit .env.local: uncomment NEXT_PUBLIC_API_URL=http://localhost:5000, set NEXT_PUBLIC_USE_MOCK_AUTH=1
npm run dev
```

Open http://localhost:3000, use "🧪 Dev Sign In" to sign in as the seeded `dev-user-1`.

### C. Full backend, local MongoDB, real video playback testing

Same as B, but seeded with 2 real YouTube channels and 3 real, currently-live videos each, so clicking a video actually plays something (unlike B's fake `mockVideoA1`-style IDs).

```bash
# Terminal 1 — backend
cd server
source server_venv/bin/activate   # create it first per state B if you haven't
docker compose up -d
cp ../.env.example ../.env.local
# edit ../.env.local: set USE_MOCK_YOUTUBE=1
python seed_dev_data_real.py
python application.py

# Terminal 2 — frontend
cd Website/personal-website
npm install
cp .env.example .env.local
# edit .env.local: uncomment NEXT_PUBLIC_API_URL=http://localhost:5000, set NEXT_PUBLIC_USE_MOCK_AUTH=1
npm run dev
```

Open http://localhost:3000, "🧪 Dev Sign In", then open a video from Google for Developers or Veritasium to test the real embed/iframe player.

### D. Full backend, real YouTube API key, real Google sign-in

Pulls your actual YouTube subscriptions and their real videos live via the YouTube Data API.

```bash
# Terminal 1 — backend
cd server
source server_venv/bin/activate   # create it first per state B if you haven't
docker compose up -d
cp ../.env.example ../.env.local
# edit ../.env.local: set USE_MOCK_YOUTUBE=0
python application.py

# Terminal 2 — frontend
cd Website/personal-website
npm install
cp .env.example .env.local
# edit .env.local: uncomment NEXT_PUBLIC_API_URL=http://localhost:5000, leave NEXT_PUBLIC_USE_MOCK_AUTH unset/0
npm run dev
```

Open http://localhost:3000, sign in with a real Google account, then on `/dashboard` enter your YouTube Data API key and channel ID (see repo-root README for how to get these and quota caveats). Newly pulled channels land as "unassigned" — move them into daily/weekly/monthly from the dashboard so they show up under `/videos`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
