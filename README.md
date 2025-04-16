# MegaCDN

A lightweight and serverless CDN utilizing MEGA for file storage and delivery.

## Features

- File upload and delivery via MEGA storage
- Multiple account support (load balancing)
- Multiple Files and folder Upload Support
- Cool and Professional UI
- **Optional upload-protection** using `Authorization` Header
- **Optional auto-deletion** with configurable time periods
- Supports both `MongoDB` and `Json`
- Serverless deployment ready

## Installation

### Clone the Repository

```sh
git clone https://github.com/IRON-M4N/MegaCDN.git
cd MegaCDN
npm install
```

## Deployments

#### Deploy To Heroku

1. _If You Don't Have a Heroku Account, [Create An Account](https://signup.heroku.com)._
2. _Now Deploy To Heroku._ <br>
   [![Heroku](https://img.shields.io/badge/Heroku-000000?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com/deploy?template=https://github.com/IRON-M4N/MegaCDN)

#### Deploy on Vercel

1. _[Create Vercel Account](https://vercel.com/signup) If You Don't Have._
2. _Deploy on Vercel._ <br>
   [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FIRON-M4N%2FMegaCDN&env=MEGA_ACCOUNT,PORT&envDescription=provide%20multiple%20accounts%20in%20this%20format%20email%3Apass%3Bemail%3Apass%0Afor%20port%20use%203000%20or%20any)

#### Deploy To Railway

1. _If You Don't Have Railway Account, [Create First](https://railway.com)._
2. _Now Deploy The Repo._ <br>
   [![Railway](https://img.shields.io/badge/Railway-000000?style=for-the-badge&logo=railway&logoColor=white)](https://railway.com/new)

#### Deploy on Render

1. _[Create Render Account](https://dashboard.render.com/register) If You Don't Have Any._
2. _Deploy Now._ <br>
   [![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?repo=https://github.com/IRON-M4N/MegaCDN)

#### Deploy on Koyeb

1. _[Create Account](https://app.koyeb.com/auth/signup) If You Don't Have._
2. _Now Deploy._ <br>
   [![Koyeb](https://img.shields.io/badge/Koyeb-000000?style=for-the-badge&logo=koyeb&logoColor=white)](https://app.koyeb.com/deploy?type=git&repository=github.com/IRON-M4N/MegaCDN&name=MegaCDN&builder=buildpack&env[MEGA_ACCOUNT]=email:pass&env[PORT]=3000&env[TEMP]=memory)

## Configuration

Modify `config.js` or use environment variables. Example `.env` file:

```
MEGA_ACCOUNT=email:pass;email:pass  # Multiple accounts for load balancing
TEMP=memory                         # Upload storage option
AUTO_DELETE=true                    # Enable/disable auto-deletion
DELETE_TIME=1440                    # Minutes until deletion (default: 1 day)
MONGODB_URI=null                    # Optional MongoDB connection string
AUTHORIZATION=true                  # Enable/disable secure uploading
AUTH_TOKEN=YOUR_BEARER_TOKEN        # Bearer token for authentication
MAX_FILES=10                        # Maximum files per upload
MAX_FILE_SIZE=50                    # Maximum file size in MB
CACHE_TTL=3600                      # Cache duration in seconds
MAX_REQUESTS=100                    # Max upload requests in specific time
RATE_LIMIT=1 minute                 # 100 req per minute
```

## Starting the Server

Using PM2 for process management:

```sh
npm start
```

To stop or restart:

```sh
npm stop
npm restart
```

## Uploading Files

Send a POST request to /upload with a multipart form containing a file.

<details>
  <summary>Curl - Single Mode</summary>

```sh
# Single file without Authorization
 curl -X POST -F "file=@image.jpg" -F "mode=single" http://yourdomain.com/upload

# Multiple Files With Authorizatoin
 curl -X POST  -H "Authorization: Bearer YOUR_BEARER_TOKEN"  -F "file=@image1.jpg" -F "file=@image2.jpg" -F "mode=single" http://yourdomain.com/upload
```

</details>

<details>
  <summary>Curl - Dual Mode</summary>

```sh
# Single file without Authorization
curl -X POST -F "file=@image.jpg" -F "mode=dual" -F "email=user@example.com" http://yourdomain.com/upload

# Multiple Files With Authorizatoin
curl -X POST -H "Authorization: Bearer YOUR_BEARER_TOKEN"  -F "file=@image1.jpg" -F "file=@image2.jpg" -F "file=@image.jpg" -F "mode=dual" -F "email=user@example.com" http://yourdomain.com/upload
```

</details>

<details>
  <summary>Node.js - Single Mode</summary>

```js
// Single file without Authorization
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function uploadSingle() {
  const form = new FormData();
  form.append("file", fs.createReadStream("image.jpg"));
  form.append("mode", "single");

  const res = await axios.post("http://yourdomain.com/upload", form, {
    headers: form.getHeaders(),
  });

  console.log(res.data);
}

uploadSingle();

// Multiple Files with Authorization
async function uploadMultiple() {
  const form = new FormData();

  form.append("file", fs.createReadStream("image1.jpg"));
  form.append("file", fs.createReadStream("image2.png"));

  form.append("mode", "single");

  const headers = {
    ...form.getHeaders(),
    Authorization: "Bearer YOUR_BEARER_TOKEN",
  };

  try {
    const res = await axios.post("http://yourdomain.com/upload", form, { headers });
    console.log("Upload successful:", res.data);
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
  }
}

uploadMultiple();
```

</details>

<details>
  <summary>Node.js - Dual Mode</summary>

```js
// Single file without Authorization
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function uploadDual() {
  const form = new FormData();
  form.append("file", fs.createReadStream("image.jpg"));
  form.append("mode", "dual");
  form.append("email", "ironman@onlyfans.com");

  const res = await axios.post("http://yourdomain.com/upload", form, {
    headers: form.getHeaders(),
  });

  console.log(res.data);
}

uploadDual();

// Multiple Files with Authorization
async function uploadMultiple() {
  const form = new FormData();

  form.append("file", fs.createReadStream("image1.jpg"));
  form.append("file", fs.createReadStream("image2.png"));

  form.append("mode", "dual");
  form.append("email", "your@mega-account.com");

  const headers = {
    ...form.getHeaders(),
    Authorization: "Bearer YOUR_BEARER_TOKEN",
  };

  try {
    const res = await axios.post("http://yourdomain.com/upload", form, { headers });
    console.log("Upload successful:", res.data);
  } catch (error) {
    console.error("Upload failed:", error.response?.data || error.message);
  }
}

uploadMultiple();
```

</details>

### **Parameters Explained:**

| Parameter | Description                                                         |
| --------- | ------------------------------------------------------------------- |
| `file`    | The file to upload.                                                 |
| `mode`    | Upload mode: `single` (default) or `dual` (requires `email`).       |
| `email`   | (Optional) Required if `mode=dual`, specifies which account to use. |

### Response Example

```json
{
  "success": true,
  "files": [
    {
      "url": "https://your_domain.com/media/your_file",
      "name": "your_file.png",
      "size": 51470,
      "formattedSize": "50.26 KB",
      "expires": "86400 sec",
      "formattedExpires": "1 day"
    }
  ]
}
```

## To-Do

- [ ] Add custom file name
- [ ] Proper logging (error and alerts)

## Contributing

1. Fork the repository
2. Create a new branch (`feature-web`)
3. Commit your changes
4. Open a pull request

© [IRON-M4N](https://github.com/IRON-M4N)
