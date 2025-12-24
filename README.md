# Chronos API

> A RESTful backend for student task management with automated deadline reminders and weekly progress summaries.

[![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)](https://chronos-backend-bqjf.onrender.com/api/settings/health)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-16+-green.svg)](https://nodejs.org)

**Live API:** [https://chronos-backend-bqjf.onrender.com](https://chronos-backend-bqjf.onrender.com)  
**Frontend:** [chronos-frontend-nine.vercel.app](https://chronos-frontend-nine.vercel.app)

---

## 📖 About This Project

As a computer science student, I kept seeing my peers (and myself) struggle with the same problem: staying organized across multiple courses. We'd use basic todo apps, but they didn't capture the reality of university life—tasks grouped by courses, tight deadlines, and the constant need for reminders.

I built Chronos to solve this. It's not just a todo list; it's a system that understands how students actually work. You organize tasks by course, get reminded before deadlines, and receive weekly summaries to stay on track.

**This is both a learning project and a real tool**—I've been iterating on it for few weeks, and a few friends are already using it in production. I'm building in public, learning from mistakes, and documenting the journey.

---

## 🎯 What It Does

- **Course-based organization**: Group tasks by course instead of one endless list
- **Smart deadline reminders**: Get email notifications 5 minutes before tasks are due
- **Weekly progress summaries**: Receive Sunday recap emails of your accomplishments and pending tasks
- **Authentication system**: Secure JWT-based user authentication
- **Customizable notifications**: Toggle email preferences on/off

---

## 🏗️ Tech Stack

| Layer | Technology | Why I Chose It |
|-------|-----------|----------------|
| **Runtime** | Node.js | Easiest entry point for backend development with JavaScript |
| **Framework** | Express.js | Minimalist and flexible for learning REST principles |
| **Database** | MongoDB + Mongoose | Wanted to learn NoSQL and document-based data modeling |
| **Authentication** | JWT + bcrypt | Industry standard for stateless authentication |
| **Email Service** | Resend API | Switched from Nodemailer after deployment issues |
| **Job Scheduler** | node-cron | Simple cron-like scheduling for automated tasks |
| **Hosting** | Render | Free tier with automatic deployments from GitHub |
| **Monitoring** | UptimeRobot | 99.9% uptime tracking over the last 30 days |

---

## 📊 Database Schema

### User Model

```javascript
{
  name: String,              // User's full name
  email: String,             // Unique email address
  password: String,          // Bcrypt hashed password
  emailNotifications: Boolean, // Email preference (default: true)
  timestamps: true           // createdAt, updatedAt
}
```

### Course Model

```javascript
{
  courseTitle: String,       // e.g., "Data Structures"
  description: String,       // Course details
  user: ObjectId,            // References User
  timestamps: true
}
```

### Task Model

```javascript
{
  goal: String,              // Task description
  deadline: Date,            // Due date and time
  completed: Boolean,        // Task status (default: false)
  reminderSent: Boolean,     // Tracks if reminder was sent
  course: ObjectId,          // References Course
  user: ObjectId,            // References User
  timestamps: true
}
```

**Relationships:**

- One User → Many Courses
- One Course → Many Tasks
- Each Task belongs to one Course and one User

---

## 🚀 API Reference

### Authentication

#### Register New User

```http
POST /api/user/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "securePassword123"
}
```

**Response (201):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@university.edu"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```http
POST /api/user/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "securePassword123"
}
```

#### Logout (Protected)

```http
GET /api/user/logout
Authorization: Bearer <token>
```

---

### Course Management

#### Create Course

```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseTitle": "Data Structures",
  "description": "Introduction to algorithms and data structures"
}
```

#### Get All User Courses

```http
GET /api/courses
Authorization: Bearer <token>
```

**Response:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "courseTitle": "Data Structures",
    "description": "Introduction to algorithms...",
    "user": "507f191e810c19729de860ea",
    "createdAt": "2024-12-01T10:00:00Z"
  }
]
```

#### Update Course

```http
PUT /api/courses/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseTitle": "Advanced Data Structures",
  "description": "Updated description"
}
```

#### Delete Course

```http
DELETE /api/courses/:id
Authorization: Bearer <token>
```

---

### Task Management

#### Create Task

```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "goal": "Complete assignment on binary trees",
  "deadline": "2024-12-25T23:59:00Z",
  "course": "507f1f77bcf86cd799439011"
}
```

#### Get All User Tasks

```http
GET /api/tasks
Authorization: Bearer <token>
```

#### Update Task (Mark Complete)

```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed": true
}
```

#### Delete Task

```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

---

### Email Preferences

#### Get Notification Settings

```http
GET /api/settings/notifications
Authorization: Bearer <token>
```

**Response:**

```json
{
  "emailNotifications": true
}
```

#### Update Notification Settings

```http
POST /api/settings/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotifications": false
}
```

#### Delete Account

```http
DELETE /api/settings/delete
Authorization: Bearer <token>
```

---

## ⚙️ Automated Background Jobs

Using **node-cron** for scheduled tasks:

### Task Reminder Job

- **Schedule**: Runs every minute (`* * * * *`)
- **Function**: Checks all incomplete tasks with deadlines in the next 5 minutes
- **Action**: Sends email reminder if `reminderSent` is false, then marks `reminderSent: true`

### Weekly Summary Job

- **Schedule**: Sundays at 5:00 PM server time (`0 17 * * 0`)
- **Function**: Aggregates user's weekly activity (completed tasks, pending tasks)
- **Action**: Sends summary email to all users with notifications enabled

**Note:** I learned the hard way about timezone differences between development and production. The Render server uses UTC, so I had to adjust cron schedules accordingly.

---

## 🛠️ Local Development Setup

### Prerequisites

- Node.js (v16 or higher recommended)
- MongoDB (local installation or Atlas cluster)
- Resend API key ([get one free](https://resend.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Precixphantom/chronos-api.git
cd chronos-api

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/chronos
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chronos

# Authentication
JWT_SECRET=your_super_secure_random_string_here

# Email Service
RESEND_API_KEY=re_your_resend_api_key_here

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

**Test it:**

```bash
curl http://localhost:5000/health
# Response: {"status": "healthy", "timestamp": "2024-12-21T..."}
```

---

## 🧪 Testing

### Manual Testing

I've been using **Postman** to test all API endpoints during development. It's been invaluable for:

- Testing authentication flows with JWT tokens
- Validating request/response formats
- Debugging error handling
- Simulating different user scenarios

### Automated Testing

**Current Status:** No automated tests yet (I know, I know—it's on my learning roadmap!)

**Next Steps:**

- Set up Jest for unit testing
- Add integration tests for API endpoints
- Implement test coverage reporting
- Eventually migrate Postman tests to automated Newman scripts

If you have experience with testing Node.js apps and want to contribute test cases or help me set up a testing framework, I'd really appreciate the guidance and learning opportunity.

**Note:** I can share my Postman collection if you want to test the API yourself—just reach out!

---

## 🚧 Challenges I've Faced

### 1. **Email Service Migration**

Initially used Nodemailer with Gmail SMTP. It worked perfectly in development but failed silently in production. After debugging for hours, I switched to Resend's API—much more reliable for deployed apps.

### 2. **Timezone Confusion**

My local machine (WAT) and Render's servers (UTC) have different timezones. Cron jobs were firing at unexpected times. Solution: Always work in UTC on the backend and convert to user timezone on the frontend.

### 3. **JWT Authentication**

Understanding stateless authentication was initially confusing. I had to learn about token expiration, secure storage, and protected routes. Still learning best practices around refresh tokens.

---

## 🎯 Roadmap

### Currently Working On

- [ ] Email verification for new users
- [ ] Password reset flow (forgot password)
- [ ] API rate limiting to prevent abuse

### Future Features

- [ ] File upload support (course materials, notes)
- [ ] Task priority levels (high/medium/low)
- [ ] Calendar view integration
- [ ] Study session timer (Pomodoro technique)
- [ ] Collaborative study groups
- [ ] Mobile app (React Native)

### Technical Debt

- [ ] Add comprehensive unit and integration tests
- [ ] Improve error handling and logging
- [ ] Implement refresh token rotation
- [ ] Database query optimization and indexing

---

## 🤝 Contributing

I'm actively learning and **genuinely welcome contributions**, especially from more experienced developers who can help me improve.

### Ways to Contribute

1. **Code Reviews**: Look through my code and suggest improvements
2. **Bug Reports**: Found an issue? Open a GitHub issue with details
3. **Feature Suggestions**: Have ideas? Let's discuss them
4. **Documentation**: Help improve these docs
5. **Testing**: Help me add test coverage

### How to Contribute

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git commit -m "Add: brief description of changes"

# Push to your fork
git push origin feature/your-feature-name

# Open a Pull Request with description of changes
```

