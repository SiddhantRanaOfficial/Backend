# Video Sharing Platform - Backend API 

I'm building the backend service for a video-sharing and social platform (similar to YouTube) using Node.js, Express, and MongoDB.

This project is currently *in active development*. I am setting up the initial architecture, data schemas/models, database connections, utility handlers, and middleware pipeline before implementing the specific controller functions and API endpoints.

---

## Tech Stack

* Runtime: Node.js
* Framework: Express.js
* Database: MongoDB with Mongoose
* Authentication (Planned): JWT (JSON Web Tokens)
* File Uploads (Planned): Multer & Cloudinary / AWS S3

---

## Planned Features & Architecture

Once implemented, the API will support:

- User Authentication:* Registration, login, JWT access/refresh tokens, and profile management.
- Video Operations:* Video & thumbnail upload, metadata storage, public/private publishing controls.
- Social Interactions:* Likes, comments, subscriptions, and short community posts (tweets).
- Custom Feeds:* User watch history and playlist management.

---

## Project Structure

```text
src/
├── db/               # Database connection logic
├── models/           # Mongoose data schemas (User, Video, Like, Comment, etc.)
├── utils/            # Async wrappers, custom error & API response handlers
├── app.js            # Express app configuration & middleware pipeline
├── constants.js      # Global constants & configuration values
└── index.js          # Server entry point & DB initialization


## Local Development Setup

1. Prerequisites: Node.js (v18+) and MongoDB installed locally or Atlas URI.

2. Clone the repository:
```bash
git clone [https://github.com/SiddhantRanaOfficial/Backend.git](https://github.com/SiddhantRanaOfficial/Backend.git)
cd Backend
```

3. Install dependencies:
```bash
npm install
```

4. Create a .env file in the root folder:
```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=*
```

5. Start the server:
```bash
npm run dev
```