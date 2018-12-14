schema.graphql

```graphql
type Market @model @searchable {
  id: ID!
  name: String!
  products: [Product] @connection(name: "MarketProducts")
  tags: [String!]
  owner: String!
  createdAt: String
}

type Product @model @auth(rules: [{ allow: owner }]) {
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
  orders: [Order!] @connection(name: "UserOrders")
  createdAt: String
}

type Order
  @model(
    mutations: { create: "createOrder" }
    queries: null
    subscriptions: null
  ) {
  id: ID!
  product: Product @connection
  user: User @connection(name: "UserOrders")
  createdAt: String
}
```
