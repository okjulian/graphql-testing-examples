import { OperationDefinitionNode, parse } from 'graphql'
import { fieldQuery } from '../../src/resolvers'
import schema from '../fixtures/spacexSchema.json'

const fetchSchemaMock = jest.fn()
fetchSchemaMock.mockImplementation(() => schema)

test('Fetches and builds schema from API URL', async () => {
  const { query } = await fieldQuery({
    apiUrl: 'https://api.spacex.land/graphql/',
    field: 'missions',
  })
  expect(
    (parse(query).definitions[0] as OperationDefinitionNode).name.value
  ).toBe('Missions')
})
