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
- **MongoDB** – Cloud database for storing user data, tags, and video metadata
- **YouTube Python API** – Integration for fetching channel & video data

### Deployment
- **Vercel** – Hosting for frontend
- **AWS API Gateway** – Routing requests to Lambda functions

---

## Project Structure
├── Website/ # Frontend (React + Next.js + MUI + Tailwind)
│ └── personal-website
│ ├── components/ # Reusable React components
│ ├── pages/ # Next.js pages & routing
│ ├── styles/ # Tailwind CSS styles
│ └── utils/ # Frontend helpers
│
├── server/ # Backend (AWS Lambda + Python)
│ ├── handlers/ # Lambda functions
│ ├── api_gateway_config/ # API Gateway integration
│ └── youtube/ # YouTube API integration
│
├── .gitignore
├── LICENSE.md
└── README.md


---

## Getting Started

### 1. Clone the repo
```bash```
git clone https://github.com/WoothAmwar/Complete-Personal-Website.git
cd Complete-Personal-Website
### 2. Download Dependencies and Run the Frontend
cd Website/personal-website
npm install
npm run dev
### 3. Download Dependencies for the Backend
cd ../../server
pip install -r requirements.txt
### 4. Configure your environment variables for:
- MongoDB connection URI
- YouTube API key (or modify in frontend)
- AWS credentials (for Lambda deployment)
### 5. Run backend locally (if testing outside Lambda):
python main.py

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## Author

**Anwar Kader**  

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/anwar-kader)  
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/WoothAmwar)  
📧 [aikader@uchicago.edu](mailto:aikader@uchicago.edu)

