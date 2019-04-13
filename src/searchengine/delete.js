module.exports = async ({modelKey, _id, client}) => {
  await client.delete({
    index: modelKey,
    type: modelKey,
    id: _id,
    ignore: [404]
  })
}