<h1 align="center">⏰ The Last-Minute Life Saver 🚀</h1>

<p align="center"><b>Beat procrastination and master your deadlines with the ultimate AI-powered full-stack productivity engine!</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Google Cloud" />
  <img src="https://img.shields.io/badge/Gemini_2.0_Flash-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Gemini AI" />
</p>

<p align="center">
  <a href="https://the-last-minute-life-saver-971938524832.us-west1.run.app" target="_blank">
    <img src="https://img.shields.io/badge/Live_App-Demo-0284c7?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">🌐 <b>Live Application Link:</b> <a href="https://the-last-minute-life-saver-971938524832.us-west1.run.app" target="_blank">https://the-last-minute-life-saver-971938524832.us-west1.run.app</a></p>

---

## 📝 Project Description

**The Last-Minute Life Saver** is a robust, full-stack, AI-powered productivity ecosystem built to rescue chronic procrastinators, busy students, and modern professionals from impending deadlines. By integrating directly with your Gmail inbox and Google Drive accounts, the application scans messages and files, employs the power of **Gemini 2.0 Flash** to parse deadlines and auto-extract actionable tasks, and schedules them directly into an intuitive workspace. Backed by advanced cognitive-load prioritation, streak tracking, and interactive smart coach chats, this application converts your high-stress workloads into manageable, structured, and focused sprints.

---

## ✨ Features

- ⚡ **AI Task Prioritization**: Automatic task sorting based on a dynamic priority algorithm balancing deadline urgency, user energy levels, and assignment gravity.
- 📬 **Gmail Auto-Pilot Detection**: Instant unread email querying that automatically scans and parses incoming instructions or assignments into actual tasks.
- 📁 **Google Drive Co-Pilot**: Link your storage files securely using Google OAuth to summarize long project documentation and extract deadlines with a single click.
- 📅 **Google Calendar Co-Pilot**: Seamlessly integrate your agenda, view busy times, and let Gemini AI auto-schedule customized 1.5-hour focus blocks for outstanding tasks inside empty slots.
- 🤖 **Gemini Chat Assistant**: An interactive study buddy and coach. Ask for exam schedules, quick concept summaries, or customized stress relief plans.
- 🌸 **Habit & Streak Logs**: Create custom repeating habits with satisfying daily streak updates to remain motivated and build long-term positive routines.
- 🚨 **Push Notifications & Overlays**: Real-time browser notifications and focus overlay tools designed to draw your attention back to urgent priorities.
- 📊 **Weekly Intelligence Insights**: AI-generated performance reports analyzing your completion rates, peak productivity times, and focus trends.

---

## 🏗️ Architecture Diagram

Below is the visual overview of the end-to-end event and data flow in the application, illustrating how data travels from source feeds into the AI processing queue, then persists inside Firestore, before rendering across the reactive client view.

```
                                 +--------------------+
                                 |   📧 Gmail Inbox   |
                                 +---------+----------+
                                           | (Real-time Sync / Fetch)
                                           v
+------------------+             +--------------------+             +--------------------+
|  📁 Google Drive | ----------> | 🚀 Node.js Backend | <---------> |  ✨ Gemini 2.0 AI  |
+------------------+             +---------+----------+             +--------------------+
                                           |
                                           | (Secure Auth / DB Write)
                                           v
                                 +--------------------+
                                 |  🔥 Firebase DB    |
                                 +---------+----------+
                                           |
                                           | (Live State Synchronization / Messaging)
                                           v
+------------------+             +--------------------+             +--------------------+
| 🔔 Firebase FCM  | ----------> | 🎨 React Frontend  | <---------> | 💻 Client Browser  |
+------------------+             +--------------------+             +--------------------+
```

---

## 💻 Tech Stack

| Layer | Technologies & Services |
| :--- | :--- |
| **Frontend UI** | React.js (Vite, TS), Tailwind CSS, Framer Motion (animations), Lucide Icons, Recharts (D3 charts) |
| **Backend & APIs** | Node.js, Express, tsx running dynamic REST endpoints |
| **AI Models** | Google GenAI SDK (`@google/genai`), Gemini 2.0 Flash |
| **Cloud Infrastructure** | Google Cloud Run (backend container), Firebase Hosting (static asset delivery) |
| **Database & Auth** | Firebase Firestore (Real-time NoSQL storage), Firebase Auth with Google Sign-In |
| **Notifications & Triggers** | Firebase Cloud Messaging (FCM), Native Browser Notifications API, Google Cloud Scheduler |

