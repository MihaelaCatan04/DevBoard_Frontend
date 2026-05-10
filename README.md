# DevBoard

A full-stack developer dashboard with personalized feeds, social collaboration, and admin controls.

**Frontend:** React + Vite + Redux + Tailwind
**Backend:** Spring Boot + MyBatis + MySQL + JWT

---

## What It Does

DevBoard combines curated tech news feeds with a community-driven "War Stories" platform. Users register, share real-world developer experiences, vote, comment, and discover stories from others. Admins oversee content moderation and user management.

---

## Features

### Personalized Feeds (Public)
- **GitHub** — trending repositories filtered by your chosen languages
- **Hacker News** — top stories cross-referenced with your topics
- **npm** — weekly download stats for packages you track
- **DEV.to** — articles tagged with your interests
- **World Clocks** — current time for remote colleagues' timezones

### War Stories (Authenticated)
- **Share stories** — post real situations, lessons learned, technical challenges
- **Vote** — upvote/downvote stories (1 or -1 per user)
- **Comment** — discuss each story, build community knowledge
- **Search & filter** — find stories by tag (devops, frontend, backend, database, management) or keyword
- **Sort** — by latest, most voted, or most discussed
- **Pagination** — browse 5 stories per page

### Admin Panel (ADMIN role only)
- **Post moderation** — view all posts (including soft-deleted), restore or permanently delete
- **User lookup** — search any user by username, see role and join date
- **Delete user posts** — bulk delete all posts by a user
- **Stats** — dashboard showing total posts, soft-deleted count, active posts count

### Authentication & Session Management
- **Register/Login** — username/password based, JWT tokens issued
- **JWT expiry** — default 1 minute, configurable via backend
- **Session warning** — 15-second warning before token expiry, with re-login button
- **Auto-logout** — expired tokens trigger logout, stored auth is cleared
- **Protected routes** — admin tab only visible to ADMIN role
- **Token parsing** — expiry extracted from JWT payload for client-side tracking

### UI & Theme
- **Dark/light mode** — toggle in navbar, persists across sessions
- **Responsive** — mobile, tablet, desktop
- **Error handling** — rate limits (429), 401/403 session errors, network failures
- **Real-time updates** — War Stories panel auto-refreshes every 30 seconds

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite |
| State Management | Redux Toolkit + Redux-Persist |
| Styling | Tailwind CSS v4 |
| HTTP Client | Fetch API |

### Backend
| Layer | Technology |
|---|---|
| Framework | Spring Boot 3 |
| ORM/Mapper | MyBatis |
| Database | MySQL 8 |
| Security | Spring Security + JWT (JJWT) |
| API Docs | Swagger/OpenAPI |

### Public APIs Used
| Source | Purpose |
|---|---|
| `api.github.com` | Trending repositories |
| `hacker-news.firebaseio.com` | Top stories |
| `registry.npmjs.org` | Package metadata |
| `api.npmjs.org` | Download stats |
| `dev.to/api` | Articles |

---

## Authentication Flow

### Registration
1. User enters username + password
2. Frontend sends to `POST /auth/register`
3. Backend hashes password, stores in MySQL, returns success
4. User can now login

### Login
1. User enters credentials
2. Frontend sends to `POST /auth/login`
3. Backend validates, generates JWT (sub: username, role: ADMIN/WRITER/USER)
4. JWT includes `exp` claim (1 minute default)
5. Frontend stores in Redux + localStorage (persisted)
6. Frontend parses `exp` →  `expiresAt` for client-side tracking

### Request Authorization
1. Frontend calls protected endpoint with `Authorization: Bearer <token>`
2. Backend `JwtFilter` extracts token, validates signature + expiry
3. If valid → sets `SecurityContext`, endpoint executes
4. If 401 invalid/expired → frontend dispatches `logout()`
5. If 403 forbidden → treated as session error → logout
6. Pre-flight check: if token expired before request sent → logout immediately

### Session Expiry
- Dashboard shows warning banner 15s before expiry
- Warning includes "Re-login →" button to open login modal
- Auto-logout occurs at expiry time
- Admin tab disappears from navbar when logged out
- All protected API calls fail cleanly with logout

---

## API Endpoints

### Authentication
```
POST   /auth/register          register new user
POST   /auth/login             login, returns { token, username, role }
```

### Posts (War Stories)
```
GET    /posts                  fetch paginated posts (public, excludes soft-deleted)
POST   /posts                  create post (WRITER/ADMIN)
PUT    /posts/:id              update post (owner or ADMIN)
DELETE /posts/:id              soft delete post (owner or ADMIN)
GET    /posts/:id              fetch single post detail (public)
POST   /posts/:id/vote         vote on post (WRITER/ADMIN, +1 or -1)

Query params:
  ?limit=10&skip=0             pagination
  ?tag=frontend                filter by tag
  ?search=query                search title/body
  ?sort=date|votes|comments    sort order
```

