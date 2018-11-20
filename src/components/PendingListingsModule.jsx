import React, {Component} from "react";
import {buildColumnSort, buildSortQuery, makeTitleCase, renderTableHeader} from "../utilities";
import app from '../services/socketio';

import PaginationLayout from "./common/PaginationLayout";
import PendingListingRow from "./PendingListingRow";
import ShowHideToggle from "./common/ShowHideToggle";

import '../styles/schema-module.css';
import '../styles/schema-table.css';
import SelectionControl from "./common/SelectionControl";

export default class PendingListingsModule extends Component {
  constructor(props, schema) {
    super(props);

    this.state = {
      moduleVisible: true, pendingListings: [], pendingListingsCount: 0, selectedListings: [],
      pageSize: this.props.defaultPageSize, currentPage: 1, sort: this.props.defaultSortOrder
    };

    this.schema = schema;
    this.pendingListingsService = app.service(`pending-${this.schema}`);
    this.listingsService = app.service(this.schema);

    this.fetchAllData = this.fetchAllData.bind(this);
    this.publishListings = this.publishListings.bind(this);
    this.saveChanges = this.saveChanges.bind(this);
    this.discardListing = this.discardListing.bind(this);

    this.updateColSort = this.updateColSort.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.queryForSimilar = this.queryForSimilar.bind(this);
    this.toggleModuleVisibility = this.toggleModuleVisibility.bind(this);
    this.handleListingSelect = this.handleListingSelect.bind(this);
    this.selectAllListings = this.selectAllListings.bind(this);
    this.selectNoListings = this.selectNoListings.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({status: 'success', details: `Added ${message.name} with ID #${message.id}`});
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      })
      .on('updated', message => {
        // Message already formatted properly by server code
        this.props.updateMessageList(message);
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessageList({status: 'success', details: `Updated #${message.id} - ${message.name}`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Discarded ${this.schema} #${message.id} - ${message.name}`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchAllData());
      });
  }

  componentWillUnmount() {
    this.pendingListingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.pendingListingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({pendingListings: message.data, pendingListingsCount: message.total});
    });
  }

  publishListings() {
    // TODO: Use 'selections' array of IDs
    this.pendingListingsService.find({paginate: false}).then(resultSet => {
      resultSet.data.forEach(listing => {
        if (listing.target_id) {
          this.updateLiveListing(listing);
        } else {
          this.createLiveListing(listing);
        }
      });
    });
  }

  saveChanges(id, newData) {
    this.pendingListingsService.patch(id, newData).then(message => {
      console.log(`patching ${this.schema}`, message)
    }, err => {
      console.log(`patching ${this.schema} error`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  discardListing(id) {
    this.pendingListingsService.remove(id).then(message => {
      console.log(`removing ${this.schema}`, message);
    }, err => {
      console.log(`error removing ${this.schema} error`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  createLiveListing(listing) {
    const id = listing.id;

    delete (listing.id);
    delete (listing.target_id);

    this.listingsService.create(listing).then(msg => {
      console.log(`creating ${this.schema}`, msg);
      this.props.updateMessageList({
        status: 'success',
        details: `Published live ${this.schema} ${msg.name} with ID ${msg.id}`
      });
      this.discardListing(id);
    }, err => {
      console.log(`error creating ${this.schema}`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  updateLiveListing(listing) {
    const id = listing.id;
    const target_id = listing.target_id;

    delete (listing.id);
    delete (listing.target_id);

    this.listingsService.update(target_id, listing).then(msg => {
      console.log(`updating ${this.schema}`, msg);
      this.props.updateMessageList({
        status: 'success',
        details: `Updated live ${this.schema} #${listing.id} - ${listing.name}`
      });
      this.discardListing(id);
    }, err => {
      console.log(`error updating ${this.schema}`, err);
      this.props.updateMessageList({status: 'error', details: err.message});
    });
  }

  updateColSort(e) {
    const columnSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: columnSortState}, () => this.fetchAllData());
  }

  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  async queryForSimilar(pendingListing) {
    return this.listingsService.find({
      query: {
        name: pendingListing.name,
        start_date: pendingListing.start_date,
        end_date: pendingListing.end_date
      }
    });
  }

  toggleModuleVisibility() {
    this.setState(prevState => ({moduleVisible: !prevState.moduleVisible}));
  }

  handleListingSelect(id, shouldAdd) {
    const selections = this.state.selectedListings;

    if (shouldAdd) {
      selections.push(id);
      const uniqueArray = Array.from(new Set(selections));
      this.setState({selectedListings: uniqueArray});
    } else {
      const index = selections.indexOf(id);
      if (index > -1) {
        selections.splice(index, 1);
        this.setState({selectedListings: selections});
      }
    }
  }

  selectAllListings() {
    const allListingIDs = this.state.pendingListings.map(listing => listing.id);
    this.setState({selectedListings: allListingIDs});
  }

  selectNoListings() {
    this.setState({selectedListings: []});
  }

  renderTable() {
    const pendingListings = this.state.pendingListings;
    const pendingListingsCount = this.state.pendingListingsCount;

    if (!pendingListings) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingListingsCount === 0) {
      return <p>No pending {this.schema} to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const schema = this.schema;
    const selectedListings = this.state.selectedListings;

    return ([
      <ShowHideToggle
        key={`${schema}-module-showhide`} isVisible={isVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={`${schema}-module-body`}>
        <SelectionControl
          numSelected={selectedListings.length} totalCount={pendingListings.length} schema={schema}
          selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={`pending-${schema}-pagination`} schema={`pending-${schema}`}
          total={pendingListingsCount} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={`pending-${schema}-table`}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingListings.map(listing =>
              <PendingListingRow
                key={`${this.schema}-${listing.id}`} schema={schema} pendingListing={listing}
                selected={this.state.selectedListings.includes(listing.id)}
                saveChanges={this.saveChanges} discardListing={this.discardListing}
                listingIsDup={this.queryForSimilar} handleListingSelect={this.handleListingSelect}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} onClick={this.publishListings}>Publish All Pending {schema}</button>
      </div>
    ])
  }

  render() {
    const schema = this.schema;
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>{makeTitleCase(schema)}</h3>
        {this.renderTable()}
      </div>
    )
  }
}
