const { Document } = require('mushimas-models')
const { formatResult } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _id } = args

  const finalArgs = {
    _id,
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  return formatResult(await Document.findOne(finalArgs).lean())
}
