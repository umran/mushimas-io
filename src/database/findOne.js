const { formatResult } = require('./utils')

module.exports = async ({model, args}) => {
  return formatResult(await model.findOne(args).lean())
}
