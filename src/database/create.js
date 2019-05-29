const { Document } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment

  const { documentArgs } = args

  const document = await Document.create({
    '@document': documentArgs,
    '@draft': documentArgs,
    '@draftPublished': true,
    '@state': 'PUBLISHED',
    '@lastModified': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  })

  return document
}
