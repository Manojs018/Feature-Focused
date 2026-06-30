# Google Cloud Solutions Architecture: Google Technologies Catalog
## Project: **The Last-Minute Life Saver**

This document details the suite of official **Google Platforms, APIs, SDKs, and Services** that power **The Last-Minute Life Saver** productivity application. By orchestrating these technologies, the application delivers a seamless, highly secure, and intelligent user experience.

---

## 🤖 1. Google Generative AI (Gemini Models)

The core cognitive features of the application are built "AI-First" using Gemini's state-of-the-art multimodal reasoning capabilities.

*   **Gemini 2.0 Flash Model**: Selected as the primary LLM engine. It provides a perfect balance of exceptionally low latency, high processing throughput, and sophisticated structured JSON output capabilities.
*   **Official Google GenAI SDK (`@google/genai`)**: Utilized to implement native, secure handshakes between the backend Express proxy and the Google AI endpoints.
*   **AI-Enabled Sprints**:
    *   **Gmail Task Parsing**: Extracts headers and sanitizes text bodies to uncover commitments, mapping vague phrases (e.g. *"next Friday"*) to absolute ISO timestamps.
    *   **Drive Document Analysis**: Extracts exam schedules, grading weights, and project guidelines, converting them into structured milestone lists.
    *   **Conflict-Free Smart Scheduling**: Evaluates outstanding deadlines and existing busy blocks to allocate optimized, 1.5-hour focus times.
    *   **AI Coach Dialogues**: Provides dynamic, empathetic, context-aware advice directly within the interactive study chat sidebar.

---

## 📁 2. Google Workspace Platform Integration

The application bridges the gap between study files, active communications, and physical calendars using secure Google Workspace REST integrations.

*   **Gmail API**:
    *   **Scopes**: `https://www.googleapis.com/auth/gmail.readonly`
    *   **Usage**: Safely queries the user's primary unread email inbox, searching for instructions, study guides, and assignment prompts to parse into active tasks.
*   **Google Drive API**:
    *   **Scopes**: `https://www.googleapis.com/auth/drive.readonly`
    *   **Usage**: Enables the Document Summarizer to retrieve academic syllabus drafts, markdown notes, and project briefs for instant analysis.
*   **Google Calendar API**:
    *   **Scopes**: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`
    *   **Usage**: Automatically queries existing calendar blocks to avoid scheduling conflicts and writes new AI-suggested focus blocks directly onto the user's physical calendar.

---

## 🔑 3. Google Identity & OAuth 2.0

Security, privacy, and granular permission constraints are strictly enforced using Google's modern authentication framework.

*   **Google OAuth 2.0 Web Client**:
    *   Configured inside the Google Cloud Console to provision secure client IDs and redirect URIs.
    *   Allows users to grant explicit, granular access to individual Workspace scopes (Gmail, Drive, Calendar) via secure consent screens.
*   **Access Token Management**:
    *   Client-side popup flows securely retrieve Google API tokens.
    *   Tokens are passed to backend `/api/*` proxies server-side to execute operations on behalf of the logged-in user without exposing secrets.

---

## 🔥 4. Firebase Cloud Suite

The application leverages the Firebase ecosystem for serverless authentication, real-time database synchronization, and administrative control.

*   **Firebase Authentication**:
    *   Integrates **Google Sign-In** utilizing the client-side `GoogleAuthProvider` flow.
    *   Authenticates users and provides cryptographically signed **JSON Web Tokens (JWT / ID Tokens)** to verify client identities on backend API routes.
*   **Cloud Firestore NoSQL Database**:
    *   Serves as the primary persistence layer.
    *   Stores tasks, habits, streaks, user settings, and email deduplication logs in high-performance, real-time documents.
    *   Governed by Firestore Security Rules to verify read/write request authorization.
*   **Firebase Admin SDK**:
    *   The administrative backend driver (`firebase-admin`).
    *   Performs secure JWT authentication checks on the Express server and executes high-privileged, safe database operations on Firestore.

---

## 🚀 5. Google Cloud Serverless Hosting

The backend infrastructure is deployed on modern Google Cloud container frameworks.

*   **Google Cloud Run**:
    *   Hosts the Express server-side proxy inside autoscaling serverless container nodes.
    *   Offers isolated runtime environments that securely handle API calls, document text extraction, and Gemini model handshakes while completely masking secret keys from the public web browser.
