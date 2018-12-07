// eslint-disable
// this is an auto generated file. This will be overwritten

export const getAlbum = `query GetAlbum($id: ID!) {
  getAlbum(id: $id) {
    id
    name
    photos {
      items {
        id
        description
        bucket
        key
        price
        owner
        createdAt
      }
      nextToken
    }
    owner
    createdAt
  }
}
`;
export const listAlbums = `query ListAlbums(
  $filter: ModelAlbumFilterInput
  $limit: Int
  $nextToken: String
) {
  listAlbums(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      photos {
        items {
          id
          description
          bucket
          key
          price
          owner
          createdAt
        }
        nextToken
      }
      owner
      createdAt
    }
    nextToken
  }
}
`;
export const getPhoto = `query GetPhoto($id: ID!) {
  getPhoto(id: $id) {
    id
    description
    album {
      id
      name
      owner
      createdAt
    }
    bucket
    key
    price
    owner
    createdAt
  }
}
`;
export const listPhotos = `query ListPhotos(
  $filter: ModelPhotoFilterInput
  $limit: Int
  $nextToken: String
) {
  listPhotos(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      description
      album {
        id
        name
        owner
        createdAt
      }
      bucket
      key
      price
      owner
      createdAt
    }
    nextToken
  }
}
`;
export const getUser = `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    username
    registered
    orders {
      items {
        id
        createdAt
      }
      nextToken
    }
  }
}
`;
export const listUsers = `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      username
      registered
      orders {
        items {
          id
          createdAt
        }
        nextToken
      }
    }
    nextToken
  }
}
`;
export const getOrder = `query GetOrder($id: ID!) {
  getOrder(id: $id) {
    id
    photo {
      id
      description
      bucket
      key
      price
      owner
      createdAt
    }
    user {
      id
      username
      registered
    }
    createdAt
  }
}
`;
export const listOrders = `query ListOrders(
  $filter: ModelOrderFilterInput
  $limit: Int
  $nextToken: String
) {
  listOrders(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      photo {
        id
        description
        bucket
        key
        price
        owner
        createdAt
      }
      user {
        id
        username
        registered
      }
      createdAt
    }
    nextToken
  }
}
`;
export const searchAlbums = `query SearchAlbums(
  $filter: SearchableAlbumFilterInput
  $sort: SearchableAlbumSortInput
  $limit: Int
  $nextToken: Int
) {
  searchAlbums(
    filter: $filter
    sort: $sort
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      photos {
        items {
          id
          description
          bucket
          key
          price
          owner
          createdAt
        }
        nextToken
      }
      owner
      createdAt
    }
    nextToken
  }
}
`;
