
# MegaCDN  
A lightweight and serverless CDN utilizing MEGA for file storage and delivery.  

## Installation  

### Clone the Repository  
```sh
git clone https://github.com/IRON-M4N/MegaCDN.git
cd MegaCDN
npm install
```

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

## **Uploading Files**  

Send a `POST` request to `/upload` with a multipart form containing a file.  

#### **Single Mode (Default)**  
Uploads the file using the default (first) account.  
```sh
curl -X POST -F "file=@image.jpg" -F "mode=single" http://yourdomain.com/upload
```

#### **Dual Mode (Specify Account)**  
Uploads the file to a specific account by providing an email.  
```sh
curl -X POST -F "file=@image.jpg" -F "mode=dual" -F "email=user@example.com" http://yourdomain.com/upload
```

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