### Comments
```
GET    /posts/:id/comments     fetch comments (public)
POST   /posts/:id/comments     add comment (WRITER/ADMIN)
DELETE /posts/:id/comments/:commentId  delete comment (owner or ADMIN)
```

### Admin Endpoints (ADMIN only)
```
GET    /admin/posts            all posts including soft-deleted
POST   /admin/posts/:id/restore   restore soft-deleted post
DELETE /admin/posts/:id/hard      permanently delete post
GET    /admin/users/:username     lookup user (returns username, role, createdAt)
GET    /admin/users/:username/posts   user's posts
DELETE /admin/users/:username/posts   delete all user's posts
```

---

## Data Models

### User
```
id (Long, PK)
username (String, unique)
password (String, hashed)
role (String: ADMIN, WRITER, USER)
createdAt (Timestamp)
```

### Post
```
id (Long, PK)
title (String)
body (String, long text)
author (String, username)
tag (String: devops, frontend, backend, database, management)
votes (Integer, sum of all votes)
createdAt (Timestamp)
deletedAt (Timestamp, null if active = soft delete flag)
```

### Comment
```
id (Long, PK)
postId (Long, FK)
author (String, username)
body (String)
createdAt (Timestamp)
```

### Vote
```
id (Long, PK)
username (String)
postId (Long, FK)
direction (Integer: 1 or -1)
```

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx            # header with auth, theme toggle
│   │   │   └── SettingsDrawer.jsx    # profile editor
│   │   └── panels/
│   │       ├── GithubPanel.jsx       # trending repos
│   │       ├── HackerNewsPanel.jsx   # HN feed
│   │       ├── NpmPanel.jsx          # package stats
│   │       ├── DevToPanel.jsx        # articles
│   │       ├── ClocksPanel.jsx       # world timezones
│   │       ├── BookmarksPanel.jsx    # saved items
│   │       ├── WarzonePanel.jsx      # war stories feed + create/vote/comment
│   │       └── AdminPanel.jsx        # admin dashboard
│   ├── pages/
│   │   ├── Dashboard.jsx             # main shell (all tabs)
│   │   ├── AuthPage.jsx              # login/register modal
│   │   └── PostDetailPage.jsx        # full story + comments
│   ├── services/
│   │   └── warzone.js                # all API calls, JWT handling
│   ├── store/
│   │   ├── store.js                  # Redux config + persist
│   │   ├── authSlice.js              # auth state + expiresAt
│   │   ├── profileSlice.js           # user prefs (langs, topics, bookmarks)
│   │   └── themeSlice.js             # dark/light mode
│   └── constants/
│       └── topics.js                 # languages, topics, timezones
│
backend/
├── src/main/java/com/devboard/
│   ├── controller/
│   │   ├── AuthController.java       # /auth/register, /auth/login
│   │   ├── PostController.java       # posts endpoints
│   │   ├── CommentController.java    # comments endpoints
│   │   └── AdminController.java      # admin endpoints
│   ├── service/
│   │   ├── AuthService.java          # register, login logic
│   │   ├── PostService.java          # post CRUD, votes, soft delete
│   │   └── CommentService.java       # comment CRUD
│   ├── security/
│   │   ├── JwtUtil.java              # generate, parse, validate JWT
│   │   ├── JwtFilter.java            # intercept requests, extract token
│   │   └── SecurityConfig.java       # Spring Security rules
│   ├── mapper/                        # MyBatis mappers (DAO)
│   │   ├── UserMapper.java
│   │   ├── PostMapper.java
│   │   ├── CommentMapper.java
│   │   └── VoteMapper.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Post.java
│   │   ├── Comment.java
│   │   └── Vote.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── PostRequest.java
│   │   └── PageResponse.java         # pagination wrapper
│   └── WarzoneApplication.java       # Spring Boot entry point
│
└── resources/
    ├── application.yml               # Spring config, JWT secret/expiry
    └── mapper/
        ├── UserMapper.xml            # MyBatis SQL
        ├── PostMapper.xml
        ├── CommentMapper.xml
        └── VoteMapper.xml
```

---

## Running Locally

### Backend Setup

```bash
# 1. Create database
mysql -u root -p
CREATE DATABASE devboard;

# 2. Build & run (or use IDE)
cd backend
mvn clean install
mvn spring-boot:run

# Runs on http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

**Configuration** (`application.yml`):
```yaml
jwt:
  secret: your-256-bit-base64-encoded-secret
  expiration: 60000  # 1 minute in ms
```

### Frontend Setup

```bash
# 1. Install
cd frontend
npm install

# 2. Start dev server
npm run dev

# Runs on http://localhost:5173
```

**Backend URL** is hardcoded in `src/services/warzone.js`:
```javascript
const BASE_URL = 'http://localhost:8080'
```

---

## User Flows