**Please be kind—I'm still learning!** Constructive feedback is incredibly valuable to me.

---

## 📈 Current Stats

- **Uptime (Last 30 Days):** 99.906% (1 incident, 5min 2sec downtime)
- **Active Users:** Small group of university friends testing in production
- **Average Response Time:** <500ms for most endpoints
- **Database:** MongoDB Atlas (free tier)

---

## 🐛 Known Issues

- Task reminders use server timezone (UTC) instead of user timezone
- No pagination on GET requests (will be an issue with many tasks)
- Email templates are plain text (no HTML styling yet)
- Password requirements are minimal (should enforce stronger passwords)

I'm working through these as I learn more about production best practices.

---

## 📝 License

MIT License - feel free to fork, modify, and learn from this project.


---

## 🙏 Acknowledgments

This project wouldn't exist without:

- **MongoDB University** free courses
- **freeCodeCamp** backend curriculum
- **The Odin Project** for teaching me Express.js
- **Stack Overflow** community (I've asked... many questions)
- My friends who've been patient beta testers

---

## 👨‍💻 About Me

**Precious Afolabi**  
Computer Science & Cybersecurity Student | Junior Backend Developer | Aspiring Ethical Hacker | Building & Learning in Public

Every feature was a learning experience—from understanding RESTful design to debugging timezone issues in production.

I'm documenting my journey because I wish I had more beginner-friendly resources when I started. If you're learning backend development too, feel free to reach out. We can learn together.

- **GitHub:** [@Precixphantom](https://github.com/Precixphantom)
- **LinkedIn:** [Precious Afolabi](https://www.linkedin.com/in/precious-afolabi-34194138b)

---

## 📬 Contact & Support

- **Issues:** [GitHub Issues](https://github.com/Precixphantom/chronos-api/issues)
- **Email:** Available on my GitHub profile
- **Feedback:** Always appreciated—even harsh critiques help me grow

---

**⭐ If this project helped you learn something, consider starring the repo!**

*Last Updated: December 2024*
