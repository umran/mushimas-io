const _findByIdList = require('../database/_findByIdList')
const { createBody, hydrateResults } = require('./utils_dedicated')

const INDEX = 'mushimas_document'

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { query, _options: options } = args

  let results = await client.search({
    index: INDEX,
    type: INDEX,
    body: createBody(query, options)
  })

  return await hydrateResults(environment, results, options)
}