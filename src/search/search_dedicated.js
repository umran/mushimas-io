const { createBody, hydrateResults } = require('./utils_dedicated')

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { query, _options: options } = args

  let results = await client.search({
    index: `${bucket.id}_${collection.id}`,
    type: `${bucket.id}_${collection.id}`,
    body: createBody(query, options)
  })

  return await hydrateResults(environment, results, options)
}