const { generateKey } = require('./utils')

const METHOD = 'find'

module.exports = client => async ({ environment, args }) => {
  const { collection, bucket } = environment

  const key = generateKey(METHOD, bucket.id, collection.id, args)

  const results = await client.get(key)

  if (results) {
    return {
      key,
      results: JSON.parse(results)
    }
  }

  return {
    key
  }
}