---

## 🚀 Getting Started

Follow these instructions to set up the full-stack environment on your local system for testing or contribution.

### 📋 Prerequisites
- **Node.js**: Version 18.x or later installed.
- **npm** or **yarn** package manager.
- **Firebase CLI**: Installed globally via `npm install -g firebase-tools`.
- **GCP Account**: With Google Drive, Gmail, and Google Cloud Run APIs enabled.

### ⚙️ Installation Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/the-last-minute-life-saver.git
   cd the-last-minute-life-saver
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Configure the environment settings**:
   Create a `.env` file in your root workspace referencing `.env.example`.

### 🗃️ Environment Variables

The following variables must be configured to run the application securely.

| Environment Variable | Source / Description | Required For |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio Developer Console (Server Secret Key) | Gemini 2.0 AI features |
| `APP_URL` | Production cloud run URL or `http://localhost:3000` | Google OAuth redirect validation |
| `VITE_FIREBASE_API_KEY` | Firebase Project console settings | Web client SDK initialization |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Project console settings | User login flow |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project console settings | Database write indexing |
| `VITE_FIREBASE_STORAGE_BUCKET`| Firebase Project console settings | Avatar / asset uploads |
| `VITE_FIREBASE_APP_ID` | Firebase Project console settings | App configuration handshake |

### 🛠️ Run Locally

To spin up the local development server (Express server serving client-side assets under Vite's routing):

```bash
# Compile and start server + client
npm run dev
```

Your app will now be available for browsing at **`http://localhost:3000`**.

---

## 🚢 Deployment

Ensure both modules are successfully deployed using standard GCP command lines.

### 🎨 Frontend Deployment (Firebase Hosting)
Configure Firebase Hosting and dispatch static web bundles directly to CDN nodes:
```bash
# Authenticate your local shell
firebase login

# Build optimization artifacts
npm run build

# Deploy assets
firebase deploy --only hosting
```

### ⚙️ Backend Deployment (Google Cloud Run)
Dockerize or deploy the server entrypoint cleanly utilizing automated Google Build nodes:
```bash
# Configure standard SDK project ID
gcloud config set project <YOUR_PROJECT_ID>

# Submit target build container
gcloud builds submit --tag gcr.io/<YOUR_PROJECT_ID>/last-minute-backend

# Launch standard container
gcloud run deploy last-minute-backend --image gcr.io/<YOUR_PROJECT_ID>/last-minute-backend --platform managed --allow-unauthenticated
```



## ⚙️ How It Works (The Gmail-to-Task Pipeline)

1. **Triggering**: A Google Cloud Scheduler trigger invokes the backend sync cron endpoint, or the client manually clicks "Sync Gmail" in the navbar.
2. **Fetching**: The backend uses the authorized OAuth credentials to search the user's Gmail mailbox for recent unread or high-importance messages.
3. **Ingestion & Sanitization**: The raw body text is parsed, stripped of unnecessary HTML elements, and truncated to avoid excessive token waste.
4. **AI Parsing (Gemini)**: Gemini 2.0 Flash is supplied with the email data alongside current-time parameters. The model isolates deadlines, prioritizes action items, and generates structured JSON output.
5. **Persistence & Presentation**: The structured JSON payload is saved into the user's Firestore collection. The client-side dashboard receives a real-time snapshot update and alerts the user of newly scheduled tasks.

---

## 🤝 Contributing

We welcome contributions of all shapes and sizes! To get started:
1. **Fork** the project repository.
2. Create a clean feature branch (`git checkout -b feature/amazing-improvement`).
3. Commit your changes with informative commit logs (`git commit -m "feat: integrate weekly notification alerts"`).
4. Push your branch (`git push origin feature/amazing-improvement`).
5. Open a detailed **Pull Request** detailing your modifications.

---

## 📄 License

This project is licensed under the MIT License.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
