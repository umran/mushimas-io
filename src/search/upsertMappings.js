const createIndex = async (collection, client) => {
  try {
    await client.indices.create({ index: collection })
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

const createMapping = async (collection, mapping, client) => {
  await client.indices.putMapping({
    index: collection,
    type: collection,
    body: mapping
  })
}

module.exports = async ({mappings, schemas, client}) => {
  let upserts = []

  Object.keys(mappings).filter(schemaKey => schemas[schemaKey].class === 'collection')
    .forEach(collection => {
      upserts.push(new Promise(async (resolve, reject) => {

        try {
          await createIndex(collection, client)
          await createMapping(collection, mappings[collection](), client)
        } catch(err) {
          return reject(err)
        }

        resolve()
      }))

    })

  return Promise.all(upserts)
}
