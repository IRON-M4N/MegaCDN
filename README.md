<h1 align="center">
  $\textcolor{red}{Mega}\textcolor{white}{CDN}$
</h1>

A lightweight and serverless CDN utilizing MEGA for file storage and delivery.

---

## Features

- Stores in mega.nz cloud 
- Multi-account load balancing
- PostgreSQL, MongoDB, SQLite support
- Auto-delete & auth token
- Rate limit & size check
- Shortened filenames
---

#### DEPLOY TO HEROKU

1. If you don’t have an account on Heroku, create one.  
   <br>
   <a href="https://signup.heroku.com/" target="_blank">
     <img alt="Create Heroku" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=heroku&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://heroku.com/deploy?template=https://github.com/IRON-M4N/MegaCDN" target="_blank">
     <img alt="Deploy Heroku" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=heroku&logoColor=white"/>
   </a>

#### DEPLOY TO VERCEL

1. If you don’t have an account on Vercel, create one.  
   <br>
   <a href="https://vercel.com/signup" target="_blank">
     <img alt="Create Vercel" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=vercel&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FIRON-M4N%2FMegaCDN" target="_blank">
     <img alt="Deploy Vercel" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=vercel&logoColor=white"/>
   </a>

#### DEPLOY TO RAILWAY

1. If you don’t have an account on Railway, create one.  
   <br>
   <a href="https://railway.app" target="_blank">
     <img alt="Create Railway" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=railway&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://railway.app/new" target="_blank">
     <img alt="Deploy Railway" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=railway&logoColor=white"/>
   </a>

#### DEPLOY TO RENDER

1. If you don’t have an account on Render, create one.  
   <br>
   <a href="https://dashboard.render.com/register" target="_blank">
     <img alt="Create Render" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=render&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://render.com/deploy?repo=https://github.com/IRON-M4N/MegaCDN" target="_blank">
     <img alt="Deploy Render" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=render&logoColor=white"/>
   </a>

#### DEPLOY TO KOYEB

1. If you don’t have an account on Koyeb, create one.  
   <br>
   <a href="https://app.koyeb.com/auth/signup" target="_blank">
     <img alt="Create Koyeb" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=koyeb&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://app.koyeb.com/deploy?type=git&repository=github.com/IRON-M4N/MegaCDN" target="_blank">
     <img alt="Deploy Koyeb" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=koyeb&logoColor=white"/>
   </a>

#### DEPLOY TO REPLIT

1. If you don’t have an account on Replit, create one.  
   <br>
   <a href="https://replit.com/signup" target="_blank">
     <img alt="Create Replit" src="https://img.shields.io/badge/-Create-black?style=for-the-badge&logo=replit&logoColor=white"/>
   </a>

2. Now deploy:  
   <br>
   <a href="https://replit.com/github/IRON-M4N/MegaCDN" target="_blank">
     <img alt="Deploy Replit" src="https://img.shields.io/badge/-Deploy-black?style=for-the-badge&logo=replit&logoColor=white"/>
   </a>

## Installation

```bash
git clone https://github.com/IRON-M4N/MegaCDN.git
cd MegaCDN
npm install
cp .env.example .env
npm run build
npm start
````

---

## API Endpoints

| Method | Endpoint       | Description                  |
| ------ | -------------- | ---------------------------- |
| `POST` | `/upload`      | Upload files                 |
| `GET`  | `/file/:name`  | Serve file by custom CDN URL |
| `GET`  | `/media/:name` | Original MEGA URL            |
| `GET`  | `/info`        | Server info                  |
| `GET`  | `/health`      | Health check                 |

**Example:**

```bash
curl -X POST -F "file=@image.jpg" http://cdn.yourdomain.com/upload
```

---

## Upload Modes

```bash
# Single mode (default)
curl -X POST -F "file=@file.jpg" http://cdn.yourdomain.com/upload

# Dual mode (specify MEGA email)
curl -X POST -F "file=@file.jpg" -F "mode=dual" -F "email=user@mega.com" http://cdn.yourdomain.com/upload

# With Auth
curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

---

## Example Response

```json
{
  "success": true,
  "files": [
    {
      "url": "https://cdn.yourdomaincom/media/abcDEF123.png",
      "name": "skirk.png",
      "size": 1523200,
      "formattedSize": "1.45 MB",
      "mime": "image/png",
      "expires": "1800s",
      "formattedExpires": "30 minutes"
    }
  ]
}

```

---

## Security

* Optional Bearer token auth
* Rate limit per window
* File size/type validation
* Auto-delete with TTL

---

## Contributing

1. Fork this repo
2. Create a branch `feature-xyz`
3. Commit & push
4. Open a pull request
---

<div align="center">

\$\frac{\text{Made with } \heartsuit \text{ by IRON-M4N}}{\text{2025 - 6969}}\$

</div>