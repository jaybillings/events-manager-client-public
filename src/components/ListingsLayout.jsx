import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase} from "../utilities";
import app from "../services/socketio";

import Header from "./common/Header";
import ListingsTable from "./ListingsTable";
import ListingAddForm from "./ListingAddForm";
import MessagePanel from "./common/MessagePanel";

export default class ListingsLayout extends Component {
  constructor(props, schema) {
    super(props);

    this.schema = schema;
    this.defaultPageSize = 5;
    this.defaultTableSort = ['updated_at', -1];

    this.state = {
      listings: [], listingsTotal: 0, listingsLoaded: false,
      pageSize: this.defaultPageSize, currentPage: 1, sort: this.defaultTableSort,
      messagePanelVisible: false, messages: []
    };

    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.deleteListing = this.deleteListing.bind(this);
    this.saveListing = this.saveListing.bind(this);
    this.createListing = this.createListing.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  componentDidMount() {
    const schema = this.schema;

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        console.log(`${schema} created`, message);
        this.updateMessagePanel({status: 'success', details: `Created ${schema} #${message.id} - ${message.name}`});
        this.setState({currentPage: 1}, () => this.fetchAllData());
      })
      .on('patched', message => {
        console.log(`${schema} patched`, message);
        this.updateMessagePanel({status: 'success', details: `Updated ${schema} #${message.id} - ${message.name}`});
        this.fetchAllData();
      })
      .on('removed', message => {
        console.log(`${schema} removed`, message);
        this.updateMessagePanel({
          status: 'success',
          details: `Permanently deleted ${schema} #${message.id} - ${message.name}`
        });
        this.setState({currentPage: 1}, () => this.fetchAllData());
      })
      .on('error', error => {
        console.log(`${schema} error`, error);
        this.updateMessagePanel({status: 'error', details: error.message});
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;

    this.listingsService.find({
      query: {
        $sort: buildSortQuery(sort),
        $limit: pageSize,
        $skip: pageSize * (currentPage - 1)
      }
    }).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true})
    });
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchAllData());
  }

  updateMessagePanel(msg) {
    const messageList = this.state.messages;
    this.setState({messages: messageList.concat([msg]), messagePanelVisible: true});
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  deleteListing(id) {
    const schema = this.schema;
    this.listingsService.remove(id).then(message => console.log(`removing ${schema}`, message));
  }

  saveListing(id, newData) {
    const schema = this.schema;

    this.listingsService.patch(id, newData).then(message => {
      console.log(`patching ${schema}`, message);
    }, err => {
      console.log(`error patching ${schema}`, err);
      this.updateMessagePanel(err);
    });
  }

  createListing(newData) {
    const schema = this.schema;

    this.listingsService.create(newData).then(() => {
      console.log(`creating ${schema}`);
    }, err => {
      console.log(`error creating ${schema}`, err);
      this.updateMessagePanel(err);
    });
  }

  renderTable() {
    if (!this.state.listingsLoaded) {
      return <p>Data is being loaded... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No tags to list.</p>
    }

    const listings = this.state.listings;
    const schema = this.schema;

    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const total = this.state.listingsTotal;
    const sort = this.state.sort;

    return <ListingsTable
      listings={listings} listingsTotal={total} schema={schema}
      pageSize={pageSize} currentPage={currentPage} sort={sort}
      updateColumnSort={this.updateColumnSort} updatePageSize={this.updatePageSize}
      updateCurrentPage={this.updateCurrentPage} deleteListing={this.deleteListing} saveListing={this.saveListing}
    />;
  }

  renderAddForm() {
    if (!this.state.listingsLoaded) {
      return <p>Data is loading... Please be patient...</p>;
    }

    const listings = this.state.listings;
    const schema = this.schema;

    return <ListingAddForm tags={listings} schema={schema} createListing={this.createListing} />;
  }

  render() {
    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const titleCaseSchema = makeTitleCase(this.schema);

    return (
      <div className={'container'}>
        <Header />
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>All {titleCaseSchema}</h2>
        {this.renderTable()}
        <h3>Add New {titleCaseSchema}</h3>
        {this.renderAddForm()}
      </div>
    );
  }
};
