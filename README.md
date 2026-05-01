# AI Chat Assistant

A polished, production-ready chatbot web application powered by Google Gemini AI. This app features a high-performance, responsive interface with a "Clean Minimalism" aesthetic, optimized for both desktop and mobile users.

## 🚀 Features

- **Gemini-Powered Chat**: Real-time streaming conversation with AI.
- **Clean Minimalist Design**: A high-contrast, professional UI using Zinc and Emerald color palettes.
- **Workspace Controls**: Dedicated sidebar (collapsible on desktop) for session management.
- **Chat History Management**:
  - **Clear History**: Reset your session at any time.
  - **Export as .TXT**: Download your entire conversation as a portable text file.
  - **Search**: Instantly find specific messages within your history.
- **Interaction Enhancements**:
  - **Copy Message**: One-click copy for AI responses.
  - **Retry Logic**: Resend failed messages easily.
  - **Typing Indicators**: Visual feedback when the AI is processing.
  - **Timestamps**: Every message shows its localized delivery time.
- **Fully Responsive**: Adapts seamlessly to different screen sizes with a custom mobile overlay.
- **Enterprise-Grade DevOps**:
  - **CI/CD Pipeline**: Automated builds and deployments via GitHub Actions.
  - **Dockerized**: Optimized Dockerfile (Alpine-based) for low-resource environments.
  - **Docker Compose**: Ready for one-command deployment on any VPS.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4+
- **Animation**: Framer Motion (`motion/react`)
- **Icons**: Lucide React
- **AI**: Google Generative AI (Gemini Flash Preview)
- **Deployment**: Docker, GitHub Actions, GitHub Container Registry (GHCR)

## 📦 Getting Started

### Prerequisites

- Node.js 20+
- A Google AI Studio API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd react-chatbot-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with your assistant.

## 🚢 Deployment

This project comes pre-configured with a robust deployment pipeline.

### GitHub Actions (CI/CD)

The `.github/workflows/deploy.yml` file automates the following on every push to `main`:
1. Builds a production-ready Docker image (`node:20-alpine`).
2. Pushes the image to GitHub Container Registry.
3. SSH into your VPS to run `docker compose up -d`.

### VPS Configuration

To use the automated deployment, add the following secrets to your GitHub repository:
- `GEMINI_API_KEY`: Your AI Studio key.
- `HOST`: Your VPS IP address.
- `USER`: Your VPS SSH username.
- `SSH_PRIVATE_KEY`: Your private SSH key.

## 📄 License

SPDX-License-Identifier: Apache-2.0
