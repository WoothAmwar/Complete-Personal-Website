# Personal Media Viewing Website

[![Website](https://img.shields.io/website?url=https://complete-website-humanwooths-projects.vercel.app)](https://complete-website-humanwooths-projects.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)]()
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)]()
[![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)]()
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)]()

---

## Live Demo

Check out the live version of the site:  
[Personal Media Website](https://complete-website-humanwooths-projects.vercel.app)

---

## Project Overview

This project is a **personalized media viewing platform** that only shows videos from channels you subscribe to on YouTube, with additional features for personalization and data management.  

Key highlights:
- Import and cache **YouTube data** (100+ channels, 300+ videos per user) from your account via the **YouTube Python API**  
- Custom **channel tagging** system for easy organization  
- **Watch later** and personalized homepage functionality  
- Full-stack integration with **React, Next.js, MongoDB, AWS Lambda**, and **custom REST APIs**  

---

## Tech Stack

### Frontend
- **React** – UI component framework
- **Next.js** – Server-side rendering & routing
- **MUI (Material UI)** – Prebuilt UI components
- **Tailwind CSS** – Utility-first styling for custom designs

### Backend
- **AWS Lambda Functions** – Serverless backend logic
- **Flask** – Python REST API (`server/application.py`) for local development
- **MongoDB** – Cloud database for storing user data, tags, and video metadata
- **YouTube Python API** – Integration for fetching channel & video data

### Deployment
- **Vercel** – Hosting for frontend
- **AWS API Gateway** – Routing requests to Lambda functions

---

## Project Structure
├── Website/ # Frontend (React + Next.js + MUI + Tailwind)
│ └── personal-website
│ ├── src/components/ # Reusable React components
│ ├── src/pages/ # Next.js pages & routing
│ └── mocks/ # Frontend-only mock backend (offline dev, see below)
│
├── server/ # Backend (Flask, deployed to AWS Elastic Beanstalk)
│ ├── application.py # Flask app entrypoint (routes, cron jobs)
│ ├── YoutubeData/ # YouTube Data API integration + MongoDB access
│ ├── WebText/ # Novel chapter tracker feature
│ └── docker-compose.yml # Local MongoDB for offline dev
│
├── .env.example # Backend env vars (copy to .env.local)
├── .gitignore
├── LICENSE
└── README.md

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/WoothAmwar/Complete-Personal-Website.git
cd Complete-Personal-Website
```

### 2. Frontend
```bash
cd Website/personal-website
npm install
cp .env.example .env.local   # see that file for offline/mock-backend options
npm run dev
```

### 3. Backend
```bash
cd server
pip install -r requirements.txt
cp ../.env.example ../.env.local   # repo-root .env.local, see that file for local Mongo / mock YouTube options
python application.py
```

## Local & Offline Development

This app normally depends on MongoDB Atlas, the YouTube Data API, and Google OAuth. For local and offline development, three lighter-weight paths exist:

- **Frontend-only, fully offline**: `npm run dev:mock` in `Website/personal-website` starts Next.js
  alongside a small mock backend (`mocks/server.js`) that returns fixture data for every endpoint the
  frontend calls. No Python, MongoDB, or API keys needed. Set `NEXT_PUBLIC_USE_MOCK_AUTH=1` in
  `.env.local` to also skip the Google OAuth popup.
- **Full backend, local MongoDB**: `docker compose up -d` in `server/` runs a local MongoDB container;
  point `MONGODB_URI` in the repo-root `.env.local` at it (see `.env.example`), then
  `python server/seed_dev_data.py` to seed it with a fixture user/channels/videos.
- **Real video playback testing**: `seed_dev_data.py`/`seed_dev_data_large.py` use made-up channel/video
  IDs (e.g. `mockVideoA1`), so clicking through to a video won't actually play anything. Run
  `python server/seed_dev_data_real.py` instead to seed the same dev user with 2 real YouTube channels
  (Google for Developers, Veritasium) and 3 real, currently-live videos each, so `/custom-youtube/<videoId>`
  actually plays a real video end-to-end.
- **No YouTube API key**: set `USE_MOCK_YOUTUBE=1` in the repo-root `.env.local` to make
  `server/YoutubeData/youtube.py` return data from the `automatic*.json` fixture files already checked
  into `server/YoutubeData/` instead of calling the live YouTube Data API.

What still needs real internet/credentials even in local dev: actual YouTube video playback/embeds,
real Google sign-in, and the MongoDB Atlas / production backend if you don't use the options above.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Author

**Anwar Kader**  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anwar-kader)  
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/WoothAmwar)  
📧 [aikader@uchicago.edu](mailto:aikader@uchicago.edu)

