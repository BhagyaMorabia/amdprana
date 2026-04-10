# Prana

> **Eat Smart. Live Better. Powered by AI.**  
> AMDI Promptathon — Smart Food & Health Platform

## Google Services Used (9 total)

| Service | Purpose |
|---------|---------|
| **Firebase Auth** | Google SSO + email/password authentication |
| **Cloud Firestore** | User diary, goals, fasting state |
| **Firebase Hosting** | Static hosting, CDN, HTTPS |
| **Gemini 1.5 Flash** | Food photo analysis, meal plan generation, fasting tips |
| **Google Maps JS API** | Nearby healthy restaurants map |
| **Google Places API** | Restaurant and grocery store search |
| **Google Analytics 4** | Usage analytics |
| **Google Fonts** | Outfit + Inter typography |
| **Material Symbols** | Iconography |

## Features

- 🤖 **AI Food Photo Scanner** — Gemini analyzes meal photos and logs nutrition
- 📔 **Food Diary** — Log meals via 600K+ food search or AI photo
- 📊 **Dashboard** — Calorie ring, macro bars, water tracker, trend charts
- ⏱️ **Fasting Timer** — 16:8, 18:6, 20:4, 5:2, 6:1 with live countdown
- 🗓️ **AI Meal Planner** — Gemini generates personalized 7-day plans
- 🧮 **5 Calculators** — BMI, TDEE, Ideal Weight, Calories Burned, Macro Split
- 🍽️ **Food Database** — Browse 600K+ foods with full nutrition panels
- 🗺️ **Nearby Eats** — Google Maps finds healthy restaurants near you

## Setup

1. Copy `.env.example` to `.env.local` and fill in API keys
2. `npm install` then `npm run dev`

### API Keys (all free)
- Gemini → [aistudio.google.com](https://aistudio.google.com)
- Firebase → [console.firebase.google.com](https://console.firebase.google.com)
- USDA → [fdc.nal.usda.gov](https://fdc.nal.usda.gov/api-guide.html)
- Maps → Google Cloud Console

## Tech Stack
React 18 · TypeScript · Tailwind CSS · Vite · Firebase · Gemini 1.5 Flash · React Query · Recharts

## Compliance
- ✅ Repository < 1MB (node_modules in .gitignore)
- ✅ Single `main` branch · ✅ Public repository
