schema.graphql

```graphql
type Market @model @searchable {
  id: ID!
  name: String!
  products: [Product] @connection(name: "MarketProducts")
  owner: String!
  createdAt: String
}

type Product @model @auth(rules: [{ allow: owner, mutations: [create] }]) {
  id: ID!
  description: String!
  market: Market @connection(name: "MarketProducts")
  file: S3Object!
  price: Float!
  owner: String
  createdAt: String
}

type S3Object {
  bucket: String!
  region: String!
  key: String!
}

type User
  @model(
    mutations: { create: "registerUser" }
    queries: { get: "getUser" }
    subscriptions: null
  ) {
  id: ID!
  username: String!
  registered: Boolean
  orders: [Order] @connection(name: "UserOrders")
  createdAt: String
}

type Order @model(queries: null) {
  id: ID!
  product: Product @connection
  user: User @connection(name: "UserOrders")
  createdAt: String
}
```
