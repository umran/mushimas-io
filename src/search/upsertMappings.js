const createIndex = async (index, client) => {
  try {
    await client.indices.create({ index })
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

const createMapping = async (index, mapping, client) => {
  await client.indices.putMapping({
    index,
    type: index,
    body: mapping
  })
}

module.exports = async ({context, mappings, schemas, client}) => {
  const { bucket } = context
  let upserts = []

  Object.keys(mappings).filter(schemaKey => schemas[schemaKey].class === 'collection')
    .forEach(collection => {
      upserts.push(new Promise(async (resolve, reject) => {

        try {
          await createIndex(`${bucket}_${collection}`, client)
          await createMapping(`${bucket}_${collection}`, mappings[collection](), client)
        } catch(err) {
          return reject(err)
        }

        resolve()
      }))

    })

  return Promise.all(upserts)
}
