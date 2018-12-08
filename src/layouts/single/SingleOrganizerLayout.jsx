import React, {Component} from 'react';
import {Redirect} from 'react-router';
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import OrganizerRecord from "../../components/organizers/OrganizerRecord";
import MessagePanel from "../../components/common/MessagePanel";

export default class SingleOrganizerLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], messagePanelVisible: false, org: {}, orgLoaded: false,
      hasDeleted: false, notFound: false
    };

    this.orgsService = app.service('organizers');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.renderRecord = this.renderRecord.bind(this);
    this.saveOrg = this.saveOrg.bind(this);
    this.deleteOrg = this.deleteOrg.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.setState({orgLoaded: false});

    // Register listeners
    this.orgsService
      .on('patched', message => {
        this.setState({org: message, orgLoaded: true});
      })
      .on('removed', message => {
        this.setState({hasDeleted: true});
      })
      .on('error', () => console.log("Error handler triggered. Should post to messagePanel."));
  }

  componentWillUnmount() {
    this.orgsService
      .removeAllListeners('patched')
      .removeAllListeners('removed')
      .removeAllListeners('error');
  }

  fetchAllData() {
    const id = this.props.match.params.id;

    //this.setState({orgLoaded: false});

    this.orgsService.get(id).then(message => {
      this.setState({org: message, orgLoaded: true});
    }, message => {
      console.log('error', message);
      this.setState({notFound: true});
    });
  }

  deleteOrg(id) {
    this.orgsService.remove(id).then(() => this.setState({hasDeleted: true}));
  }

  saveOrg(id, newData) {
    this.orgsService.patch(id, newData).then(message => {
      console.log('patch', message);
    }, err => {
      console.log('error', JSON.stringify(err));
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  updateMessagePanel(msg) {
    this.setState({messages: [msg, ...this.state.messages], messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderRecord() {
    if (!this.state.orgLoaded) return <p>Data is loading... Please be patient...</p>;

    return <OrganizerRecord org={this.state.org} saveOrg={this.saveOrg} deleteOrg={this.deleteOrg}/>;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/organizers'} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.org.name;

    return (
      <div className={'container'}>
        <Header/>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
