const createIndex = async (modelKey, client) => {
  try {
    await client.indices.create({ index: modelKey })
  } catch (err) {
    if (err.response) {
      const response = JSON.parse(err.response)
      if (response.error && response.error.type === 'resource_already_exists_exception') {
        return
      }
    }

    throw err
  }
}

const createMapping = async ({modelKey, mapping, client}) => {
  await client.indices.putMapping({
    index: modelKey,
    type: modelKey,
    body: mapping
  })
}

module.exports = async (mappings, schemas, client) => {
  let upserts = []

  Object.keys(mappings).filter(schemaKey => schemas[schemaKey].class === 'collection')
    .forEach(modelKey => {
      upserts.push(new Promise(async (resolve, reject) => {

        try {
          await createIndex(modelKey, client)
          await createMapping(modelKey, mappings[modelKey](), client)
        } catch(err) {
          return reject(err)
        }

        resolve()
      }))

    })

  return Promise.all(upserts)
}
