const model = require('../model')
const flatten = require('../flatten')

const { filterUpdates } = require('./utils')

const updateOptions = {
  runValidators: true,
  new: true
}

const PARENT_PATH = '@document'

const getFlatDoc = args => flatten({ [PARENT_PATH]: args })

module.exports = async ({context, ackTime, args}) => {
  const { bucket, collection } = context
  const { _id } = args
  const updates = filterUpdates(args)

  const matchCondition = { 
    _id,
    '@lastModified': { $lte: ackTime },
    '@state': { $ne: 'DELETED' },
    '@collection': collection,
    '@bucket': bucket
  }

  let document = await model.findOneAndUpdate(matchCondition, {
    $set: {
      ...getFlatDoc(updates),
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, updateOptions)

  return _id
}
