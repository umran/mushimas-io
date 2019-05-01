module.exports = async ({context, _id, client}) => {
  const { bucket, collection } = context

  await client.delete({
    index: `${bucket}_${collection}`,
    type: `${bucket}_${collection}`,
    id: _id,
    ignore: [404]
  })
}