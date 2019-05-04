const { Document } = require('mongoose-models')

const deleteOptions = {
  new: true
}

module.exports = async ({environment, ackTime, args}) => {
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
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, deleteOptions)

  return _id
}
