# 🗄️ MongoDB Schema

---

## User Schema

{
  name: String,
  username: String,
  email: String,
  password: String,
  bio: String,
  avatar: String,
  followers: [ObjectId],
  following: [ObjectId],
  projects: [ObjectId],
  socialLinks: {
    github: String,
    linkedin: String
  },
  createdAt: Date
}

---

## Project Schema

{
  title: String,
  owner: ObjectId,
  collaborators: [ObjectId],
  files: [],
  createdAt: Date
}

---
