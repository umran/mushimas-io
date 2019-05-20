const { Document } = require('mushimas-models')
const { generateHash } = require('mushimas-crypto')

module.exports = async ({environment, ackTime, args, session}) => {
  const { bucket, collection, idempotencyKey } = environment

  const initialHash = generateHash(JSON.stringify(args))

  let options = {
    upsert: true,
    new: true
  }
  
  if (session) {
    options = {
      ...options,
      session
    }
  }

  const matchCondition = {
    '@state': { $ne: 'DELETED' },
    '@bucketId': bucket.id,
    '@collectionId': collection.id,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash
  }

  const document = await Document.findOneAndUpdate(matchCondition, {
    '@document': args,
    '@draft': args,
    '@draftPublished': true,
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
