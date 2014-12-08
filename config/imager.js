module.exports = {
  variants: {
    article: {
      resize: {
        detail: "800x600"
      },
      crop: {
        
      },
      resizeAndCrop: {
        thumb: {resize: "133x133", crop: "100x100"}
      }
    },
    user: {
      resize: {
        user_thumb: "250x250"
      },
      crop: {
        
      },
      resizeAndCrop: {
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
      bucket: 'chingimgs',
     // region: 'US Standard'
    }
  },

  debug: false
}
