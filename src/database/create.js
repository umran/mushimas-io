const { Document } = require('mushimas-models')
const { generateHash } = require('mushimas-crypto')

const PARENT_PATH = '@document'

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection, idempotencyKey } = environment

  const initialHash = generateHash(JSON.stringify(args))

  let options = {
    upsert: true
  }
  
  if (session) {
    options = {
      ...options
      session
    }
  }

  const matchCondition = {
    '@bucketId': bucket.id,
    '@collectionId': collection.id,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash
  }

  const document = await Document.findOneAndUpdate(matchCondition, {
    [PARENT_PATH]: args,
    '@state': 'PUBLISHED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash,
    '@version': 0
  }, options)

  return document._id.toString()
}
