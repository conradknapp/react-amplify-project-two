import React from "react";
// prettier-ignore
import { Authenticator, Connect, S3Image, PhotoPicker, AmplifyTheme } from "aws-amplify-react";
// prettier-ignore
import Amplify, { Auth, API, graphqlOperation, Storage, Hub, Logger
} from "aws-amplify";
// prettier-ignore
import { Router, Route, Link, NavLink } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";
import StripeCheckout from "react-stripe-checkout";
import format from "date-fns/format";
// prettier-ignore
import { Loading, Menu as Nav, Dialog, Button, Form, Notification, Input, Popover, Tabs, Table, Icon, Card, Tag, MessageBox, Message, Select } from "element-react";
import { listMarkets, searchMarkets } from "./graphql/queries";
// prettier-ignore
import { createMarket, createProduct, registerUser, deleteProduct,createOrder } from "./graphql/mutations";
import { onCreateMarket, onCreateProduct } from "./graphql/subscriptions";
import "./App.css";
import aws_exports from "./aws-exports";
Amplify.configure(aws_exports);

const stripeConfig = {
  currency: "USD",
  publishableAPIKey: "pk_test_CN8uG9E9KDNxI7xVtdN1U5Be"
};
const history = createBrowserHistory();

const formatOrderDate = date => format(date, "ddd h:mm A, MMM Do, YYYY");

const formatProductDate = date => format(date, "MMM Do, YYYY");

