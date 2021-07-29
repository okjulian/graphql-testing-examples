import {
  DocumentNode,
  FieldNode,
  getIntrospectionQuery,
  getNamedType,
  getNullableType,
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLSchema,
  IntrospectionQuery,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  parseType,
  SelectionNode,
  VariableDefinitionNode,
} from 'graphql'
import { isEmpty, isNil, set, upperFirst } from 'lodash'
const reduceDeep = require('deepdash/reduceDeep')
import fetch from 'isomorphic-unfetch'

export function generateQuery({
  schema,
  field,
  scalars,
  enums,
  variables,
  lists,
  objects,
}: {
  schema: GraphQLSchema
  field: GraphQLField<any, any>
  scalars?: boolean
  enums?: boolean
  lists?: boolean
  objects?: boolean
  variables?: Record<string, any>
}): { query: DocumentNode; variables: any } {
  let document: DocumentNode = { kind: 'Document', definitions: [] }
  if (!schema) {
    return { query: document, variables: {} }
  }
  document =
    createDocument({
      field,
      scalars,
      schema,
      enums,
      variables,
      lists,
      objects,
    }) || document
  return { query: document, variables: createVariables({ field, schema }) }
}

export function generateAllVariables({
  field,
  schema,
}: {
  schema: GraphQLSchema
  field: GraphQLField<any, any> | null
}) {
  const fieldArgs = field?.args
  return fieldArgs?.reduce((variables, fieldArg) => {
    let value: any = null
    const inputType = getNamedType(fieldArg.type)
    if (isInputObjectType(inputType)) {
      value = createObjectVariables(inputType)
    }
    return { ...variables, [fieldArg.name]: value }
  }, {})
}

function createVariables({
  field,
  schema,
}: {
  schema: GraphQLSchema
  field: GraphQLField<any, any>
}) {
  const fieldArgs =
    field?.args.filter((fieldArg) => {
      return isNonNullType(fieldArg.type) && !fieldArg.defaultValue
    }) || []
  return fieldArgs.reduce((variables, fieldArg) => {
    let value: any = null
    const inputType = getNamedType(fieldArg.type)
    if (isInputObjectType(inputType)) {
      value = createObjectVariables(inputType)
    }
    return { ...variables, [fieldArg.name]: value }
  }, {})
}

function createObjectVariables(type: GraphQLInputObjectType) {
  return Object.values(type.getFields()).reduce((variables, field) => {
    return { ...variables, [field.name]: '' }
  }, {})
}

function createDocument({
  field,
  scalars,
  enums,
  lists,
  objects,
  variables = {},
}: {
  schema: GraphQLSchema
  field: GraphQLField<any, any>
  scalars?: boolean
  enums?: boolean
  lists?: boolean
  objects?: boolean
  variables?: Record<string, any>
}): DocumentNode | null {
  const type = getNullableType(field?.type)
  const namedType = getNamedType(type)
  if (!isObjectType(namedType)) {
    return null
  }
  return {
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: 'query',
        name: {
          kind: 'Name',
          value: upperFirst(field.name),
        },
        variableDefinitions: fieldArgs({ field, variables }).map((fieldArg) => {
          return {
            kind: 'VariableDefinition',
            variable: {
              kind: 'Variable',
              name: {
                kind: 'Name',
                value: fieldArg.name,
              },
            },
            type: parseType(fieldArg.type.toString()),
          } as VariableDefinitionNode
        }),
        selectionSet: {
          kind: 'SelectionSet',
          selections: [
            fieldNode({
              field,
              variables,
              scalars,
              lists,
              enums,
              objects,
            }),
          ],
        },
      },
    ],
  }
}

function fieldArgs({
  field,
  variables,
}: {
  field: GraphQLField<any, any>
  variables: Record<string, any>
}) {
  const variableNames = Object.keys(unflatten(variables))
  return field.args.filter((fieldArg) => {
    // Keep args in variables
    if (variableNames.includes(fieldArg.name)) {
      return true
    }
    // Keep required args without default values
    if (isNonNullType(fieldArg.type) && isNil(fieldArg.defaultValue)) {
      return true
    }
    // Skip by default
    return false
  })
}

function fieldNode({
  field,
  scalars,
  lists,
  enums,
  variables,
  objects,
}: {
  field: GraphQLField<any, any>
  variables: Record<string, any>
  scalars?: boolean
  enums?: boolean
  lists?: boolean
  objects?: boolean
}): FieldNode | null {
  const type = getNullableType(field.type)
  const namedType = getNamedType(type)
  if (!isObjectType(namedType)) {
    return null
  }
  const fields = Object.values(namedType.getFields())
  return {
    kind: 'Field',
    name: {
      kind: 'Name',
      value: field.name,
    },
    arguments: fieldArgs({ field, variables }).map((fieldArg) => {
      return {
        kind: 'Argument',
        name: {
          kind: 'Name',
          value: fieldArg.name,
        },
        value: {
          kind: 'Variable',
          name: {
            kind: 'Name',
            value: fieldArg.name,
          },
        },
      }
    }),
    selectionSet: {
      kind: 'SelectionSet',
      selections: fields
        .map((subfield) => {
          const nullableType = getNullableType(subfield.type)
          if (scalars && isScalarType(nullableType)) {
            return {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: subfield.name,
              },
            }
          }
          if (enums && isEnumType(nullableType)) {
            return {
              kind: 'Field',
              name: {
                kind: 'Name',
                value: subfield.name,
              },
            }
          }
          if (lists && isListType(nullableType)) {
            return fieldNode({
              field: subfield,
              variables: {},
              enums: true,
              lists: false,
              scalars: true,
            })
          }
          return null
        })
        .filter(Boolean) as Array<SelectionNode>,
    },
  }
}

export function flatten(obj: Record<string, any>) {
  if (isEmpty(obj)) {
    return []
  }
  return reduceDeep(
    obj,
    // @ts-ignore
    (accumulator, value, key, parentValue, context) => {
      return { ...accumulator, [context.path]: value }
    },
    {},
    { leavesOnly: true }
  )
}

export function unflatten(obj: Record<string, any>) {
  return Object.entries(obj).reduce((accumulated, [key, value]) => {
    return set(accumulated, key, value)
  }, {})
}

export async function fetchSchema(url: string) {
  if (!url) {
    return null
  }
  const data = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
    credentials: 'same-origin',
  })
  return data.json().then((res) => {
    return res.data as unknown as IntrospectionQuery
  })
}
