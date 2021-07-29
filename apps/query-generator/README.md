# Query generator

Example service that allows consumers to automatically generate GraphQL Queries

- Send API URL and top level field
- Receive generated query string and variables, which you can send to the API to get results

Query

```graphql
query FieldQuery($apiUrl: String!, $field: String!) {
  fieldQuery(apiUrl: $apiUrl, field: $field) {
    query
    variables
  }
}
```

Variables

```json
{
  "apiUrl": "https://api.spacex.land/graphql/",
  "field": "missions"
}
```

Response

```json
{
  "data": {
    "fieldQuery": {
      "query": "query Missions {\n  missions {\n    description\n    id\n    name\n    twitter\n    website\n    wikipedia\n    payloads {\n      id\n      manufacturer\n      nationality\n      orbit\n      payload_mass_kg\n      payload_mass_lbs\n      payload_type\n      reused\n    }\n  }\n}\n",
      "variables": "{}"
    }
  }
}
```