// prettier-ignore
const Error = errors => (
  <pre>
    {errors.map(({ message }, i) => (
      <span style={{ color: "red" }} key={i}>{message}</span>
    ))}
  </pre>
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
        if (loading || !data.listMarkets) return <Loading fullscreen={true} />;
        const markets =
          searchResults.length > 0 ? searchResults : data.listMarkets.items;

        return (
          <>
            {searchResults.length > 0 ? (
              <h2 style={{ color: "green" }}>
                <Icon type="success" name="check" className="icon" />
                {searchResults.length} Results
              </h2>
            ) : (
              <h2 className="header">
                <img
                  src="https://icon.now.sh/store_mall_directory/527FFF"
                  alt="Store Icon"
                  style={{ height: "30px", marginRight: "2px" }}
                />
                Markets
              </h2>
            )}

            {markets.map(market => (
              <div key={market.id} style={{ margin: "1em 0" }}>
                <Card
                  bodyStyle={{
                    padding: "0.7em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <span style={{ display: "flex" }}>
                      <Link className="link" to={`/markets/${market.id}`}>
                        {market.name}
                      </Link>{" "}
                      <span style={{ color: "var(--darkAmazonOrange)" }}>
                        {market.products.items.length}
                      </span>
                      <img
                        src="https://icon.now.sh/shopping_cart/f60"
                        alt="Shopping Cart"
                      />
                    </span>
                    <div style={{ color: "var(--lightSquidInk)" }}>
                      {market.owner}
                    </div>
                  </div>
                  <div>
                    {market.tags.map(tag => (
                      <Tag
                        key={tag}
                        type="danger"
                        style={{ margin: "0 0.5em" }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </>
        );
      }}
    </Connect>
  );
};

class NewMarket extends React.Component {
  state = {
    addMarketDialog: false,
    marketName: "",
    options: [],
    tags: ["Arts", "Technology", "Crafts"],
    selectedTags: []
  };

  handleAddMarket = async (event, user) => {
    event.preventDefault();
    try {
      this.setState({ addMarketDialog: false });
      const input = {
        name: this.state.marketName,
        tags: this.state.selectedTags,
        owner: user && user.username
      };
      const result = await API.graphql(
        graphqlOperation(createMarket, { input })
      );
      console.info(`Created market: id ${result.data.createMarket.id}`);
      this.setState({ marketName: "" });
    } catch (err) {
      Notification.error({
        title: "Error",
        message: `${err.message || "Error adding market"}`
      });
    }
  };

  handleSearchTags = query => {
    const filteredTags = this.state.tags
      .map(tag => ({ value: tag, label: tag }))
      .filter(tag => tag.label.toLowerCase().includes(query.toLowerCase()));
    this.setState({ options: filteredTags });
  };

  render() {
    const { marketName } = this.state;

    return (
      <UserContext.Consumer>
        {({ user }) => (
          <>
            <div className="market-header">
              <h1 className="market-title">
                Create Your Own MarketPlace
                <Button
                  className="market-title-button"
                  icon="edit"
                  size="large"
                  type="text"
                  onClick={() => this.setState({ addMarketDialog: true })}
                />
              </h1>

              <Form inline={true} onSubmit={this.props.handleSearch}>
                <Form.Item>
                  <Input
                    placeholder="Search Markets..."
                    value={this.props.searchTerm}
                    onChange={this.props.handleSearchChange}
                    icon="circle-cross"
                    onIconClick={this.props.handleClearSearch}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="info"
                    icon="search"
                    loading={this.props.isSearching}
                    onClick={this.props.handleSearch}
                  >
                    Search
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <Dialog
              title="Create New Market"
              visible={this.state.addMarketDialog}
              onCancel={() => this.setState({ addMarketDialog: false })}
              size="large"
              customClass="dialog"
            >
              <Dialog.Body>
                <Form labelPosition="top">
                  <Form.Item label="Add Market Name">
                    <Input
                      placeholder="Market Name"
                      value={marketName}
                      trim={true}
                      onChange={marketName => this.setState({ marketName })}
                    />
                  </Form.Item>
                  <Form.Item label="Add Tags">
                    <Select
                      multiple={true}
                      filterable={true}
                      placeholder="Market Tags"
                      onChange={selectedTags => this.setState({ selectedTags })}
                      remote={true}
                      remoteMethod={this.handleSearchTags}
                    >
                      {this.state.options.map(option => (
                        <Select.Option
                          key={option.value}
                          label={option.label}
                          value={option.value}
                        />
                      ))}
                    </Select>
                  </Form.Item>
                </Form>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  onClick={() => this.setState({ addMarketDialog: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  disabled={!marketName}
                  onClick={event => this.handleAddMarket(event, user)}
                >
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog>
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
      if (loading || !getMarket) return <Loading fullscreen={true} />;
      const isMarketOwner = user && user.username === getMarket.owner;

      return (
        <>
          <Link className="link" to="/">
            Back to Markets List
          </Link>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              paddingTop: "1em"
            }}
          >
            <h2 style={{ margin: "0 0.2em 0.2em 0" }}>{getMarket.name}</h2>•{" "}
            {getMarket.owner}
          </span>
          <div style={{ display: "flex", alignItems: "center", margin: 0 }}>
            <span
              style={{ color: "var(--lightSquidInk)", paddingBottom: "1em" }}
            >
              <Icon name="date" /> {formatProductDate(getMarket.createdAt)}
            </span>
          </div>
          <Tabs type="border-card" value={isMarketOwner ? "1" : "2"}>
            {isMarketOwner && (
              <Tabs.Pane
                label={
                  <>
                    <Icon name="plus" className="icon" />
                    Add Product
                  </>
                }
                name="1"
              >
                <NewProduct marketId={getMarket.id} />
              </Tabs.Pane>
            )}
            <Tabs.Pane
              label={
                <>
                  <Icon name="menu" className="icon" />
                  Products ({getMarket.products.items.length})
                </>
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

const ProductList = ({ products }) => (
  <div className="card-grid">
    {products.map(product => (
      <Product key={product.file.key} product={product} />
    ))}
  </div>
);

// Need to make Product a class component to add the ability to Update products
class Product extends React.Component {
  state = {
    updateProductDialog: false,
    deleteProductDialog: false
  };

  handleDeleteProduct = async productId => {
    try {
      this.setState({ deleteProductDialog: false });
      const input = { id: productId };
      await API.graphql(graphqlOperation(deleteProduct, { input }));
      Notification({
        title: "Success",
        message: "Product successfully deleted!",
        type: "success"
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error(`Failed to delete product with id: ${productId}`, err);
    }
  };

  render() {
    const { updateProductDialog, deleteProductDialog } = this.state;
    const { product } = this.props;

    return (
      <UserContext.Consumer>
        {({ user }) => {
          const isProductOwner = user && user.username === product.owner;

          return (
            <div className="card-container">
              <Card bodyStyle={{ padding: 0, minWidth: "200px" }}>
                <S3Image
                  imgKey={product.file.key}
                  theme={{
                    photoImg: { maxWidth: "100%", maxHeight: "100%" }
                  }}
                />
                <div className="card-body">
                  <span>{product.description}</span>
                  <div>
                    <span>${convertCentsToDollars(product.price)}</span>
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
              <div style={{ textAlign: "center" }}>
                {isProductOwner && (
                  <>
                    <Button
                      type="warning"
                      icon="edit"
                      style={{ margin: "7px" }}
                      onClick={() =>
                        this.setState({ updateProductDialog: true })
                      }
                    />
                    <Popover
                      placement="top"
                      width="160"
                      trigger="click"
                      visible={deleteProductDialog}
                      content={
                        <>
                          <p>Do you want to delete this?</p>
                          <div className="text-right">
                            <Button
                              size="mini"
                              type="text"
                              onClick={() =>
                                this.setState({ deleteProductDialog: false })
                              }
                            >
                              Cancel
                            </Button>
                            <Button
                              type="primary"
                              size="mini"
                              onClick={() =>
                                this.handleDeleteProduct(product.id)
                              }
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
                        onClick={() =>
                          this.setState({ deleteProductDialog: true })
                        }
                      />
                    </Popover>
                  </>
                )}
              </div>

              <Dialog
                title="Update Product"
                size="large"
                customClass="dialog"
                visible={updateProductDialog}
                onCancel={() => this.setState({ updateProductDialog: false })}
              >
                <Dialog.Body>Do you want to update this product?</Dialog.Body>
                <Dialog.Footer>
                  <Button
                    onClick={() =>
                      this.setState({ updateProductDialog: false })
                    }
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
            </div>
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
      title: "Success",
      message: "Product successfully created!",
      type: "success"
    });
    this.setState({ ...initialState });
  };

  render() {
    const { image, imagePreview, description, price, isUploading } = this.state;

    return (
      <>
        <h2 className="header">Add New Product</h2>
        <div className="market-header">
          <Form onSubmit={this.handleSubmit} className="market-header">
            <Form.Item label="Add Description">
              <Input
                type="text"
                icon="information"
                placeholder="Description"
                value={description}
                onChange={description => this.setState({ description })}
              />
            </Form.Item>
            <Form.Item label="Add Price">
              <Input
                type="number"
                icon="plus"
                placeholder="Price (USD)"
                value={price}
                onChange={price => this.setState({ price })}
              />
            </Form.Item>
            {imagePreview && (
              <img
                className="image-preview"
                src={imagePreview}
                alt="Product Preview"
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
                  padding: "0.8em",
                  minWidth: "250px",
                  maxHeight: "300px"
                },
                sectionHeader: {
                  padding: "0.2em",
                  color: "var(--darkAmazonOrange)"
                },
                photoPickerButton: {
                  display: "none"
                }
              }}
            />
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
        </div>
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
    userOrders: [],
    email: "",
    emailDialog: false,
    verificationCode: "",
    verificationForm: false,
    columns: [
      { prop: "name", width: `150` },
      { prop: "value", width: `320` },
      { prop: "tag", width: `100` },
      {
        prop: "operations",
        render: row => {
          switch (row.name) {
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
            case "Delete Profile":
              return (
                <Button
                  onClick={this.handleDeleteProfile}
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
        this.getUserOrders(attributesObj);
      } catch (err) {
        console.error(err);
      }
    }
  }

  handleUpdateEmail = async () => {
    try {
      const updatedAttributes = {
        email: this.state.email
      };
      const result = await Auth.updateUserAttributes(
        this.props.user,
        updatedAttributes
      );
      if (result === "SUCCESS") {
        this.sendVerificationCode("email");
      }
    } catch (err) {
      Notification.error({
        title: "Error",
        message: `${err.message || "Error updating email"}`
      });
    }
  };

  handleDeleteProfile = () => {
    MessageBox.confirm(
      "This will permanently delete your account. Continue?",
      "Attention!",
      {
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        type: "warning"
      }
    )
      .then(async () => await this.props.user.deleteUser())
      .catch(() => {
        Message({ type: "info", message: "Delete canceled" });
      });
  };

  sendVerificationCode = async attr => {
    await Auth.verifyCurrentUserAttribute(attr);
    this.setState({ verificationForm: true });
  };

  handleVerifyEmail = async attr => {
    try {
      const result = await Auth.verifyCurrentUserAttributeSubmit(
        attr,
        this.state.verificationCode
      );
      Notification({
        title: "Success",
        message: "Email successfully verified!",
        type: `${result.toLowerCase()}`
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      Notification.error({
        title: "Error",
        message: `${err.message || "Error updating email"}`
      });
    }
  };

  getUserOrders = async ({ sub }) => {
    const input = { id: sub };
    const result = await API.graphql(graphqlOperation(getUser, input));
    this.setState({ userOrders: result.data.getUser.orders.items });
  };

  render() {
    // prettier-ignore
    const { columns, email, emailDialog, verificationCode, verificationForm, userOrders } = this.state;

    return (
      <UserContext.Consumer>
        {({ user }) =>
          user && (
            <>
              <Tabs activeName="1" className="profile-tabs">
                <Tabs.Pane
                  label={
                    <>
                      <Icon name="document" className="icon" />
                      Summary
                    </>
                  }
                  name="1"
                >
                  <h2 className="header">Profile Summary</h2>
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
                        value: user.attributes.email,
                        tag: user.attributes.email_verified && (
                          <Tag type="success">Verified</Tag>
                        )
                      },
                      {
                        name: "Delete Profile",
                        value: <em>Sorry to see you go</em>
                      }
                    ]}
                    showHeader={false}
                    rowClassName={row =>
                      row.name === "Delete Profile" && "delete-profile"
                    }
                  />
                </Tabs.Pane>
                <Tabs.Pane
                  label={
                    <>
                      <Icon name="message" className="icon" />
                      Orders
                    </>
                  }
                  name="2"
                >
                  <h2 className="header">Order History</h2>
                  {userOrders.map(order => (
                    <div style={{ marginBottom: "0.5em" }}>
                      <Card key={order.id}>
                        <pre>
                          <p>Order Id: {order.id}</p>
                          <p>Description: {order.product.description}</p>
                          <p>
                            Price: ${convertCentsToDollars(order.product.price)}
                          </p>
                          <p>Owner: {order.product.owner}</p>
                          <p>Purchased at {formatOrderDate(order.createdAt)}</p>
                        </pre>
                      </Card>
                    </div>
                  ))}
                </Tabs.Pane>
              </Tabs>

              <Dialog
                size="large"
                customClass="dialog"
                title="Edit Email"
                visible={emailDialog}
                onCancel={() => this.setState({ emailDialog: false })}
              >
                <Dialog.Body>
                  <Form labelPosition="top">
                    <Form.Item label="Email">
                      <Input
                        onChange={email => this.setState({ email })}
                        value={email}
                      />
                    </Form.Item>
                    {verificationForm && (
                      <Form.Item label="Verification Code" labelWidth="120">
                        <Input
                          onChange={verificationCode =>
                            this.setState({ verificationCode })
                          }
                          value={verificationCode}
                        />
                      </Form.Item>
                    )}
                  </Form>
                </Dialog.Body>

                <Dialog.Footer>
                  <Button onClick={() => this.setState({ emailDialog: false })}>
                    Cancel
                  </Button>
                  {!verificationForm && (
                    <Button type="primary" onClick={this.handleUpdateEmail}>
                      Save
                    </Button>
                  )}
                  {verificationForm && (
                    <Button
                      type="primary"
                      onClick={() => this.handleVerifyEmail("email")}
                    >
                      Submit
                    </Button>
                  )}
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
    searchResults: [],
    isSearching: false
  };

  handleSearchChange = searchTerm => this.setState({ searchTerm });

  handleClearSearch = () => {
    this.setState({ searchTerm: "", searchResults: [] });
  };

  handleSearch = async event => {
    event.preventDefault();
    this.setState({ isSearching: true });
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
    this.setState({
      searchResults: result.data.searchMarkets.items,
      isSearching: false
    });
  };

  render() {
    return (
      <>
        <NewMarket
          handleSearchChange={this.handleSearchChange}
          handleSearch={this.handleSearch}
          handleClearSearch={this.handleClearSearch}
          searchTerm={this.state.searchTerm}
          isSearching={this.state.isSearching}
        />
        <MarketList searchResults={this.state.searchResults} />
      </>
    );
  }
}

const Navbar = ({ user, handleSignout }) => (
  <Nav mode="horizontal" theme="dark" defaultActive="1">
    <div className="nav-container">
      {/* App Title / Logo */}
      <Nav.Item index="1">
        <NavLink to="/" className="nav-link">
          <span className="app-title">
            <img
              src="https://icon.now.sh/account_balance/f90"
              className="app-logo"
              alt="Amazon Logo"
            />
            AmplifyAgora
          </span>
        </NavLink>
      </Nav.Item>

      {/* Navbar Items */}
      <div className="nav-items">
        <Nav.Item index="2">
          <span className="app-user">Hello, {user.username}</span>
        </Nav.Item>
        <Nav.Item index="3">
          <NavLink to="/profile" className="nav-link">
            <Icon name="setting" />
            Profile
          </NavLink>
        </Nav.Item>
        <Nav.Item index="4">
          <Button type="warning" onClick={handleSignout}>
            Signout
          </Button>
        </Nav.Item>
      </div>
    </div>
  </Nav>
);

const logger = new Logger("authLogger");

logger.onHubCapsule = async capsule => {
  if (capsule.payload.event === "signIn") {
    const getUserInput = {
      id: capsule.payload.data.signInUserSession.idToken.payload.sub
    };
    const { data } = await API.graphql(graphqlOperation(getUser, getUserInput));
    // if we can't get a user (meaning the user hasn't been registered before), then we call registerUser
    if (!data.getUser) {
      try {
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
      } catch (err) {
        console.log("Error registering new user", err);
      }
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

  componentDidMount() {
    /* Log the AmplifyTheme in order to see all the stylable properties */
    // console.dir(AmplifyTheme);
    this.getAuthUser();
    Hub.listen("auth", this, "onHubCapsule");
  }

  onHubCapsule = capsule => {
    if (capsule.payload.event === "signIn") {
      this.getAuthUser();
      console.log("called!");
      return;
    } else if (capsule.payload.event === "signOut") {
      this.setState({ user: null });
    }
  };

  handleSignout = async () => await Auth.signOut();

  render() {
    const { user } = this.state;

    return !user ? (
      <Authenticator theme={theme} />
    ) : (
      <UserContext.Provider value={{ user }}>
        <Router history={history}>
          <>
            {/* Navigation */}
            <Navbar user={user} handleSignout={this.handleSignout} />

            {/* Routing */}
            <div className="app-container">
              <Route exact path="/" component={HomePage} />
              <Route
                path="/profile"
                component={() => <ProfilePage user={user} />}
              />
              <Route
                path="/markets/:marketId"
                component={({ match }) => (
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

const theme = {
  /* Note: Best way to change background is by setting an html rule in App.css */
  ...AmplifyTheme,
  /* Remove Navbar styling when switching from withAuthenticator to Authenticator (since Authenticator has no Navbar) */
  // navBar: {
  //   ...AmplifyTheme.navBar,
  //   backgroundColor: "#FFC0CB"
  // },
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--amazonOrange)"
  },
  // can change the color of the sectionBody, but not of sectionForm currently (may change in the future)
  sectionBody: {
    ...AmplifyTheme.sectionBody,
    padding: "5px"
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)"
  }
};

export default App;
// export default withAuthenticator(App, true, [], null, myTheme);

// User: Mec81194@ebbob.com
// User 2: Iqa75829@ebbob.com
