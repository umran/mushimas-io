const { Document } = require('mushimas-models')
const flatten = require('../flatten')
const { ResourceError } = require('../errors')

const { filterUpdates } = require('./utils')

const PARENT_PATH = '@document'

const getFlatDoc = args => flatten({ [PARENT_PATH]: args })

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
      ...getFlatDoc(updates),
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
