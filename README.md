# node-video-processing

Simple API developed for testing purposes


## Config

- Create a `.env` file in the root (copy from `.env.example`)

- Set your AWS credentials, database and any other required/desired config in the `.env` file

- For any new config variable in the `.env` file you should set it in the `server/config/config.js` file in order to get it in the `app.config`

## Routes

### `GET /`

Returns a html page that loads a sample video in the stream.



### `GET /video/`

Returns a list of videos


Return JSON
```
  {
    'video-key' // String
  }
```

### `GET /video/:key`

Returns a video stream

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Video stream
```


### `POST /video`

Upload and process a video file

Body
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


### `GET /image/`

Returns a list of images


Return JSON
```
  {
    'image-key' // String
  }
```

### `GET /image/:key`

Returns an image

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Image
```

### `POST /image`

Upload and process an image file

Body
```
  {
    file: "Image File"
  }
```

Return
```
 {
   path: STRING, processed file path
   s3: STRING, AWS S3 response text
 }
```