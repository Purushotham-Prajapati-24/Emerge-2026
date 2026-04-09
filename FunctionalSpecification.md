# ⚙️ Functional Specification — DevVerse

---

## 🔐 Authentication Module

### Features:
- Email/password signup/login
- Google OAuth via Clerk
- JWT-based session management

### Flow:
1. User logs in via email/password → JWT issued
2. Clerk handles OAuth login
3. Backend verifies Clerk token → issues internal JWT

### Tokens:
- Access Token (short-lived, 15 min)
- Refresh Token (long-lived, 7 days)

---

## 🧠 Token Storage Strategy

| Storage Type     | Usage |
|------------------|------|
| localStorage     | Access token |
| httpOnly cookie  | Refresh token |
| sessionStorage   | Temporary session data |

---

## 👤 User Profile Module

### Fields:
- name
- username
- email
- bio
- profile picture
- followers[]
- following[]
- projects[]
- socialLinks:
  - GitHub
  - LinkedIn
  - Portfolio

---

## 🤝 Follow System

### Features:
- Follow / Unfollow
- Follower count
- Activity feed (optional)

---

## 💻 Collaborative Editor

### Features:
- Real-time sync (CRDT)
- Cursor tracking
- File awareness system

---

## ⚡ Code Execution

### Features:
- Run code in isolated containers
- Output console

---

## 🤖 AI Module

### Features:
- Code suggestions
- Conflict detection
- Refactoring hints

---

## 📁 Project System

### Features:
- Create project
- Invite users
- Role-based access

---
