const { Document } = require('mushimas-models')

const PARENT_PATH = '@document'

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection } = environment

  let options
  
  if (session) {
    options = { session }
  }

  const document = await Document.create([{
    [PARENT_PATH]: args,
    '@state': 'PUBLISHED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@version': 0
  }], options)

  return document[0]._id.toString()
}
