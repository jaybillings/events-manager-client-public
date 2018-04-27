import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import TagRecord from '../../components/tags/TagRecord';

export default class SingleTagLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {tag: {}, tagLoaded: false, hasDeleted: false, notFound: false};
    this.tagsService = app.service('tags');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    // Register listeners
    this.tagsService
      .on('patched', message => {
        console.log('patched', message);
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log('removed', message);
        this.setState({hasDeleted: true});
      });
  }

  componentWillUnmount() {
    this.tagsService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.setState({tagLoaded: false});

    this.tagsService.get(id).then(message => {
      this.setState({tag: message, tagLoaded: true});
    }, message => {
      console.log('error', JSON.stringify(message));
      this.setState({notFound: true});
    });
  }

  renderRecord() {
    if (!this.state.tagLoaded) return <p>Data is loading... Please be patient...</p>;

    return <TagRecord tag={this.state.tag}/>
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'}/>;

    if (this.state.hasDeleted) return <Redirect to={'/tags/'}/>;

    return (
      <div className={'container'}>
        <Header/>
        <h2>{this.state.tag.name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
