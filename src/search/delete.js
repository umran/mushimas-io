module.exports = async ({collection, _id, client}) => {
  await client.delete({
    index: collection,
    type: collection,
    id: _id,
    ignore: [404]
  })
}