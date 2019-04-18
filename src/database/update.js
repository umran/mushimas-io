const { filterUpdates } = require('./utils')

const updateOptions = {
  runValidators: true,
  new: true
}

module.exports = async ({model, ackTime, args}) => {
  const { _id } = args
  const updates = filterUpdates(args)

  const matchCondition = { _id, '@lastModified': { $lte: ackTime }, '@state': { $ne: 'DELETED' } }

  let document = await model.findOneAndUpdate(matchCondition, {
    ...updates,
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    $inc: {
      '@version': 1
    }
  }, updateOptions)

  return _id
}
