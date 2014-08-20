[![Build Status](https://travis-ci.org/madhums/node-express-mongoose-demo.png)](https://travis-ci.org/madhums/node-express-mongoose-demo)

# Ching Project

**NOTE:** You need to have node.js, mongodb and [imagemagick](http://www.imagemagick.org/script/index.php) installed and running.

```sh
  $ git clone git://github.com/madhums/node-express-mongoose-demo.git
  $ npm install
  $ cp config/config.example.js config/config.js
  $ cp config/imager.example.js config/imager.js
  $ npm start
```

**NOTE:** Do not forget to update your facebook twitter and github APP_ID and APP_SECRET in `config/config.js`. Also if you want to use image uploads, don't forget to replace the S3 and Rackspace keys in `config/imager.js`.

Then visit [http://localhost:3000/](http://localhost:3000/)

## Related modules

1. [node-genem](https://github.com/madhums/node-genem) A module to generate the MVC skeleton using this approach.
2. [node-notifier](http://github.com/madhums/node-notifier) - used for notifications via emails and push notificatiions
3. [node-imager](http://github.com/madhums/node-imager) - used to resize, crop and upload images to S3/rackspace
4. [node-view-helpers](http://github.com/madhums/node-view-helpers) - some common view helpers
5. [mongoose-migrate](https://github.com/madhums/mongoose-migrate#readme) - Keeps track of the migrations in a mongodb collection (fork of visionmedia/node-migrate)
6. [mongoose-user](http://github.com/madhums/mongoose-user) - Generic methods, statics and virtuals used for user schemas

## Directory structure
```
-app/
  |__controllers/
  |__models/
  |__mailer/
  |__views/
-config/
  |__routes.js
  |__config.js
  |__passport.js (auth config)
  |__imager.js (imager config)
  |__express.js (express.js configs)
  |__middlewares/ (custom middlewares)
-public/
```

## Tests

```sh
$ npm test
```