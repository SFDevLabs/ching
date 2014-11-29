module.exports = {
  variants: {
    article: {
      resize: {
        detail: "800x600"
      },
      crop: {
        
      },
      resizeAndCrop: {
        thumb: {resize: "100x100", crop: "800x600"},
        mini: {resize: "200x150", crop: "800x600"}
      }
    },

    gallery: {
      crop: {
        thumb: "100x100"
      }
    }
  },

  storage: {
    Rackspace: {
      auth: {
        username: "USERNAME",
        apiKey: "API_KEY",
        host: "lon.auth.api.rackspacecloud.com"
      },
      container: "CONTAINER_NAME"
    },
    S3: {
      key: 'AKIAITZFPMBD2GIZM5PA',
      secret: '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',
      bucket: 'chingapp',
     // region: 'US Standard'
    }
  },

  debug: false
}
