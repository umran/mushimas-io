const { Document } = require('mushimas-models')
const { formatDraftResult } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _id } = args

  const finalArgs = {
    _id,
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@state': { $ne: 'DELETED' }
  }

  return formatDraftResult(await Document.findOne(finalArgs).lean())
}