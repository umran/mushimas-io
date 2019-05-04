const { Document } = require('mongoose-models')
const flatten = require('../flatten')

const { filterUpdates } = require('./utils')

const updateOptions = {
  runValidators: true,
  new: true
}

const PARENT_PATH = '@document'

const getFlatDoc = args => flatten({ [PARENT_PATH]: args })

module.exports = async ({environment, ackTime, args}) => {
  const { bucket, collection } = environment
  const { _id } = args
  const updates = filterUpdates(args)

  const matchCondition = {
    _id,
    '@state': { $ne: 'DELETED' },
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  let document = await Document.findOneAndUpdate(matchCondition, {
    $set: {
      ...getFlatDoc(updates),
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, updateOptions)

  return _id
}
