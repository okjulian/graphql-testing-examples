import {
  makeSchema,
  nonNull,
  objectType,
  stringArg,
  asNexusMethod,
  decorateType,
} from 'nexus'
import { Context } from './context'
import { JSONObjectResolver, JSONResolver } from 'graphql-scalars'
import { fieldQuery, fields } from './resolvers'

const Query = objectType({
  name: 'Query',
  definition(t) {
    t.nullable.field('fieldQuery', {
      type: 'GraphQLQuery',
      args: {
        apiUrl: nonNull(stringArg()),
        field: nonNull(stringArg()),
      },
      resolve: async (_parent, args, context: Context) => {
        await context.prisma.graphQLQuery.create({
          data: {
            apiUrl: args.apiUrl,
            field: args.field,
          },
        })
        return fieldQuery(args)
      },
    })
    t.nullable.list.field('fields', {
      type: 'String',
      args: {
        apiUrl: nonNull(stringArg()),
      },
      resolve: async (_parent, args, context: Context) => {
        return fields(args)
      },
    })
  },
})

const GraphQLQuery = objectType({
  name: 'GraphQLQuery',
  definition(t) {
    t.nonNull.string('query')
    t.nonNull.string('variables')
  },
})

const JsonObject = asNexusMethod(JSONObjectResolver, 'json')
const Json = decorateType(JSONResolver, {
  sourceType: 'JSON',
  asNexusMethod: 'json',
})

export const schema = makeSchema({
  types: [Query, GraphQLQuery, Json, JsonObject],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})
