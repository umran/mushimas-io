const model = require('../model')

const deleteOptions = {
  new: true
}

module.exports = async ({context, ackTime, args}) => {
  const { bucket, collection } = context
  const { _id } = args

  const matchCondition = { 
    _id,
    '@lastModified': { $lte: ackTime },
    '@state': { $ne: 'DELETED' },
    '@collection': collection,
    '@bucket': bucket
  }

  let document = await model.findOneAndUpdate(matchCondition, {
    $set: {
      '@state': 'DELETED',
      '@lastModified': ackTime,
      '@lastCommitted': new Date()
    },
    $inc: {
      '@version': 1
    }
  }, deleteOptions)

  return _id
}
