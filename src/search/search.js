const { createBody, hydrateResults } = require('./utils')

const INDEX = 'mushimas_document'

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { query, _options: options } = args

  let results = await client.search({
    index: INDEX,
    type: INDEX,
    body: createBody(environment, query, options)
  })

  return await hydrateResults(environment, results, options)
}