const { Document } = require('mushimas-models')

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection } = environment
  const { _id } = args

  let options = {
    new: true
  }

  if (session) {
    options = {
      ...options,
      session
    }
  }

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  await Document.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, options)

  return _id
}
