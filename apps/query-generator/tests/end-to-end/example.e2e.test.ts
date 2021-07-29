import { server } from '../../src/server'
import fetch from 'isomorphic-unfetch'
import { ServerInfo } from 'apollo-server'
import { rest } from 'msw'
import schema from '../fixtures/spacexSchema.json'
import { setupServer } from 'msw/node'
import { context } from '../../src/context'

const apiUrl = 'https://api.spacex.land/graphql/'

const mockServer = setupServer(
  // Mock introspection query
  rest.post(apiUrl, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(schema))
  })
)

let serverInfo: ServerInfo

beforeAll(async () => {
  serverInfo = await server.listen()
  mockServer.listen({ onUnhandledRequest: 'bypass' })
})

afterAll(async () => {
  await server.stop()
  mockServer.close()
})

beforeEach(async () => {
  await context.prisma.graphQLQuery.deleteMany()
})

afterEach(async () => {
  await context.prisma.graphQLQuery.deleteMany()
  await context.prisma.$disconnect()
})

test('persists API URL and field to database', async () => {
  const query = `query FieldQuery($apiUrl: String!, $field: String!){
        fieldQuery(
          apiUrl: $apiUrl,
          field: $field
        ) {
          query
          variables
        }
      }
      `
  const variables = {
    apiUrl,
    field: 'missions',
  }
  await fetch(serverInfo.url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  expect(await (await context.prisma.graphQLQuery.findMany()).length).toBe(1)
})
