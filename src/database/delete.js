const deleteOptions = {
  new: true
}

module.exports = async ({model, ackTime, args}) => {
  const { _id } = args

  const matchCondition = { _id, '@lastModified': { $lte: ackTime }, '@state': { $ne: 'DELETED' } }

  let document = await model.findOneAndUpdate(matchCondition, {
    '@state': 'DELETED',
    '@lastModified': ackTime,
    '@lastCommitted': new Date(),
    $inc: {
      '@version': 1
    }
  }, deleteOptions)

  return _id
}
