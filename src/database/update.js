const { Document } = require('mushimas-models')
const flatten = require('../flatten')
const { ResourceError } = require('../errors')

const { filterUpdates, getFlatDraft } = require('./utils')

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection } = environment
  const { _id } = args
  const updates = filterUpdates(args)

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

  const document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      ...getFlatDraft(updates),
      '@lastModified': ackTime,
      '@lastCommitted': new Date(),
      '@draftPublished': false
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
