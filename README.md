
# MegaCDN  
A lightweight and serverless CDN utilizing MEGA for file storage and delivery.  

## Installation  

### Clone the Repository  
```sh
git clone https://github.com/IRON-M4N/MegaCDN.git
cd MegaCDN
npm install
```

## Deployments

#### Deploy To Heroku
1. *If You Don't Have a Heroku Account, [Create An Account](https://signup.heroku.com).*
2. *Now Deploy To Heroku.* <br>
[![Heroku](https://img.shields.io/badge/Heroku-000000?style=for-the-badge&logo=heroku&logoColor=white)](https://heroku.com/deploy?template=https://github.com/IRON-M4N/MegaCDN)

#### Deploy on Vercel
1. *[Create Vercel Account](https://vercel.com/signup) If You Don't Have.*
2. *Deploy on Vercel.* <br>
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FIRON-M4N%2FMegaCDN&env=MEGA_ACCOUNT,PORT&envDescription=provide%20multiple%20accounts%20in%20this%20format%20email%3Apass%3Bemail%3Apass%0Afor%20port%20use%203000%20or%20any)

#### Deploy To Railway
1. *If You Don't Have Railway Account, [Create First](https://railway.com).*
2. *Now Deploy The Repo.* <br>
[![Railway](https://img.shields.io/badge/Railway-000000?style=for-the-badge&logo=railway&logoColor=white)](https://railway.com/new)

#### Deploy on Render
1. *[Create Render Account](https://dashboard.render.com/register) If You Don't Have Any.*
2. *Deploy Now.* <br>
[![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?repo=https://github.com/IRON-M4N/MegaCDN)

#### Deploy on Koyeb
1. *[Create Account](https://app.koyeb.com/auth/signup) If You Don't Have.*
2. *Now Deploy.* <br>
[![Koyeb](https://img.shields.io/badge/Koyeb-000000?style=for-the-badge&logo=koyeb&logoColor=white)](https://app.koyeb.com/deploy?type=git&repository=github.com/IRON-M4N/MegaCDN&name=MegaCDN&builder=buildpack&env[MEGA_ACCOUNT]=email:pass&env[PORT]=3000&env[TEMP]=memory )

## Configuration  

Modify `config.js` or use environment variables. Example `.env` file:  

```
MEGA_ACCOUNT=email:pass;email:pass
TEMP=memory
```

## Running the Server  

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

 ``` sh
  curl -X POST -F "file=@image.jpg" -F "mode=single" http://yourdomain.com/upload
  ```
</details>

<details>
  <summary>Curl - Dual Mode</summary>

  ```sh
  curl -X POST -F "file=@image.jpg" -F "mode=dual" -F "email=user@example.com" http://yourdomain.com/upload
  ```
</details>

<details>
  <summary>Node.js - Single Mode</summary>

  ```js
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
  ```
</details>

<details>
  <summary>Node.js - Dual Mode</summary>

  ```js
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
  ```
</details>

### **Parameters Explained:**  
| Parameter  | Description |
|------------|-------------|
| `file` | The file to upload. |
| `mode` | Upload mode: `single` (default) or `dual` (requires `email`). |
| `email` | (Optional) Required if `mode=dual`, specifies which account to use. |

### Response Example  
```json
{
  "success": true,
  "files": [
    {
      "url": "https://yourdomain.com/media/blahblahblah",
      "size": 6969
    }
  ]
}
```  

## To-Do  
- [ ] Proper logging (error and alerts)
- [ ] Fix webpage

## Contributing  
1. Fork the repository  
2. Create a new branch (`feature-web`)  
3. Commit your changes  
4. Open a pull request  


© [IRON-M4N](https://github.com/IRON-M4N)
