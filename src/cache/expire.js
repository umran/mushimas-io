const { generateKey, getKeys } = require('./utils')

module.exports = client => async ({ environment, args }) => {
  const { type } = args

  switch(type) {
    case 'create':
      return await expireFindKeys(client)(environment, args)
    case 'update':
      return await expireAllKeys(client)(environment, args)
    case 'delete':
      return await expireAllKeys(client)(environment, args)
    case 'archive':
      return await expireAllKeys(client)(environment, args)
    case 'publish':
      return await expireAllKeys(client)(environment, args)
  }
}

const expireFindKeys = client => async (environment, args) => {
  const { collection, bucket } = environment

  const findKeys = await getKeys(client)('find', bucket.id, collection.id)

  const toExpire = findKeys.map(key => client.del(key))
  await Promise.all(toExpire)
}

const expireAllKeys = client => async (environment, args) => {
  const { collection, bucket } = environment
  const { _id } = args

  const findOneKey = generateKey('findOne', bucket.id, collection.id, { _id })

  const findKeys = await getKeys(client)('find', bucket.id, collection.id)

  let toExpire = findKeys.map(key => client.del(key))

  toExpire.push(client.del(findOneKey))
  await Promise.all(toExpire)
}