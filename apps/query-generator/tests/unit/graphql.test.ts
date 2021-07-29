import { buildClientSchema, IntrospectionQuery, parse, print } from 'graphql'
import { generateQuery } from '../../src/graphql'
import introspectionQuery from '../fixtures/graphqlSchema.json'
import pokeIntrospectionQuery from '../fixtures/pokemonSchema.json'

const schema = buildClientSchema(
  introspectionQuery as unknown as IntrospectionQuery
)

const pokeSchema = buildClientSchema(
  pokeIntrospectionQuery as unknown as IntrospectionQuery
)

test('generates object query', () => {
  const field = schema.getQueryType().getFields()['asset']
  const { query } = generateQuery({
    schema,
    field,
    scalars: true,
    enums: true,
  })
  const expected = parse(`query Asset($where:  AssetWhereUniqueInput!) {
    asset(where: $where) {
      stage
      locale
      id
      createdAt
      updatedAt
      publishedAt
      handle
      fileName
      height
      width
      size
      mimeType
      url
    }
  }`)
  expect(print(query)).toEqual(print(expected))
})

// TODO: Fix functionality. Keep test as is, it's working fine.
//
// Generates invalid query because help_item and moves should have subselections
// They don't have subselections because they only have object fields
//
// We'd need to either
// - Go deep until we have a scalar leaf, but this could be a deadend for self-referencing queries (not this case, I think)
// - Skip this field since it does not have valid children
test.skip('generates valid poke object query', () => {
  const field = pokeSchema.getQueryType().getFields()['pokemon']
  const { query } = generateQuery({
    schema,
    field,
    scalars: true,
    enums: true,
    lists: true,
  })
  const expected = parse(`query Pokemon($name: String!) {
      pokemon(name: $name) {
        abilities {
          is_hidden
          slot
      }
      base_experience
      forms {
          url
          name
      }
      game_indices {
          game_index
      }
      height
      held_items
      id
      is_default
      location_area_encounters
      moves
      name
      order
      stats {
          base_stat
          effort
      }
      types {
          slot
      }
      weight
      status
      message
  }
}
  `)
  expect(print(query)).toEqual(print(expected))
})

test('generates scalars-only list query', () => {
  const field = schema.getQueryType().getFields()['assets']
  const { query } = generateQuery({
    schema,
    field,
    scalars: true,
    enums: true,
  })
  expect(print(query)).toEqual(
    print(
      parse(`query Assets {
    assets {
      stage
      locale
      id
      createdAt
      updatedAt
      publishedAt
      handle
      fileName
      height
      width
      size
      mimeType
      url
    }
  }`)
    )
  )
})

test('generates list query with sublists', () => {
  const field = schema.getQueryType().getFields()['assets']
  const { query } = generateQuery({
    schema,
    field,
    scalars: true,
    enums: true,
    lists: true,
  })
  expect(print(query)).toEqual(
    print(
      parse(`query Assets {
        assets {
          stage
          locale
          localizations {
            stage
            locale
            id
            createdAt
            updatedAt
            publishedAt
            handle
            fileName
            height
            width
            size
            mimeType
            url
          }
          documentInStages {
            stage
            locale
            id
            createdAt
            updatedAt
            publishedAt
            handle
            fileName
            height
            width
            size
            mimeType
            url
          }
          id
          createdAt
          updatedAt
          publishedAt
          handle
          fileName
          height
          width
          size
          mimeType
          productImages {
            stage
            locale
            id
            createdAt
            updatedAt
            publishedAt
            name
            slug
            description
            price
          }
          history {
            id
            stage
            revision
            createdAt
          }
          url
        }
      }`)
    )
  )
})

test('generates default variables', () => {
  const field = schema.getQueryType().getFields()['asset']
  const { variables } = generateQuery({
    schema,
    field,
    scalars: true,
    enums: true,
  })
  expect(variables).toEqual({
    where: {
      id: '',
    },
  })
})
