import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from '../../services/socketio';

import Header from '../../components/common/Header';
import PendingNeighborhoodRecord from '../../components/pendingNeighborhoods/PendingNeighborhoodRecord';
import MessagePanel from '../../components/common/MessagePanel';

export default class SinglePendingNeighborhoodLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false,
      pendingNeighborhood: {}, hoodLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.deleteNeighborhood = this.deleteNeighborhood.bind(this);
    this.saveNeighborhood = this.saveNeighborhood.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({hoodLoaded: false});

    // Register listeners
    this.pendingHoodsService
      .on('patched', message => {
        const patchMsg = {
          'status': 'success',
          'details': `Updated ${this.state.pendingNeighborhood.name} successfully.`
        };
        this.setState({pendingNeighborhood: message, hoodLoaded: true});
        this.updateMessagePanel(patchMsg);
      })
      .on('removed', () => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.pendingHoodService
      .removeListener('patched')
      .removeListener('removed');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    this.pendingHoodsService.get(id).then(message => {
      this.setState({pendingNeighborhood: message, hoodLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });
  }

  deleteNeighborhood(id) {
    this.pendingHoodsService.remove(id).then(this.setState({hasDeleted: true}));
  }

  saveNeighborhood(id, newData) {
    this.pendingHoodsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', err);
      this.updateMessagePanel(err);
    });
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: messageList.concat([msg]), messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!this.state.hoodLoaded) return <p>Data is loading... Please be patient...</p>;

    return <PendingNeighborhoodRecord pendingNeighborhood={this.state.pendingNeighborhood}
                                      saveNeighborhood={this.saveNeighborhood}
                                      deleteNeighborhood={this.deleteNeighborhood} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={`/import`} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <div className={'block-warning'}
             title={'Caution: This neighborhood is pending. It must be pushed live before it is visible on the site.'}>
          <h2>{this.state.pendingNeighborhood.name}</h2>
        </div>
        {this.renderRecord()}
      </div>
    );
  }
}
