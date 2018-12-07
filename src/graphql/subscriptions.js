// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateAlbum = `subscription OnCreateAlbum {
  onCreateAlbum {
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
export const onUpdateAlbum = `subscription OnUpdateAlbum {
  onUpdateAlbum {
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
export const onDeleteAlbum = `subscription OnDeleteAlbum {
  onDeleteAlbum {
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
export const onCreatePhoto = `subscription OnCreatePhoto {
  onCreatePhoto {
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
export const onUpdatePhoto = `subscription OnUpdatePhoto {
  onUpdatePhoto {
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
export const onDeletePhoto = `subscription OnDeletePhoto {
  onDeletePhoto {
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
export const onCreateUser = `subscription OnCreateUser {
  onCreateUser {
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
export const onUpdateUser = `subscription OnUpdateUser {
  onUpdateUser {
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
export const onDeleteUser = `subscription OnDeleteUser {
  onDeleteUser {
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
export const onCreateOrder = `subscription OnCreateOrder {
  onCreateOrder {
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
export const onUpdateOrder = `subscription OnUpdateOrder {
  onUpdateOrder {
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
export const onDeleteOrder = `subscription OnDeleteOrder {
  onDeleteOrder {
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
