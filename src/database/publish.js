const { Document } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _id } = args

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  // query database twice to get around inability to reference existing field vaulues within an atomic update operation
  let existingDoc = await Document.findOne(matchCondition, { '@draft': 1 }).lean()

  if (!existingDoc) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  let document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      '@document': existingDoc['@draft'],
      '@draftPublished': true,
      '@state': 'PUBLISHED',
      '@lastModified': new Date()
    }
  })

  if (!document) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  return _id
}