// eslint-disable
// this is an auto generated file. This will be overwritten

export const getAlbum = `query GetAlbum($id: ID!) {
  getAlbum(id: $id) {
    id
    name
    owner
    photos {
      items {
        id
        bucket
        key
        description
        price
        createdAt
      }
      nextToken
    }
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
      owner
      photos {
        items {
          id
          bucket
          key
          description
          price
          createdAt
        }
        nextToken
      }
      createdAt
    }
    nextToken
  }
}
`;
export const getPhoto = `query GetPhoto($id: ID!) {
  getPhoto(id: $id) {
    id
    album {
      id
      name
      owner
      createdAt
    }
    bucket
    key
    description
    price
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
      album {
        id
        name
        owner
        createdAt
      }
      bucket
      key
      description
      price
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
    userPurchases {
      items {
        id
        bucket
        key
        description
        price
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
      userPurchases {
        items {
          id
          bucket
          key
          description
          price
          createdAt
        }
        nextToken
      }
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
      owner
      photos {
        items {
          id
          bucket
          key
          description
          price
          createdAt
        }
        nextToken
      }
      createdAt
    }
    nextToken
  }
}
`;
