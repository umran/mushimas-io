module.exports = async ({collection, model, projection, _id, client}) => {
  let doc = await model.findOne({ _id }, { ...projection, _id: 0 }).lean()

  await client.update({
    index: collection,
    type: collection,
    id: _id,
    body: {
      doc,
      doc_as_upsert: true
    }
  })
}
