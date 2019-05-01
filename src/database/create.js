const model = require('../model')

const PARENT_PATH = '@document'

module.exports = async ({context, ackTime, args}) => {
  const { bucket, collection } = context

  let document = await model.create({
    [PARENT_PATH]: args,
    '@state': 'ARCHIVED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    '@collection': collection,
    '@bucket': bucket,
    '@version': 0
  })

  return document._id.toString()
}
