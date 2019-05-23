const { Document } = require('mushimas-models')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment

  const document = await Document.create({
    '@document': args,
    '@draft': args,
    '@draftPublished': true,
    '@state': 'PUBLISHED',
    '@lastModified': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  })

  return document._id.toString()
}
