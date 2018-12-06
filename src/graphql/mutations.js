// eslint-disable
// this is an auto generated file. This will be overwritten

export const createAlbum = `mutation CreateAlbum($input: CreateAlbumInput!) {
  createAlbum(input: $input) {
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
export const updateAlbum = `mutation UpdateAlbum($input: UpdateAlbumInput!) {
  updateAlbum(input: $input) {
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
export const deleteAlbum = `mutation DeleteAlbum($input: DeleteAlbumInput!) {
  deleteAlbum(input: $input) {
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
export const createPhoto = `mutation CreatePhoto($input: CreatePhotoInput!) {
  createPhoto(input: $input) {
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
export const updatePhoto = `mutation UpdatePhoto($input: UpdatePhotoInput!) {
  updatePhoto(input: $input) {
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
export const deletePhoto = `mutation DeletePhoto($input: DeletePhotoInput!) {
  deletePhoto(input: $input) {
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
export const createUser = `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
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
export const updateUser = `mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
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
export const deleteUser = `mutation DeleteUser($input: DeleteUserInput!) {
  deleteUser(input: $input) {
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
