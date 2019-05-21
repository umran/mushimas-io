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

  let document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': new Date()
    }
  })

  if (!document) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  return _id
}
