const { Document } = require('mushimas-models')

const PARENT_PATH = '@document'

module.exports = async ({environment, ackTime, args}) => {
  const { bucket, collection } = environment

  let document = await Document.create({
    [PARENT_PATH]: args,
    '@state': 'ARCHIVED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@version': 0
  })

  return document._id.toString()
}
