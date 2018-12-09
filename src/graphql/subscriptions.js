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
export const onCreateOrder = `subscription OnCreateOrder {
  onCreateOrder {
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
export const onUpdateOrder = `subscription OnUpdateOrder {
  onUpdateOrder {
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
export const onDeleteOrder = `subscription OnDeleteOrder {
  onDeleteOrder {
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
