const { generateKey } = require('./utils')

const METHOD = 'findOne'

module.exports = client => async ({ environment, args }) => {
  const { collection, bucket } = environment

  const key = generateKey(METHOD, bucket.id, collection.id, args)

  return await client.get(key)
}