
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..')
  , templatePath = path.normalize(__dirname + '/../app/mailer/templates')
  , notifier = {
      service: 'postmark',
      APN: false,
      email: false, // true
      actions: ['comment'],
      tplPath: templatePath,
      key: 'POSTMARK_KEY',
      parseAppId: 'PARSE_APP_ID',
      parseApiKey: 'PARSE_MASTER_KEY'
    }

module.exports = {
  production: {
    db: process.env.MONGOLAB_URI,
    root: rootPath,
    notifier: notifier,
    app: {
      name: 'Ching'
    },
    keen: {
      projectId: "54b72ef6e0855733bcd83bcf",
      writeKey: "f0a05ba9baed3002460ef23925e13b13e6cd305e7d6558c7d1c33a1a3731ebac68dd1844ef64997e70120e96c98e49361bde59e21b04d6b5b9a6959198f1296dfff54d432b71f8d5deec13c770d340260aaf6d6d21c95f6b34383285870516c9c5c59b67b344b532b5a5f674240caa5a",
      readKey: "2a76d97406482fa3ce11e333248155de725ac956da78a92d10189dc40cf3d817b721ccb961ee451be529089a8de5fdf3d0e0c44800f725e9f727d23f34a465f621b592781dca74215b3ce47aad77f10684ce1e0fcb0f12992093ce9ec00c5ae5340c6f8881252d47d2f823a4fbaac5e1",
      masterKey: "F3A8214043E9238B37F1CA15EB46697F"
    },
    rootHost:'http://ching.io',
    port:'80',//not required but placed for consistency
    facebook: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    twitter: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/twitter/callback"
    },
    github: {
      clientID: 'APP_ID',
      clientSecret: 'APP_SECRET',
      callbackURL: 'http://localhost:3000/auth/github/callback'
    },
    google: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
    linkedin: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/linkedin/callback"
    },
    sendgrid:{
       api_user: 'jeffj'
      ,api_key: 'rambert'
    }
  },
  development: {
    db: 'mongodb://localhost/ching',
    root: rootPath,
    notifier: notifier,
    app: {
      name: 'Ching'
    },
    keen: {
      projectId: "54724e5dc9e16362d5e8880a",
      writeKey: "a4071802c282882fdd1dcd7689007e77024590f4627f520f249de08c436f323152976c0cdb26edf30f9dd23b47668176fd4bb38b207f3473817ac3b3dbf821aa30422bb3cf8623c4b51b4d8b3d2c0b72df8d3d0f1665816cbb7685b5dc42f65a1d5010a5206c62acf60e8fa4503b71b1",
      readKey: "dfcb7a388c733253fff67871b31e2308385b13ee008c31c4716b27cf80fae97be2856bf1c2df15737ccc6228f056419a11db2762642a1f0fe389463ac67b2c9466f698b3149b950171781a789f5ed3e35ee88bf79986b8ac863b41f4c7ccee1b99a107cebb44d1b132687de20074c516",
      masterKey: "E2D1D0774E040F59EBDA3032265834AC"
    },
    port:'4000',
    rootHost:'http://localhost:4000',
    facebook: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    twitter: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/twitter/callback"
    },
    github: {
      clientID: 'APP_ID',
      clientSecret: 'APP_SECRET',
      callbackURL: 'http://localhost:3000/auth/github/callback'
    },
    google: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
    linkedin: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/linkedin/callback"
    },
    sendgrid:{
       api_user: 'jeffj'
      ,api_key: 'rambert'
    }
  },
  test: {
    db: 'mongodb://localhost/noobjs_test',
    root: rootPath,
    notifier: notifier,
    app: {
      name: 'Ching'
    },
    facebook: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    twitter: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/twitter/callback"
    },
    github: {
      clientID: 'APP_ID',
      clientSecret: 'APP_SECRET',
      callbackURL: 'http://localhost:3000/auth/github/callback'
    },
    google: {
      clientID: "APP_ID",
      clientSecret: "APP_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback"
    },
    linkedin: {
      clientID: "CONSUMER_KEY",
      clientSecret: "CONSUMER_SECRET",
      callbackURL: "http://localhost:3000/auth/linkedin/callback"
    }
  }
}