### First-Time User: Discover & Sign Up
1. Visit dashboard → sees public feeds (GitHub, HN, npm, DEV.to, Clocks)
2. Tries to interact (vote, comment, share) → "Login" modal on War Stories tab
3. Clicks "Register" → enters username/password
4. After register → modal auto-closes, user now logged in
5. Can now vote, comment, create posts, access admin if role=ADMIN

### Regular User: Vote & Comment
1. Login with credentials
2. Browse War Stories → see other users' posts
3. Upvote/downvote → vote changes persisted, vote count updates
4. Click post → see comments, add new comment
5. Create new post → share story, choose tag
6. Own posts can be deleted (soft delete)
7. Edit profile → update bookmarks, preferences

### Admin: Moderate Content
1. Login as admin (role=ADMIN)
2. Click "Admin" tab (red text in navbar)
3. View all posts including soft-deleted ones (with 🗑 badge)
4. Restore soft-deleted posts → click "↺ Restore"
5. Permanently delete → click "Permanent" (irreversible)
6. Switch to "Users" tab → search by username
7. See user stats (role, join date) → can bulk delete all user's posts

### Expiring Session
1. User logged in, JWT issued with 1-min expiry
2. As expiry approaches → yellow warning banner appears
3. 15-second warning: "Your session is expiring soon" + "Re-login →" button
4. User can click button → login modal opens, can re-login
5. If ignored → auto-logout at expiry
6. Protected routes (Admin tab) disappear from navbar
7. Next API call → 401/403 → ErrorPage or prompt to login

---

## Key Implementation Details

### Soft Delete vs Hard Delete
- **Soft delete** (regular user delete): sets `post.deletedAt` timestamp, post still in DB
- **Show deleted posts**: only admins see soft-deleted posts with 🗑 badge, opacity reduced
- **Hard delete** (admin only): removes from DB completely, irreversible
- **Public feed**: excludes soft-deleted posts

### Vote System
- **One vote per user per post** — tracked in Vote table
- **Vote directions**: +1 (upvote) or -1 (downvote)
- **Toggle votes**: upvote again → cancels, vote count reverts
- **Switch votes**: downvote → upvote = vote count changes by 2

### Pagination
- Posts: 5 per page (War Stories), 10 per admin view
- Comments: 10 per post
- Response format: `{ data: [...], limit, skip, total }`

### Rate Limiting
- Backend enforces 429 Too Many Requests on high traffic
- Frontend catches 429 → shows orange warning banner
- User must wait 60s before retrying

### Token Expiry Management
1. JWT payload includes `exp` (seconds since epoch)
2. Backend sets expiry = now + 1 minute
3. Frontend parses on login → stores `expiresAt` (milliseconds)
4. Timers in Dashboard:
   - Show warning at `expiresAt - 15_000ms`
   - Auto-logout at `expiresAt`
5. Pre-flight check in `authFetch()`: if `Date.now() >= expiresAt` → logout before request

---

## Common Tasks

### Add a New Tag for War Stories
1. Add to backend enum / constant
2. Update `WarzonePanel.jsx` tag filter buttons
3. MySQL: no changes (tag is VARCHAR)

### Change JWT Expiry
1. Edit `application.yml`: `jwt.expiration: 300000` (5 mins)
2. Restart backend
3. Frontend auto-picks it up (parsed from token)

### Deploy to Production
1. Backend: build jar, deploy to cloud (Heroku, AWS, etc.)
2. Frontend: `npm run build` → dist folder, deploy to static host (Vercel, GitHub Pages, etc.)
3. Frontend `BASE_URL` should point to production backend
4. Enable CORS on backend for production domain

---

## Security Notes

- Passwords hashed (not shown in UI or API responses)
- JWT signed with secret key, validated on every request
- Soft delete prevents data loss but keeps audit trail
- ADMIN-only endpoints have `@PreAuthorize("hasRole('ADMIN')")`
- CSRF disabled (stateless JWT), CORS enabled for frontend origin
- No sensitive data in localStorage except JWT (standard practice)

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Admin gets logged out when switching tabs | Token expired → re-login via warning banner or re-login button |
| 403 Forbidden on admin endpoint | Not admin role, or token sent incorrectly |
| 401 Unauthorized | Token missing/expired → login again |
| Posts not loading | Backend down, check `http://localhost:8080` |
| Can't create post | Not logged in, rate limited, or post validation error |
| Votes not persisting | User not actually logged in, token expired |

---

## Git Commit History

| Commit | Description |
|---|---|
| `scaffold` | Vite + React + Tailwind setup |
| `feat/onboarding` | Auth (register/login), Redux store |
| `feat/dashboard` | Main shell, tab navigation |
| `feat/panels` | GitHub, HN, npm, DEV.to, Clocks, Bookmarks |
| `feat/warzone` | War Stories: posts, comments, votes |
| `feat/admin` | Admin panel, moderation |
| `fix/auth` | JWT expiry, session warnings, 403 handling |

---

## License

Built by Mihaela Catan
