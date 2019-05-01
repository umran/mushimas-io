const model = require('../model')
const { formatResult } = require('./utils')

const PARENT_PATH = '@document'

module.exports = async ({context, args}) => {
  const { bucket, collection } = context

  const finalArgs = {
    ...args,
    '@collection': collection,
    '@bucket': bucket
  }

  return formatResult(await model.findOne(finalArgs).lean())
}
