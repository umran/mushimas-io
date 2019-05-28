module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { key, results } = args

  await client.set(key, JSON.stringify(results))
}