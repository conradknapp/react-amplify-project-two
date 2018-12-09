import React from "react";
import aws_exports from "./aws-exports";
// prettier-ignore
import { Authenticator, Connect, S3Image, AmplifyTheme } from "aws-amplify-react";
// prettier-ignore
import Amplify, { Auth, API, graphqlOperation, Storage, Hub, Logger
} from "aws-amplify";
// prettier-ignore
import { Divider, Form, Header, Input, List, Button, Modal } from "semantic-ui-react";
import { Router, Switch, Route, Link } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";
import StripeCheckout from "react-stripe-checkout";
import format from "date-fns/format";
import { listAlbums, searchAlbums } from "./graphql/queries";
import {
  createAlbum,
  createPhoto,
  registerUser,
  deletePhoto,
  createOrder
} from "./graphql/mutations";
import { onCreateAlbum, onCreatePhoto } from "./graphql/subscriptions";
Amplify.configure(aws_exports);

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_CN8uG9E9KDNxI7xVtdN1U5Be"
};
const history = createBrowserHistory();

// window.LOG_LEVEL = "DEBUG";

const formatDate = date => format(date, "ddd h:mm A, MMM Do, YYYY");

const displayErrors = errors => (
  <div>
    {errors.map((error, i) => (
      <p style={{ color: "red" }} key={i}>
        {error.message}
      </p>
    ))}
  </div>
);

const AlbumList = ({ searchResults }) => {
  const onNewAlbum = (prevQuery, newData) => {
    let updatedQuery = { ...prevQuery };
    const updatedAlbumList = [
      newData.onCreateAlbum,
      ...prevQuery.listAlbums.items
    ];
    updatedQuery.listAlbums.items = updatedAlbumList;
    return updatedQuery;
  };

  return (
    <Connect
      query={graphqlOperation(listAlbums)}
      subscription={graphqlOperation(onCreateAlbum)}
      onSubscriptionMsg={onNewAlbum}
    >
      {({ data, loading, errors }) => {
        if (errors.length > 0) return <div>{displayErrors(errors)}</div>;
        if (loading || !data.listAlbums) return <h3>Loading...</h3>;
        // console.log(data.listAlbums);
        const albums =
          searchResults.length > 0 ? searchResults : data.listAlbums.items;

        return (
          <>
            <Header as="h3">Albums</Header>
            <List divided relaxed>
              {albums.map(album => (
                <List.Item key={album.id}>
                  <Link to={`/albums/${album.id}`}>{album.name}</Link>
                </List.Item>
              ))}
            </List>
          </>
        );
      }}
    </Connect>
  );
};

