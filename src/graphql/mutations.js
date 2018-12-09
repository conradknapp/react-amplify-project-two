// eslint-disable
// this is an auto generated file. This will be overwritten

export const createAlbum = `mutation CreateAlbum($input: CreateAlbumInput!) {
  createAlbum(input: $input) {
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
export const updateAlbum = `mutation UpdateAlbum($input: UpdateAlbumInput!) {
  updateAlbum(input: $input) {
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
export const deleteAlbum = `mutation DeleteAlbum($input: DeleteAlbumInput!) {
  deleteAlbum(input: $input) {
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
export const createPhoto = `mutation CreatePhoto($input: CreatePhotoInput!) {
  createPhoto(input: $input) {
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
export const updatePhoto = `mutation UpdatePhoto($input: UpdatePhotoInput!) {
  updatePhoto(input: $input) {
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
export const deletePhoto = `mutation DeletePhoto($input: DeletePhotoInput!) {
  deletePhoto(input: $input) {
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
export const registerUser = `mutation RegisterUser($input: CreateUserInput!) {
  registerUser(input: $input) {
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
export const createOrder = `mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    photo {
      id
      description
      price
      owner
      createdAt
    }
    user {
      id
      username
      registered
      createdAt
      updatedAt
    }
    createdAt
  }
}
`;
export const updateOrder = `mutation UpdateOrder($input: UpdateOrderInput!) {
  updateOrder(input: $input) {
    id
    photo {
      id
      description
      price
      owner
      createdAt
    }
    user {
      id
      username
      registered
      createdAt
      updatedAt
    }
    createdAt
  }
}
`;
export const deleteOrder = `mutation DeleteOrder($input: DeleteOrderInput!) {
  deleteOrder(input: $input) {
    id
    photo {
      id
      description
      price
      owner
      createdAt
    }
    user {
      id
      username
      registered
      createdAt
      updatedAt
    }
    createdAt
  }
}
`;
