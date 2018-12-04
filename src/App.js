import React from "react";
import aws_exports from "./aws-exports";
import { withAuthenticator, Connect } from "aws-amplify-react";
// modular imports
import Amplify, { Auth, API, graphqlOperation } from "aws-amplify";
import { Grid, Header, Input, List, Segment } from "semantic-ui-react";
import { listAlbums } from "./graphql/queries";
import { createAlbum } from "./graphql/mutations";
import { onCreateAlbum } from "./graphql/subscriptions";
Amplify.configure(aws_exports);

const AlbumsList = ({ albums }) => (
  <Segment>
    <Header as="h3">My Albums</Header>
    <List divided relaxed>
      {albums.map(album => (
        <List.Item key={album.id}>{album.name}</List.Item>
      ))}
    </List>
  </Segment>
);

const Albums = () => {
  const onNewAlbum = (prevQuery, newData) => {
    let updatedQuery = { ...prevQuery };
    const updatedAlbumList = [
      ...prevQuery.listAlbums.items,
      newData.onCreateAlbum
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
        if (loading || !data) return <h3>Loading...</h3>;
        if (errors.length > 0) {
          return <div>{JSON.stringify(errors)}</div>;
        }
        return <AlbumsList albums={data.listAlbums.items} />;
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
    await Auth.currentUserInfo()
      .then(data => {
        this.setState({ owner: data.username });
      })
      .catch(error => console.log(`Error: ${error.message}`));
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
      <Segment>
        <Header as="h3">Add a new album</Header>
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
      </Segment>
    );
  }
}

const App = () => (
  <Grid padded>
    <Grid.Column>
      <NewAlbum />
      <Albums />
    </Grid.Column>
  </Grid>
);

export default withAuthenticator(App, { includeGreetings: true });
