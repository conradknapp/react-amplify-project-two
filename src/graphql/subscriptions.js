// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateAlbum = `subscription OnCreateAlbum {
  onCreateAlbum {
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
export const onUpdateAlbum = `subscription OnUpdateAlbum {
  onUpdateAlbum {
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
export const onDeleteAlbum = `subscription OnDeleteAlbum {
  onDeleteAlbum {
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
export const onCreatePhoto = `subscription OnCreatePhoto {
  onCreatePhoto {
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
export const onUpdatePhoto = `subscription OnUpdatePhoto {
  onUpdatePhoto {
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
export const onDeletePhoto = `subscription OnDeletePhoto {
  onDeletePhoto {
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
export const onCreateUser = `subscription OnCreateUser {
  onCreateUser {
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
export const onUpdateUser = `subscription OnUpdateUser {
  onUpdateUser {
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
export const onDeleteUser = `subscription OnDeleteUser {
  onDeleteUser {
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
