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
    file {
      bucket
      region
      key
    }
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
      file {
        bucket
        region
        key
      }
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
    createdAt
    updatedAt
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