class NewAlbum extends React.Component {
  state = {
    albumName: ""
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = async (event, user) => {
    event.preventDefault();
    const input = {
      name: this.state.albumName,
      owner: user && user.username
    };
    try {
      const result = await API.graphql(
        graphqlOperation(createAlbum, { input })
      );
      console.info(`Created album: id ${result.data.createAlbum.id}`);
      this.setState({ albumName: "" });
    } catch (err) {
      console.error("createAlbum mutation failed", err);
    }
  };

  render() {
    return (
      <UserContext.Consumer>
        {({ user }) => (
          <>
            <Header as="h3">Add a new album</Header>
            {/* New Album Field */}
            <Input
              type="text"
              placeholder="New Album Name"
              icon="plus"
              iconPosition="left"
              name="albumName"
              value={this.state.albumName}
              onChange={this.handleChange}
              action={{
                content: "Create",
                onClick: event => this.handleSubmit(event, user)
              }}
            />

            {/* Search Field */}
            <span>
              <Input
                type="text"
                placeholder="Search Markets"
                name="search"
                value={this.props.search}
                onChange={this.props.handleSearchChange}
                action={{ content: "Search", onClick: this.props.handleSearch }}
              />
              <Button content="Clear" onClick={this.props.handleClearSearch} />
            </span>
          </>
        )}
      </UserContext.Consumer>
    );
  }
}

const getAlbum = `query GetAlbum($id: ID!) {
  getAlbum(id: $id) {
    id
    name
    photos(sortDirection: DESC, limit: 999) {
      items {
        id
        description
        file {
          key 
          bucket
          region
        }
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

const AlbumDetails = ({ albumId, user }) => (
  <Connect
    query={graphqlOperation(getAlbum, { id: albumId })}
    subscription={graphqlOperation(onCreatePhoto)}
    onSubscriptionMsg={(prevQuery, newData) => {
      let updatedQuery = { ...prevQuery };
      let updatedPhotoList = [
        newData.onCreatePhoto,
        ...prevQuery.getAlbum.photos.items
      ];
      updatedQuery.getAlbum.photos.items = updatedPhotoList;
      return updatedQuery;
    }}
  >
    {({ data: { getAlbum }, loading, errors }) => {
      if (loading || !getAlbum) return <h3>Loading...</h3>;
      if (errors.length > 0) return <div>{displayErrors(errors)}</div>;
      const isAlbumCreator = user && user.username === getAlbum.owner;

      return (
        <>
          <Header as="h3">{getAlbum.name}</Header>
          {isAlbumCreator && <NewPhoto albumId={getAlbum.id} />}
          <Divider hidden />
          <PhotoList photos={getAlbum.photos.items} />
        </>
      );
    }}
  </Connect>
);

const AlbumPage = ({ match, user }) => (
  <>
    <Link to="/">Back to Markets list</Link>
    <AlbumDetails albumId={match.params.albumId} user={user} />
  </>
);

const PhotoList = ({ photos }) =>
  photos.map(photo => <Photo key={photo.file.key} photo={photo} />);

// Need to make Photo a class component to add the ability to Update photos
const Photo = ({ photo }) => {
  const handleDeletePhoto = async photoId => {
    const input = { id: photoId };
    await API.graphql(graphqlOperation(deletePhoto, { input }));
  };

  return (
    <UserContext.Consumer>
      {({ user }) => {
        const isPhotoCreator = user && user.username === photo.owner;

        return (
          <>
            <span>
              {!isPhotoCreator && (
                <PayButton
                  photoId={photo.id}
                  user={user}
                  price={photo.price}
                  description={photo.description}
                />
              )}
              {isPhotoCreator && (
                <>
                  <Button
                    circular
                    color="orange"
                    icon="pencil"
                    // onClick={() => handleUpdatePhoto(photo.id)}
                  />
                  <Button
                    circular
                    color="red"
                    icon="trash alternate"
                    onClick={() => handleDeletePhoto(photo.id)}
                  />
                </>
              )}
            </span>
            <S3Image
              imgKey={photo.file.key}
              theme={{ photoImg: { width: "300px", height: "auto" } }}
            />
            <h2>{photo.description}</h2>
            <h3>${convertCentsToDollars(photo.price)}</h3>
          </>
        );
      }}
    </UserContext.Consumer>
  );
};

const PayButton = ({ price, description, user, photoId }) => {
  const handlePurchase = async token => {
    try {
      const result = await API.post("stripelambda", "/charge", {
        body: {
          token,
          charge: {
            amount: price,
            currency: stripeConfig.currency,
            description
          }
        }
      });
      if (result.charge.status === "succeeded") {
        // show toast message and redirect back home
        console.log(result.message);
        // new id of what we want to update and what we want to update the user with
        const input = {
          orderUserId: user && user.attributes.sub,
          orderPhotoId: photoId
        };
        const order = await API.graphql(
          graphqlOperation(createOrder, { input })
        );
        console.log({ order });
        history.push("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <StripeCheckout
      name={description}
      token={handlePurchase}
      amount={price}
      currency={stripeConfig.currency}
      stripeKey={stripeConfig.publishableAPIKey}
      allowRememberMe={false}
    />
  );
};

const initialState = {
  file: null,
  description: "",
  price: "",
  isUploading: false
};

const convertDollarsToCents = price => (price * 100).toFixed(2);

const convertCentsToDollars = price => (price / 100).toFixed(2);

class NewPhoto extends React.Component {
  state = { ...initialState };

  handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ file });
    }
  };

  handleInputChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = async event => {
    event.preventDefault();
    this.setState({ isUploading: true });
    const { identityId } = await Auth.currentCredentials();
    const filename = `${identityId}/${Date.now()}-${this.state.file.name}`;
    const uploadedImage = await Storage.put(filename, this.state.file, {
      contentType: this.state.file.type
    });
    const file = {
      key: uploadedImage.key,
      bucket: aws_exports.aws_user_files_s3_bucket,
      region: aws_exports.aws_project_region
    };
    const input = {
      price: convertDollarsToCents(this.state.price),
      description: this.state.description,
      photoAlbumId: this.props.albumId,
      file
    };
    const result = await API.graphql(graphqlOperation(createPhoto, { input }));
    console.log("Uploaded file", result);
    this.setState({ ...initialState });
    this.fileInput.value = null;
  };

  render() {
    const { file, description, price, isUploading } = this.state;

    return (
      <>
        <Form.Button
          onClick={this.handleSubmit}
          disabled={!file || !description || !price || isUploading}
          icon="file image outline"
          content={isUploading ? "Uploading..." : "Add Image"}
        />
        <input
          type="file"
          accept="image/*"
          onChange={this.handleFileChange}
          ref={ref => (this.fileInput = ref)}
        />
        <Input
          type="text"
          placeholder="Add Description"
          name="description"
          value={description}
          onChange={this.handleInputChange}
        />
        <Input
          type="number"
          placeholder="Add Price"
          name="price"
          value={price}
          onChange={this.handleInputChange}
        />
      </>
    );
  }
}

// Copy and bring in getUser query because queries file will be overwritten with any updates
const getUser = `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    username
    registered
    createdAt
    orders {
      items {
        id
        createdAt
        photo {
          createdAt
          description
          id
          owner
          price
        }
      }
      nextToken
    }
  }
}
`;

class ProfilePage extends React.Component {
  state = {
    given_name: "",
    family_name: "",
    orders: []
  };

  async componentDidMount() {
    if (this.props.user) {
      try {
        const userAttributes = await Auth.userAttributes(this.props.user);
        this.translateAttributes(userAttributes);
        this.getOrders(userAttributes);
      } catch (err) {
        console.error(err);
      }
    }
  }

  translateAttributes = userAttributes => {
    const result = userAttributes.reduce((acc, attr) => {
      if (attr.Name === "given_name" || attr.Name === "family_name") {
        acc[attr.Name] = attr.Value;
      }
      return acc;
    }, {});
    this.setState({ ...result });
  };

  handleInputChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSaveProfile = async () => {
    try {
      const updatedUser = {
        given_name: this.state.given_name,
        family_name: this.state.family_name
      };
      const result = await Auth.updateUserAttributes(
        this.props.user,
        updatedUser
      );
      console.log(result);
      // if result === SUCCESS, show toast message and reload page
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  getOrders = async userAttributes => {
    const userId = userAttributes.find(el => el["Name"] === "sub").Value;
    const input = {
      id: userId
    };
    const result = await API.graphql(graphqlOperation(getUser, input));
    this.setState({ orders: result.data.getUser.orders.items });
  };

  render() {
    const { given_name, family_name, orders } = this.state;

    return (
      <UserContext.Consumer>
        {({ user }) =>
          user && (
            <>
              <Link to="/">Back Home</Link>
              <h2>User Info</h2>
              <p>User id: {user.attributes.sub}</p>
              <p>Username: {user.username}</p>
              {(given_name || family_name) && (
                <span>
                  Display Name: {given_name} {family_name}
                </span>
              )}
              <Modal
                trigger={<Button>Edit Display Name</Button>}
                header="Profile"
                content={
                  <>
                    <Form.Input
                      type="text"
                      name="given_name"
                      placeholder="Given Name"
                      onChange={this.handleInputChange}
                      value={given_name}
                    />
                    <Form.Input
                      type="text"
                      name="family_name"
                      placeholder="Family Name"
                      onChange={this.handleInputChange}
                      value={family_name}
                    />
                  </>
                }
                actions={[
                  "Cancel",
                  {
                    key: "save",
                    content: "Save",
                    positive: true,
                    onClick: this.handleSaveProfile
                  }
                ]}
              />
              <p>Email: {user.attributes.email}</p>
              <h2>Orders</h2>
              <ul>
                {orders.map(order => (
                  <li key={order.id}>
                    <p>Order Id: {order.id}</p>

                    <p>Desc: {order.photo.description}</p>
                    <p>Price: ${convertCentsToDollars(order.photo.price)}</p>
                    <p>Owner: {order.photo.owner}</p>
                    <p>Processed on {formatDate(order.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </>
          )
        }
      </UserContext.Consumer>
    );
  }
}

// Make home a stateful component in order to add search
class HomePage extends React.Component {
  state = {
    search: "",
    searchResults: []
  };

  handleSearchChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleClearSearch = () => {
    this.setState({ search: "", searchResults: [] });
  };

  handleSearch = async event => {
    event.preventDefault();
    const result = await API.graphql(
      graphqlOperation(searchAlbums, {
        filter: {
          or: [
            {
              name: {
                match: this.state.search
              }
            },
            {
              owner: {
                match: this.state.search
              }
            }
          ]
          // description: {
          //   regexp: `.*${this.state.search}.*`
          // }
        },
        sort: {
          field: "createdAt",
          direction: "desc"
        }
      })
    );
    // console.log(result.data.searchAlbums.items);
    this.setState({ searchResults: result.data.searchAlbums.items });
  };

  render() {
    return (
      <>
        <NewAlbum
          handleSearchChange={this.handleSearchChange}
          handleSearch={this.handleSearch}
          handleClearSearch={this.handleClearSearch}
          search={this.state.search}
        />
        <AlbumList searchResults={this.state.searchResults} />
      </>
    );
  }
}

const logger = new Logger("authLogger");

logger.onHubCapsule = async capsule => {
  if (capsule.payload.event === "signIn") {
    const getUserInput = {
      id: capsule.payload.data.signInUserSession.idToken.payload.sub
    };
    const { data } = await API.graphql(graphqlOperation(getUser, getUserInput));
    if (!data.getUser || !data.getUser.registered) {
      const registerUserInput = {
        ...getUserInput,
        username: capsule.payload.data.username,
        registered: true
      };
      const newUser = await API.graphql(
        graphqlOperation(registerUser, {
          input: registerUserInput
        })
      );
      console.log({ newUser });
    }
  }
};
Hub.listen("auth", logger);

const UserContext = React.createContext();

class App extends React.Component {
  state = {
    user: null
  };

  getAuthUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    user ? this.setState({ user }) : this.setState({ user: null });
  };

  displayUsername = () => {
    const { user } = this.state;
    const username = `${user.attributes.given_name} ${
      user.attributes.family_name
    }`;
    return username || user.email;
  };

  componentDidMount() {
    this.getAuthUser();
    Hub.listen("auth", this, "onHubCapsule");
  }

  onHubCapsule = capsule => {
    if (capsule.payload.event === "signIn") {
      this.getAuthUser();
    } else if (capsule.payload.event === "signOut") {
      this.setState({ user: null });
    }
  };

  handleSignout = async () => {
    try {
      await Auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };

  render() {
    const { user } = this.state;

    return !user ? (
      <Authenticator theme={myTheme} />
    ) : (
      <UserContext.Provider value={{ user }}>
        <Router history={history}>
          {/* Replace Div with Container Element */}
          <div style={{ padding: "2em" }}>
            <nav>
              <span>Hello, {this.displayUsername()}</span>
              <Link to="/profile">Profile</Link>
              <Button onClick={this.handleSignout}>Signout</Button>
            </nav>
            <Switch>
              <Route path="/" exact component={HomePage} />
              <Route
                path="/profile"
                component={() => <ProfilePage user={user} />}
              />
              <Route
                path="/albums/:albumId"
                render={({ match }) => <AlbumPage match={match} user={user} />}
              />
            </Switch>
          </div>
        </Router>
      </UserContext.Provider>
    );
  }
}

const myTheme = {
  ...AmplifyTheme,
  navBar: {
    ...AmplifyTheme.navBar,
    backgroundColor: "#FFC0CB"
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "#F60"
  }
};

export default App;
// export default withAuthenticator(App, true, [], null, myTheme);

// User 1: Mww86379@ebbob.com
// User 2: Mec81194@ebbob.com
