const { Document } = require('mushimas-models')
const { generateHash } = require('mushimas-crypto')

module.exports = async ({ environment, args }) => {
  const { bucket, collection, idempotencyKey } = environment

  const initialHash = generateHash(JSON.stringify(args))

  let options = {
    upsert: true,
    new: true
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
    '@lastModified': new Date(),
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@idempotencyKey': idempotencyKey,
    '@initialHash': initialHash
  }, options)

  return document._id.toString()
}
