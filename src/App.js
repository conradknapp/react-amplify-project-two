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
import { listMarkets, searchMarkets } from "./graphql/queries";
import {
  createMarket,
  createProduct,
  registerUser,
  deleteProduct,
  createOrder
} from "./graphql/mutations";
import { onCreateMarket, onCreateProduct } from "./graphql/subscriptions";
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

const MarketList = ({ searchResults }) => {
  const onNewMarket = (prevQuery, newData) => {
    let updatedQuery = { ...prevQuery };
    const updatedMarketList = [
      newData.onCreateMarket,
      ...prevQuery.listMarkets.items
    ];
    updatedQuery.listMarkets.items = updatedMarketList;
    return updatedQuery;
  };

  return (
    <Connect
      query={graphqlOperation(listMarkets)}
      subscription={graphqlOperation(onCreateMarket)}
      onSubscriptionMsg={onNewMarket}
    >
      {({ data, loading, errors }) => {
        if (errors.length > 0) return <div>{displayErrors(errors)}</div>;
        if (loading || !data.listMarkets) return <h3>Loading...</h3>;
        const markets =
          searchResults.length > 0 ? searchResults : data.listMarkets.items;

        return (
          <>
            <Header as="h3">Markets</Header>
            <List divided relaxed>
              {markets.map(market => (
                <List.Item key={market.id}>
                  <Link to={`/markets/${market.id}`}>{market.name}</Link>
                </List.Item>
              ))}
            </List>
          </>
        );
      }}
    </Connect>
  );
};

class NewMarket extends React.Component {
  state = {
    marketName: ""
  };

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = async (event, user) => {
    event.preventDefault();
    const input = {
      name: this.state.marketName,
      owner: user && user.username
    };
    try {
      const result = await API.graphql(
        graphqlOperation(createMarket, { input })
      );
      console.info(`Created market: id ${result.data.createMarket.id}`);
      this.setState({ marketName: "" });
    } catch (err) {
      console.error("createMarket mutation failed", err);
    }
  };

  render() {
    return (
      <UserContext.Consumer>
        {({ user }) => (
          <>
            <Header as="h1">Add a New Market</Header>
            <Input
              type="text"
              placeholder="Market Name"
              icon="plus"
              iconPosition="left"
              name="marketName"
              value={this.state.marketName}
              onChange={this.handleChange}
              action={{
                content: "Create",
                onClick: event => this.handleSubmit(event, user)
              }}
            />
            <span>
              <Input
                type="text"
                placeholder="Search Markets"
                name="searchTerm"
                value={this.props.searchTerm}
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

const getMarket = `query GetMarket($id: ID!) {
  getMarket(id: $id) {
    id
    name
    products(sortDirection: DESC, limit: 999) {
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

const MarketDetails = ({ marketId, user }) => (
  <Connect
    query={graphqlOperation(getMarket, { id: marketId })}
    subscription={graphqlOperation(onCreateProduct)}
    onSubscriptionMsg={(prevQuery, newData) => {
      let updatedQuery = { ...prevQuery };
      let updatedProductList = [
        newData.onCreateProduct,
        ...prevQuery.getMarket.products.items
      ];
      updatedQuery.getMarket.products.items = updatedProductList;
      return updatedQuery;
    }}
  >
    {({ data: { getMarket }, loading, errors }) => {
      if (loading || !getMarket) return <h3>Loading...</h3>;
      if (errors.length > 0) return <div>{displayErrors(errors)}</div>;
      const isMarketOwner = user && user.username === getMarket.owner;

      return (
        <>
          <Header as="h1">{getMarket.name}</Header>
          {isMarketOwner && <NewProduct marketId={getMarket.id} />}
          <Divider hidden />
          <ProductList products={getMarket.products.items} />
        </>
      );
    }}
  </Connect>
);

const MarketPage = ({ match, user }) => (
  <>
    <Link to="/">Back to Markets list</Link>
    <MarketDetails marketId={match.params.marketId} user={user} />
  </>
);

const ProductList = ({ products }) =>
  products.map(product => <Product key={product.file.key} product={product} />);

// Need to make Product a class component to add the ability to Update products
const Product = ({ product }) => {
  const handleDeleteProduct = async productId => {
    const input = { id: productId };
    await API.graphql(graphqlOperation(deleteProduct, { input }));
  };

  return (
    <UserContext.Consumer>
      {({ user }) => {
        const isProductOwner = user && user.username === product.owner;

        return (
          <>
            <span>
              <h2>{product.description}</h2>
              <h3>${convertCentsToDollars(product.price)}</h3>
              {isProductOwner && (
                <>
                  <Button
                    circular
                    color="orange"
                    icon="pencil"
                    // onClick={() => handleUpdateProduct(product.id)}
                  />
                  <Button
                    circular
                    color="red"
                    icon="trash alternate"
                    onClick={() => handleDeleteProduct(product.id)}
                  />
                </>
              )}
            </span>
            <S3Image
              imgKey={product.file.key}
              theme={{ photoImg: { width: "300px", height: "auto" } }}
            />
            {!isProductOwner && (
              <PayButton
                productId={product.id}
                user={user}
                price={product.price}
                description={product.description}
              />
            )}
          </>
        );
      }}
    </UserContext.Consumer>
  );
};

const PayButton = ({ price, description, user, productId }) => {
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
          orderProductId: productId
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

class NewProduct extends React.Component {
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
      productMarketId: this.props.marketId,
      file
    };
    const result = await API.graphql(
      graphqlOperation(createProduct, { input })
    );
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
        product {
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

                    <p>Desc: {order.product.description}</p>
                    <p>Price: ${convertCentsToDollars(order.product.price)}</p>
                    <p>Owner: {order.product.owner}</p>
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
    searchTerm: "",
    searchResults: []
  };

  handleSearchChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleClearSearch = () => {
    this.setState({ searchTerm: "", searchResults: [] });
  };

  handleSearch = async event => {
    event.preventDefault();
    const result = await API.graphql(
      graphqlOperation(searchMarkets, {
        filter: {
          or: [
            {
              name: {
                match: this.state.searchTerm
                //   regexp: `.*${this.state.searchTerm}.*`
              }
            },
            {
              owner: {
                match: this.state.searchTerm
              }
            }
          ]
        },
        sort: {
          field: "createdAt",
          direction: "desc"
        }
      })
    );
    this.setState({ searchResults: result.data.searchMarkets.items });
  };

  render() {
    return (
      <>
        <NewMarket
          handleSearchChange={this.handleSearchChange}
          handleSearch={this.handleSearch}
          handleClearSearch={this.handleClearSearch}
          searchTerm={this.state.searchTerm}
        />
        <MarketList searchResults={this.state.searchResults} />
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
                path="/markets/:marketId"
                render={({ match }) => <MarketPage match={match} user={user} />}
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
