const { extractDoc } = require('./utils')

const INDEX = 'mushimas_document'

module.exports = client => async ({ environment, args }) => {
  const { document } = args
  
  const { _id } = document

  await client.update({
    index: INDEX,
    type: INDEX,
    id: _id,
    body: {
      doc: extractDoc(document),
      doc_as_upsert: true
    }
  })
}