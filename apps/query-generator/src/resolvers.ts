import { buildClientSchema, print } from 'graphql'
import { fetchSchema, generateQuery } from './graphql'

export async function fieldQuery(args: { apiUrl: string; field: string }) {
  const introspection = await fetchSchema(args.apiUrl)
  const schema = buildClientSchema(introspection)
  const field = schema.getQueryType().getFields()[args.field]
  const { variables, query } = generateQuery({
    schema,
    field,
    enums: true,
    lists: true,
    objects: true,
    scalars: true,
  })
  return {
    variables: JSON.stringify(variables),
    query: print(query),
  }
}

export async function fields(args: { apiUrl: string }) {
  const introspection = await fetchSchema(args.apiUrl)
  const schema = buildClientSchema(introspection)
  return Object.values(schema.getQueryType().getFields()).map(
    ({ name }) => name
  )
}
