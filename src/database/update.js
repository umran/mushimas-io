const { Document } = require('mushimas-models')
const flatten = require('../flatten')
const { ResourceError } = require('../errors')

const { filterUpdates, getFlatDraft } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { documentArgs } = args
  const { _id } = documentArgs
  const updates = filterUpdates(documentArgs)

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
  }, { new: true })

  if (!document) {
    throw new ResourceError('notFound', 'the specified document could not be found')
  }

  return document
}