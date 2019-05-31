const _findByIdList = require('../database/_findByIdList')
const { createBody, hydrateResults } = require('./utils_dedicated')

const INDEX = 'mushimas_document'

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { query, _options: options } = args

  // debugging
  const body = createBody(environment, query, options)
  console.log(JSON.stringify(body))

  let results = await client.search({
    index: INDEX,
    type: INDEX,
    body: createBody(environment, query, options)
  })

  return await hydrateResults(environment, results, options)
}