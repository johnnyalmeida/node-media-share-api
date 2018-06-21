# node-media-share-api

Simple API developed for testing purposes


## Config

- Create a `.env` file in the root (copy from `.env.example`)

- Set your AWS credentials, database and any other required/desired config in the `.env` file

- For any new config variable in the `.env` file you should set it in the `server/config/config.js` file in order to get it in the `app.config`

## Routes

### `GET /`

Returns the API status

### `GET /feed/`

Return the main feed

Return a list of arrays of objects
```
[
  [
    {
      'file key' // String
      'file type' // String { 'image' | 'video' }
    }
  ]
]
```

### `POST /history`

Upload and process a file

Body
```
  {
    file: STRING, the file base64 string,
    type: STRING, { 'image' | 'video' } the file type
  }
```

Return
```
 {
   key: STRING, processed file key
 }
```

### `GET /video/`

Returns a list of videos


Return JSON
```
  {
    'video-key' // String
  }
```

### `GET /video/stream/:key`

Returns a video stream

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Video stream
```


### `GET /image/`

Returns a list of images


Return JSON
```
  {
    'image-key' // String
  }
```

### `GET /image/thumb/:key`

Returns an image thumbnail

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Image
```

### `GET /image/original/:key`

Returns an image

Param
```
  "key"  | STRING, the  file name
```

Return 
```
  Image
```
