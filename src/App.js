import React from "react";
import aws_exports from "./aws-exports";
// prettier-ignore
import { Authenticator, Connect, S3Image, PhotoPicker, AmplifyTheme } from "aws-amplify-react";
// prettier-ignore
import Amplify, { Auth, API, graphqlOperation, Storage, Hub, Logger
} from "aws-amplify";
// prettier-ignore
import { Router, Route, Link } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";
import StripeCheckout from "react-stripe-checkout";
import format from "date-fns/format";
// prettier-ignore
import { Loading, Menu, Dialog, Button, Form, Notification, Input, Popover, Tabs, Table, Icon, Layout, Card } from "element-react";
import { listMarkets, searchMarkets } from "./graphql/queries";
// prettier-ignore
import { createMarket, createProduct, registerUser, deleteProduct,createOrder } from "./graphql/mutations";
import { onCreateMarket, onCreateProduct } from "./graphql/subscriptions";
import "./App.css";
Amplify.configure(aws_exports);

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_CN8uG9E9KDNxI7xVtdN1U5Be"
};
const history = createBrowserHistory();

// window.LOG_LEVEL = "DEBUG";

const formatDate = date => format(date, "ddd h:mm A, MMM Do, YYYY");

const Error = errors => (
  <>
    {errors.map((error, i) => (
      <p style={{ color: "red" }} key={i}>
        {error.message}
      </p>
    ))}
  </>
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
        if (errors.length > 0) return <Error errors={errors} />;
        if (loading || !data.listMarkets)
          return <Loading text="Loading..." fullscreen={true} />;
        const markets =
          searchResults.length > 0 ? searchResults : data.listMarkets.items;

        return (
          <>
            <h2>
              {searchResults.length > 0
                ? `${searchResults.length} Results`
                : "Markets"}
            </h2>
            <ul>
              {markets.map(market => (
                <li key={market.id}>
                  <Link to={`/markets/${market.id}`}>{market.name}</Link>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </Connect>
  );
};

class NewMarket extends React.Component {
  state = {
    addDialog: false,
    marketName: ""
  };

  handleAddMarket = async (event, user) => {
    event.preventDefault();
    this.setState({ addDialog: false });
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
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <h1
                style={{
                  display: "flex",
                  color: "var(--lightSquidInk)",
                  alignItems: "center"
                }}
              >
                Add a New Market
                <Button
                  style={{
                    paddingLeft: "0.5em",
                    color: "var(--darkAmazonOrange)"
                  }}
                  icon="edit"
                  size="large"
                  type="text"
                  onClick={() => this.setState({ addDialog: true })}
                />
              </h1>
            </header>

            <Dialog
              title="Add Market"
              visible={this.state.addDialog}
              onCancel={() => this.setState({ addDialog: false })}
            >
              <Dialog.Body>
                <Form>
                  <Form.Item label="Add Market" labelWidth="120">
                    <Input
                      placeholder="Market Name"
                      value={this.state.marketName}
                      onChange={marketName => this.setState({ marketName })}
                    />
                  </Form.Item>
                </Form>
              </Dialog.Body>

              <Dialog.Footer>
                <Button onClick={() => this.setState({ addDialog: false })}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={event => this.handleAddMarket(event, user)}
                >
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog>
            <Input
              placeholder="Search Markets..."
              value={this.props.searchTerm}
              onChange={this.props.handleSearchChange}
              append={
                <Button
                  type="primary"
                  icon="search"
                  onClick={this.props.handleSearch}
                >
                  Search
                </Button>
              }
              prepend={
                <Button
                  type="info"
                  icon="circle-cross"
                  onClick={this.props.handleClearSearch}
                >
                  Clear
                </Button>
              }
            />
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

const MarketPage = ({ marketId, user }) => (
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
      if (errors.length > 0) return <Error errors={errors} />;
      if (loading || !getMarket)
        return <Loading text="Loading..." fullscreen={true} />;
      const isMarketOwner = user && user.username === getMarket.owner;

      return (
        <>
          <h1>
            <i
              className="el-icon-arrow-left"
              onClick={() => history.push("/")}
              style={{
                cursor: "pointer"
              }}
            />
            {getMarket.name}
          </h1>
          <Tabs type="card" value={isMarketOwner ? "1" : "2"}>
            {isMarketOwner && (
              <Tabs.Pane
                label={
                  <span>
                    <Icon name="date" style={{ marginRight: "5px" }} />
                    Add Product
                  </span>
                }
                name="1"
              >
                <NewProduct marketId={getMarket.id} />
              </Tabs.Pane>
            )}
            <Tabs.Pane
              label={
                <span>
                  <Icon name="menu" style={{ marginRight: "5px" }} />
                  Products ({getMarket.products.items.length})
                </span>
              }
              name="2"
            >
              <ProductList products={getMarket.products.items} />
            </Tabs.Pane>
          </Tabs>
        </>
      );
    }}
  </Connect>
);

const ProductList = ({ products }) =>
  products.map(product => <Product key={product.file.key} product={product} />);

// Need to make Product a class component to add the ability to Update products
class Product extends React.Component {
  state = {
    updateDialog: false,
    deleteDialog: false
  };

  handleDeleteProduct = async productId => {
    try {
      this.setState({ deleteDialog: false });
      const input = { id: productId };
      await API.graphql(graphqlOperation(deleteProduct, { input }));
      Notification({
        title: `Success`,
        message: `Product successfully deleted!`,
        type: "success"
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error(`Failed to delete product with id: ${productId}`, err);
    }
  };

  render() {
    const { updateDialog, deleteDialog } = this.state;
    const { product } = this.props;

    return (
      <UserContext.Consumer>
        {({ user }) => {
          const isProductOwner = user && user.username === product.owner;

          return (
            <>
              <Layout.Row>
                <Layout.Col span={9}>
                  <Card bodyStyle={{ padding: 0, minWidth: "200px" }}>
                    <S3Image
                      imgKey={product.file.key}
                      theme={{
                        photoImg: { maxWidth: "100%", maxHeight: "100%" }
                      }}
                    />
                    <div style={{ padding: 8 }}>
                      <span>{product.description}</span>
                      <div className="bottom clearfix">
                        <h3>${convertCentsToDollars(product.price)}</h3>
                        {!isProductOwner && (
                          <PayButton
                            productId={product.id}
                            user={user}
                            price={product.price}
                            description={product.description}
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                </Layout.Col>
              </Layout.Row>
              {isProductOwner && (
                <>
                  <Button
                    type="warning"
                    icon="edit"
                    onClick={() => this.setState({ updateDialog: true })}
                  />
                  <Popover
                    placement="top"
                    width="160"
                    trigger="click"
                    visible={deleteDialog}
                    content={
                      <>
                        <p>Do you really want to delete this?</p>
                        <div style={{ textAlign: "right", margin: 0 }}>
                          <Button
                            size="mini"
                            type="text"
                            onClick={() =>
                              this.setState({ deleteDialog: false })
                            }
                          >
                            Cancel
                          </Button>
                          <Button
                            type="primary"
                            size="mini"
                            onClick={() => this.handleDeleteProduct(product.id)}
                          >
                            Confirm
                          </Button>
                        </div>
                      </>
                    }
                  >
                    <Button
                      type="danger"
                      icon="delete"
                      onClick={() => this.setState({ deleteDialog: true })}
                    />
                  </Popover>
                  <Dialog
                    title="Update Product"
                    size="tiny"
                    visible={updateDialog}
                    onCancel={() => this.setState({ updateDialog: false })}
                  >
                    <Dialog.Body>
                      Do you want to update this product?
                    </Dialog.Body>
                    <Dialog.Footer>
                      <Button
                        onClick={() => this.setState({ updateDialog: false })}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        onClick={() => this.handleUpdateProduct(product.id)}
                      >
                        Confirm
                      </Button>
                    </Dialog.Footer>
                  </Dialog>
                </>
              )}
            </>
          );
        }}
      </UserContext.Consumer>
    );
  }
}

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
        console.log(result.message);
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
  description: "",
  image: "",
  imagePreview: "",
  price: "",
  isUploading: false
};

const convertDollarsToCents = price => (price * 100).toFixed(2);

const convertCentsToDollars = price => (price / 100).toFixed(2);

class NewProduct extends React.Component {
  state = { ...initialState };

  handleSubmit = async event => {
    event.preventDefault();
    this.setState({ isUploading: true });
    const visibility = "public";
    const { identityId } = await Auth.currentCredentials();
    const filename = `/${visibility}/${identityId}/${Date.now()}-${
      this.state.image.name
    }`;
    const uploadedImage = await Storage.put(filename, this.state.image.file, {
      contentType: this.state.image.type
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
    Notification({
      title: `Success`,
      message: `Product successfully created!`,
      type: "success"
    });
    this.setState({ ...initialState });
  };

  render() {
    const { image, imagePreview, description, price, isUploading } = this.state;

    return (
      <>
        <h2>Add New Product</h2>
        <Form
          inline={true}
          onSubmit={this.handleSubmit}
          style={{
            margin: 0
          }}
        >
          <Form.Item>
            <Input
              type="text"
              placeholder="Add Description"
              value={description}
              onChange={description => this.setState({ description })}
            />
          </Form.Item>
          <Form.Item>
            <Input
              type="number"
              placeholder="Add Price"
              value={price}
              onChange={price => this.setState({ price })}
            />
          </Form.Item>
          <Form.Item>
            <Button
              onClick={this.handleSubmit}
              disabled={!image || !description || !price || isUploading}
              loading={isUploading}
              type="primary"
            >
              {isUploading ? "Uploading..." : "Add Product"}
            </Button>
          </Form.Item>
        </Form>
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Product Preview"
            style={{
              height: "100px",
              width: "100px",
              objectFit: "cover",
              borderRadius: "50%"
            }}
          />
        )}
        <PhotoPicker
          title="Product Photo"
          preview="hidden"
          onLoad={url => this.setState({ imagePreview: url })}
          onPick={file => this.setState({ image: file })}
          theme={{
            formContainer: {
              margin: 0,
              padding: "1em",
              maxHeight: "300px"
            },
            sectionHeader: {
              padding: "0.2em",
              color: "var(--darkAmazonOrange)"
            },
            photoPickerButton: {
              background: "var(--squidInk)"
            }
          }}
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
    user: "",
    given_name: "",
    family_name: "",
    orders: [],
    dialog: false,
    emailDialog: false,
    deleteDialog: false,
    columns: [
      {
        label: "Summary",
        prop: "name",
        width: 150
      },
      {
        prop: "value",
        width: 350
      },
      {
        prop: "address",
        render: row => {
          switch (row.name) {
            case "Display Name":
              return (
                <Button
                  onClick={() => this.setState({ dialog: true })}
                  type="info"
                  size="small"
                >
                  Edit
                </Button>
              );
            case "Email":
              return (
                <Button
                  onClick={() => this.setState({ emailDialog: true })}
                  type="info"
                  size="small"
                >
                  Edit
                </Button>
              );
            case "Delete Account":
              return (
                <Button
                  onClick={() => this.setState({ deleteDialog: true })}
                  type="danger"
                  size="small"
                >
                  Delete
                </Button>
              );
            default:
              return;
          }
        }
      }
    ]
  };

  async componentDidMount() {
    if (this.props.user) {
      try {
        const userAttributes = await Auth.userAttributes(this.props.user);
        const attributesObj = Auth.attributesToObject(userAttributes);
        this.setState({ ...attributesObj });
        this.getOrders(attributesObj);
        this.setState({ user: this.props.user });
      } catch (err) {
        console.error(err);
      }
    }
  }

  handleSaveProfile = async () => {
    try {
      this.setState({ dialog: false, emailDialog: false });
      const updatedUser = {
        given_name: this.state.given_name,
        family_name: this.state.family_name,
        email: this.state.email
      };
      const result = await Auth.updateUserAttributes(
        this.props.user,
        updatedUser
      );
      Notification({
        title: `Success`,
        message: `Profile successfully updated!`,
        type: `${result.toLowerCase()}`
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error(err);
      Notification.error({
        title: "Error",
        message: `${err.message || "Error updating profile"}`
      });
    }
  };

  deleteUser = () => {
    const { user } = this.state;
    user.deleteUser();
  };

  getOrders = async ({ sub }) => {
    const input = { id: sub };
    const result = await API.graphql(graphqlOperation(getUser, input));
    this.setState({ orders: result.data.getUser.orders.items });
  };

  render() {
    const {
      columns,
      given_name,
      family_name,
      email,
      orders,
      dialog,
      emailDialog,
      deleteDialog
    } = this.state;

    return (
      <UserContext.Consumer>
        {({ user }) =>
          user && (
            <>
              <Tabs activeName="1" className="profile-tabs">
                <Tabs.Pane label="Summary" name="1">
                  <h2>Profile Summary</h2>
                  <Table
                    columns={columns}
                    data={[
                      {
                        name: "Your Id",
                        value: user.attributes.sub
                      },
                      {
                        name: "Username",
                        value: user.username
                      },
                      {
                        name: "Email",
                        value: user.attributes.email
                      },
                      {
                        name: "Display Name",
                        value: `${given_name} ${family_name}`
                      },
                      {
                        name: "Delete Account"
                      }
                    ]}
                    highlightCurrentRow={true}
                    showHeader={false}
                    rowClassName={row =>
                      row.name === "Delete Account" && "danger-row"
                    }
                  />
                </Tabs.Pane>
                <Tabs.Pane label="Orders" name="2">
                  <h2>Order History</h2>
                  <ul>
                    {orders.map(order => (
                      <li key={order.id}>
                        <p>Order Id: {order.id}</p>

                        <p>Desc: {order.product.description}</p>
                        <p>
                          Price: ${convertCentsToDollars(order.product.price)}
                        </p>
                        <p>Owner: {order.product.owner}</p>
                        <p>Processed on {formatDate(order.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                </Tabs.Pane>
              </Tabs>

              <Dialog
                title="Delete Account"
                size="tiny"
                visible={deleteDialog}
                onCancel={() => this.setState({ deleteDialog: false })}
              >
                <Dialog.Body>
                  Do you really want to delete your account?
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    onClick={() => this.setState({ deleteDialog: false })}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="danger"
                    onClick={() => this.setState({ deleteDialog: false })}
                  >
                    Confirm
                  </Button>
                </Dialog.Footer>
              </Dialog>

              <Dialog
                title="Edit Email"
                visible={emailDialog}
                onCancel={() => this.setState({ emailDialog: false })}
              >
                <Dialog.Body>
                  <Form>
                    <Form.Item label="Email" labelWidth="120">
                      <Input
                        onChange={email => this.setState({ email })}
                        value={email}
                      />
                    </Form.Item>
                  </Form>
                </Dialog.Body>

                <Dialog.Footer>
                  <Button onClick={() => this.setState({ emailDialog: false })}>
                    Cancel
                  </Button>
                  <Button type="primary" onClick={this.handleSaveProfile}>
                    Save
                  </Button>
                </Dialog.Footer>
              </Dialog>

              <Dialog
                title="Edit Display Name"
                visible={dialog}
                onCancel={() => this.setState({ dialog: false })}
              >
                <Dialog.Body>
                  <Form>
                    <Form.Item label="Given Name" labelWidth="120">
                      <Input
                        onChange={given_name => this.setState({ given_name })}
                        value={given_name}
                      />
                    </Form.Item>
                    <Form.Item label="Family name" labelWidth="120">
                      <Input
                        onChange={family_name => this.setState({ family_name })}
                        value={family_name}
                      />
                    </Form.Item>
                  </Form>
                </Dialog.Body>

                <Dialog.Footer>
                  <Button onClick={() => this.setState({ dialog: false })}>
                    Cancel
                  </Button>
                  <Button type="primary" onClick={this.handleSaveProfile}>
                    Save
                  </Button>
                </Dialog.Footer>
              </Dialog>
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

  handleSearchChange = searchTerm => this.setState({ searchTerm });

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

const linkStyles = {
  textDecoration: "none",
  margin: 0
};

const Navbar = ({ displayUsername, handleSignout }) => (
  <Menu mode="horizontal" theme="dark" defaultActive="1">
    <div
      style={{
        display: "flex",
        justifyContent: "space-between"
      }}
    >
      {/* App Title */}
      <Menu.Item index="1">
        <Link to="/" style={linkStyles}>
          <span
            style={{
              fontWeight: "300",
              fontSize: "1.3rem",
              color: "#f90"
            }}
          >
            <img
              src="https://icon.now.sh/amazon/f90"
              style={{
                height: "20px",
                paddingRight: "5px"
              }}
              alt="Amazon Logo"
            />
            AmplifyAgora
          </span>
        </Link>
      </Menu.Item>

      {/* Navbar Items */}
      <div>
        <Menu.Item index="2">
          <span
            style={{
              fontWeight: "300"
            }}
          >
            Hello, {displayUsername()}
          </span>
        </Menu.Item>
        <Menu.Item index="3">
          <Link to="/profile" style={linkStyles}>
            <Icon name="setting" />
            Profile
          </Link>
        </Menu.Item>
        <Menu.Item index="4">
          <Button type="warning" onClick={handleSignout}>
            Signout
          </Button>
        </Menu.Item>
      </div>
    </div>
  </Menu>
);

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
          <>
            <Navbar
              displayUsername={this.displayUsername}
              handleSignout={this.handleSignout}
            />
            <div style={{ padding: "1em" }}>
              <Route path="/" exact component={HomePage} />
              <Route
                path="/profile"
                component={() => <ProfilePage user={user} />}
              />
              <Route
                path="/markets/:marketId"
                render={({ match }) => (
                  <MarketPage marketId={match.params.marketId} user={user} />
                )}
              />
            </div>
          </>
        </Router>
      </UserContext.Provider>
    );
  }
}

const myTheme = {
  ...AmplifyTheme,
  // navBar: {
  //   ...AmplifyTheme.navBar,
  //   backgroundColor: "#FFC0CB"
  // },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)"
  }
};

export default App;
// export default withAuthenticator(App, true, [], null, myTheme);

// User: Mec81194@ebbob.com
