import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase} from "../utilities";
import app from "../services/socketio";
import uuid from "uuid/v1";

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

    this.deleteListing = this.deleteListing.bind(this);
    this.saveListing = this.saveListing.bind(this);
    this.createListing = this.createListing.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.updateMessagePanel = this.updateMessagePanel.bind(this);
    this.dismissMessagePanel = this.dismissMessagePanel.bind(this);

    this.renderTable = this.renderTable.bind(this);
    this.renderAddForm = this.renderAddForm.bind(this);
  }

  componentDidMount() {
    const schemaSingular = this.schema.slice(0, -1);
    const onChangeCallback = () => { this.setState({currentPage: 1}, () => this.fetchAllData())};

    this.fetchAllData();

    // Register listeners
    this.listingsService
      .on('created', message => {
        this.updateMessagePanel({status: 'success', details: `Created new ${schemaSingular} "${message.name}"`});
        onChangeCallback();
      })
      .on('updated', message => {
        this.updateMessagePanel({status: 'success', details: `Updated ${schemaSingular} "${message.name}"`});
        onChangeCallback();
      })
      .on('patched', message => {
        this.updateMessagePanel({status: 'success', details: `Updated ${schemaSingular} "${message.name}"`});
        onChangeCallback();
      })
      .on('removed', message => {
        this.updateMessagePanel({status: 'success', details: `Permanently deleted ${schemaSingular} "${message.name}"`});
        onChangeCallback();
      });
  }

  componentWillUnmount() {
    this.listingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.listingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({listings: message.data, listingsTotal: message.total, listingsLoaded: true});
    });
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(message => {
      console.log(`removing ${this.schema}`, message)
    }, err => {
      this.props.updateMessageList({status: 'error', details: JSON.stringify(err)});
      console.log(`error deleting ${this.schema}: ${err}`);
    });
  }

  saveListing(id, newData) {
    const schema = this.schema;

    this.listingsService.patch(id, newData).then(message => {
      console.log(`patching ${schema}`, message);
    }, err => {
      console.log(`error patching ${schema}`, err);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  createListing(newData) {
    const schema = this.schema;

    // Give the new listing a UUID
    newData.uuid = uuid();

    this.listingsService.create(newData).then(() => {
      console.log(`creating ${schema}`);
    }, err => {
      console.log(`error creating ${schema}`, err);
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});

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

  updateMessagePanel(newMsg) {
    this.setState(prevState => ({messages: [newMsg, ...prevState.messages], messagePanelVisible: true}));
  }

  dismissMessagePanel() {
    this.setState({messages: [], messagePanelVisible: false});
  }

  renderTable() {
    const schema = this.schema;

    if (!this.state.listingsLoaded) {
      return <p>Data is being loaded... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p>No {schema} to list.</p>
    }

    const listings = this.state.listings;
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

    return <ListingAddForm schema={this.schema} createListing={this.createListing} />;
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
        <h3>Add New {titleCaseSchema.slice(0, -1)}</h3>
        {this.renderAddForm()}
      </div>
    );
  }
};
