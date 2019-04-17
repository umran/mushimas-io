module.exports = async ({model, collection, ackTime, args}) => {
  let document = await model.create({
    ...args,
    '@status': 'ARCHIVED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@collection': collection,
    '@version': 0
  })

  return document._id.toString()
}
