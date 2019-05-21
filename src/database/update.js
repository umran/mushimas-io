const { Document } = require('mushimas-models')
const flatten = require('../flatten')
const { ResourceError } = require('../errors')

const { filterUpdates, getFlatDraft } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _id } = args
  const updates = filterUpdates(args)

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  const document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      ...getFlatDraft(updates),
      '@lastModified': new Date(),
      '@draftPublished': false
    }
  })

  if (!document) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  return _id
}