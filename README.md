# node-video-processing

Simple video processing API in Node developed to test 


### Config

- Create a `.env` file in the root (copy from `.env.example`)

- Set your AWS credentials, database and any other required/desired config in the `.env` file

- For any new config variable in the `.env` file you should set it in the `server/config/config.js` file in order to get it in the `app.config`

### Routes

`GET /`

Return a html page that loads a sample video in the stream.


`GET /video/:key`

Return a video stream

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Video stream
```


`POST /video`

Upload and process a video file

Send
```
  {
    file: "Video File"
  }
```

Return
```
 {
   path: STRING, processed file path
   s3: STRING, AWS S3 response text
 }
```