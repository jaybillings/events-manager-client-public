import React, {Component} from 'react';
import app from '../../services/socketio';

import Header from "../../components/common/Header";
import TagsTable from '../../components/tags/TagsTable';
import TagsAddForm from '../../components/tags/TagsAddForm';

export default class TagsLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {tags: [], tagsLoaded: false};
    this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.tagsService
      .on('created', message => {
        console.log('created', message);
        this.fetchAllData();
      })
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.fetchAllData();
      });
  }

  componentWillUnmount() {
    this.tagsService
      .removeListener('created')
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    this.tagsService.find({query: {$sort: {updated_at: -1}, $limit: 25}})
      .then(message => {
        this.setState({tags: message.data, tagsLoaded: true})
      });
  }

  renderTable() {
    if (!this.state.tagsLoaded) return <p>Data is being loaded... Please be patient...</p>;

    return <TagsTable tags={this.state.tags}/>
  }

  render() {
    return (
      <div className={'container'}>
        <Header/>
        <h2>Tags</h2>
        <h3>View/Modify</h3>
        {this.renderTable()}
        <h3>Add New Tag</h3>
        <TagsAddForm/>
      </div>
    );
  }
};
