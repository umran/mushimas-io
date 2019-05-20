const { Document } = require('mushimas-models')
const { ResourceError } = require('../errors')

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection } = environment
  const { _id } = args

  let options

  if (session) {
    options = { session }
  }

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  // query database twice to get around inability to reference existing field vaulues within the update operation
  let existingDoc = await Document.findOne(matchCondition, { '@draft': 1 }).lean()

  if (!existingDoc) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  let document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      '@document': existingDoc['@draft'],
      '@draftPublished': true,
      '@state': 'PUBLISHED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  if (!document) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  return _id
}