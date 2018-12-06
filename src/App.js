import React from "react";
import aws_exports from "./aws-exports";
// prettier-ignore
import { withAuthenticator, Connect, S3Image, AmplifyTheme } from "aws-amplify-react";
// prettier-ignore
import Amplify, { Auth, API, graphqlOperation, Storage, Hub, Logger
} from "aws-amplify";
// prettier-ignore
import { Divider, Form, Grid, Header, Input, List, Button } from "semantic-ui-react";
import { BrowserRouter as Router, Route, NavLink } from "react-router-dom";
import StripeCheckout from "react-stripe-checkout";
import { getUser, getAlbum, listAlbums, searchAlbums } from "./graphql/queries";
import { createAlbum, createPhoto, createUser } from "./graphql/mutations";
import { onCreateAlbum, onCreatePhoto } from "./graphql/subscriptions";
Amplify.configure(aws_exports);

// window.LOG_LEVEL = "DEBUG";

const Album = ({ album }) => (
  <List.Item key={album.id}>
    <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
  </List.Item>
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
        if (errors.length > 0) return <div>{JSON.stringify(errors)}</div>;
        if (loading || !data.listAlbums) return <h3>Loading...</h3>;
        // console.log(data.listAlbums);
        const albums =
          searchResults.length > 0 ? searchResults : data.listAlbums.items;

        return (
          <>
            <Header as="h3">Albums</Header>
            <List divided relaxed>
              {albums.map(album => (
                <Album key={album.id} album={album} />
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
    albumName: "",
    owner: ""
  };

  componentDidMount() {
    this.getUser();
  }

  getUser = async () => {
    try {
      const result = await Auth.currentUserInfo();
      this.setState({ owner: result.username });
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  };

  handleChange = ({ target }) => {
    const { name, value } = target;
    this.setState({ [name]: value });
  };

  handleSubmit = async event => {
    event.preventDefault();
    const payload = {
      name: this.state.albumName,
      owner: this.state.owner
    };
    try {
      const result = await API.graphql(
        graphqlOperation(createAlbum, { input: payload })
      );
      console.info(`Created album with id ${result.data.createAlbum.id}`);
      this.setState({ albumName: "" });
    } catch (err) {
      console.error("NewAlbum mutation failed", err);
    }
  };

  render() {
    return (
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
          action={{ content: "Create", onClick: this.handleSubmit }}
        />

        {/* Search Field */}
        <span>
          <Input
            type="text"
            placeholder="Search Albums"
            name="search"
            value={this.props.search}
            onChange={this.props.handleSearchChange}
            action={{ content: "Search", onClick: this.props.handleSearch }}
          />
          <Button content="Clear" onClick={this.props.handleClearSearch} />
        </span>
      </>
    );
  }
}

const AlbumDetails = ({ id, currentUser }) => (
  <Connect
    query={graphqlOperation(getAlbum, { id })}
    subscription={graphqlOperation(onCreatePhoto)}
    onSubscriptionMsg={(prevQuery, newData) => {
      let updatedQuery = { ...prevQuery };
      let updatedPhotoList = [
        ...prevQuery.getAlbum.photos.items,
        newData.onCreatePhoto
      ];
      updatedQuery.getAlbum.photos.items = updatedPhotoList;
      return updatedQuery;
    }}
  >
    {({ data: { getAlbum }, loading, errors }) => {
      if (loading || !getAlbum) return <h3>Loading...</h3>;
      if (errors.length > 0) return <div>{JSON.stringify(errors)}</div>;
      const isAlbumCreator = currentUser === getAlbum.owner;
      // console.log(getAlbum);
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

const convertDollarsToStripe = price => price * 100;

const convertStripeToDollars = integer => (integer / 100).toFixed(2);

const PhotoList = ({ photos }) =>
  photos.map(photo => (
    <div key={photo.key}>
      <PayButton price={photo.price} description={photo.description} />
      <S3Image
        imgKey={photo.key}
        theme={{ photoImg: { width: "300px", height: "auto" } }}
      />
      <h2>{photo.description}</h2>
      <h3>${convertStripeToDollars(photo.price)}</h3>
    </div>
  ));

const PayButton = ({ price, description }) => {
  const onToken = async token => {
    const data = await API.post("stripelambda", "/items", {
      body: {
        token,
        charge: {
          amount: convertDollarsToStripe(price),
          currency: "USD",
          description
          // amount: this.props.amount,
          // currency: config.stripe.currency,
        }
      }
    });
    console.log(data);
  };

  return (
    <StripeCheckout
      name={description}
      token={onToken}
      amount={price}
      currency="USD"
      stripeKey="pk_test_CN8uG9E9KDNxI7xVtdN1U5Be"
      allowRememberMe={false}
      // amount={this.props.amount}
      // currency={config.stripe.currency}
      // stripeKey={config.stripe.apiKey} // Stripe publishable API Key
    />
  );
};

const initialState = {
  file: null,
  description: "",
  price: "",
  isSubmitting: false
};

class NewPhoto extends React.Component {
  state = { ...initialState };

  handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ file });
    }
  };

  handleInputChange = ({ target }) => {
    const { name, value } = target;
    this.setState({ [name]: value });
  };

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isSubmitting: true });
    // const { identityId } = await Auth.currentCredentials();
    const filename = `${Date.now()}-${this.state.file.name}`;
    const storedImage = await Storage.put(filename, this.state.file, {
      contentType: this.state.file.type
    });
    const payload = {
      key: storedImage.key,
      price: convertDollarsToStripe(this.state.price),
      description: this.state.description,
      photoAlbumId: this.props.albumId,
      bucket: aws_exports.aws_user_files_s3_bucket,
      createdAt: new Date().toISOString()
    };
    const result = await API.graphql(
      graphqlOperation(createPhoto, { input: payload })
    );
    console.log("Uploaded file: ", result);
    this.setState({ ...initialState });
  };

  render() {
    const { file, description, price, isSubmitting } = this.state;

    return (
      <>
        <Form.Button
          onClick={this.handleSubmit}
          disabled={!file || !description || !price || isSubmitting}
          icon="file image outline"
          content={isSubmitting ? "Uploading..." : "Add Image"}
        />
        <input type="file" accept="image/*" onChange={this.handleFileChange} />
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

// Make home a stateful component in order to add search
class Home extends React.Component {
  state = {
    search: "",
    searchResults: []
  };

  handleSearchChange = ({ target }) => {
    const { name, value } = target;
    this.setState({ [name]: value });
  };

  handleClearSearch = () => {
    this.setState({ search: "", searchResults: [] });
  };

  handleSearch = async event => {
    event.preventDefault();
    // const payload = {
    //   filter: { alsdf: { regexp: `.*${this.state.search}.*` } }
    // };
    const result = await API.graphql(
      graphqlOperation(searchAlbums, {
        filter: {
          name: {
            match: this.state.search
          }
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
    // const payload = {
    //   id: capsule.payload.data.userSub,
    //   username: capsule.payload.data.username
    // };
    // const result = await Auth.currentAuthenticatedUser();
    // const payload = {
    //   id: result.attributes.sub,
    //   username: result.username
    // };
    // const user = await API.graphql(
    //   graphqlOperation(createUser, {
    //     input: payload
    //   })
    // );
    // console.log({ user });
  }
};
Hub.listen("auth", logger);

class App extends React.Component {
  state = {
    currentUser: null
  };

  async componentDidMount() {
    const user = await Auth.currentUserInfo();
    this.setState({ currentUser: user.username });
  }

  render() {
    return (
      <Router>
        <Grid padded>
          <Grid.Column>
            <Route path="/" exact component={Home} />

            <Route
              path="/albums/:albumId"
              render={() => (
                <>
                  <NavLink to="/">Back to Albums list</NavLink>
                </>
              )}
            />
            <Route
              path="/albums/:albumId"
              render={({ match }) => (
                <AlbumDetails
                  id={match.params.albumId}
                  currentUser={this.state.currentUser}
                />
              )}
            />
          </Grid.Column>
        </Grid>
      </Router>
    );
  }
}

const myTheme = {
  ...AmplifyTheme,
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "#ff6600"
  }
};

export default withAuthenticator(App, true, [], null, myTheme);

// User 1: Yoi21522@iencm.com
// User 2: Caq50704@iencm.com
