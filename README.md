
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
EMAIL=ironman@onlyfans.wtf
PASS=Katarenai nemurenai toroimerai
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

Send a `POST` request to `/upload` with a multipart form containing a file.  

Example using `curl`:  
```sh
curl -X POST -F "file=@image.jpg" http://yourdomain.com/upload
```  

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
- [ ] Add multiple accounts support
- [ ] Proper logging (error and alerts)

## Contributing  
1. Fork the repository  
2. Create a new branch (`feature-web`)  
3. Commit your changes  
4. Open a pull request  


© [IRON-M4N](https://github.com/IRON-M4N)
