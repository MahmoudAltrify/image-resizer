// src/handler.localTest.js
const resizeImage = require('./handler').resizeImage;

resizeImage({
    Records: [{
        s3: {
            bucket: { name: 'local-bucket-source' },
            object: { key: 'test.png' }
        }
    }]
});