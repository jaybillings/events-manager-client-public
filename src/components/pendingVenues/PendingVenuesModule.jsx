import React from "react";
import {buildSortQuery, renderTableHeader} from "../../utilities";
import app from "../../services/socketio";

import PendingListingsModule from "../PendingListingsModule";
import PaginationLayout from "../common/PaginationLayout";
import PendingVenueRow from "./PendingVenueRow";
import ShowHideToggle from "../common/ShowHideToggle";
import SelectionControl from "../common/SelectionControl";

export default class PendingVenuesModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'venues');

    Object.assign(this.state, {hoods: [], hoodsLoaded: false});

    this.defaultQuery = {$sort: {name: 1}, $limit: 100};

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchAllHoods = this.fetchAllHoods.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();

    this.pendingListingsService
      .on('created', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Added "${message.name}" as new pending ${this.schema.slice(0, -1)}`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchVenues());
      })
      .on('updated', message => {
        this.props.updateMessageList({status: 'info', details: message.details});
        this.fetchVenues();
      })
      .on('patched', message => {
        this.props.updateMessageList({
          status: 'success',
          details: `Updated pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.fetchVenues();
      })
      .on('removed', message => {
        this.props.updateMessageList({
          status: 'info',
          details: `Discarded pending ${this.schema.slice(0, -1)} "${message.name}"`
        });
        this.setState({currentPage: 1, pageSize: this.state.pageSize}, () => this.fetchVenues());
      });

    this.hoodsService
      .on('created', () => this.fetchHoods())
      .on('updated', () => this.fetchHoods())
      .on('patched', () => this.fetchHoods())
      .on('removed', () => this.fetchHoods());

    this.pendingHoodsService
      .on('created', () => this.fetchPendingHoods())
      .on('updated', () => this.fetchPendingHoods())
      .on('patched', () => this.fetchPendingHoods())
      .on('removed', () => this.fetchPendingHoods());
  }

  componentWillUnmount() {
    this.pendingListingsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.pendingHoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.fetchVenues();
    this.fetchAllHoods();
  }

  fetchVenues() {
    this.pendingListingsService.find({
      query: {
        $sort: buildSortQuery(this.state.sort),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({
        pendingListings: message.data, pendingListingsCount: message.total,
        listingsLoaded: true, selectedListings: []
      });
    });
  }

  fetchAllHoods() {
    // noinspection JSCheckFunctionSignatures
    Promise.all([
      this.hoodsService.find({query: this.defaultQuery}),
      this.pendingHoodsService.find({query: this.defaultQuery})
    ]).then(resultSet => {
      const hoods = resultSet[0].data.map(h => Object.assign(h, {source: 'live'}));
      const pendingHoods = resultSet[1].data.map(h => Object.assign(h, {source: 'pending'}));
      const allHoods = hoods.concat(pendingHoods);
      const uniqueHoods = [...new Set(allHoods)];

      this.setState({hoods: uniqueHoods, hoodsLoaded: true});
    });
  }

  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery}).then(results => {
      const hoods = results.data.map(h => Object.assign(h, {source: 'live'}));
      this.setState(prevState => ({hoods: Object.assign(prevState.hoods, hoods)}));
    });
  }

  fetchPendingHoods() {
    this.pendingHoodsService.find({query: this.defaultQuery}).then(results => {
      const pendingHoods = results.data.map(h => Object.assign(h, {source: 'pending'}));
      this.setState(prevState => ({hoods: Object.assign(prevState, pendingHoods)}));
    });
  }

  renderTable() {
    const pendingVenuesCount = this.state.pendingListingsCount;

    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    } else if (pendingVenuesCount === 0) {
      return <p>No pending venues to list.</p>;
    }

    const pendingVenues = this.state.pendingListings;
    const hoods = this.state.hoods;
    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['hood_id', 'Neighborhood'],
      ['created_at', 'Imported On'],
      ['status_NOSORT', 'Status']
    ]);
    const sort = this.state.sort;
    const pageSize = this.state.pageSize;
    const currentPage = this.state.currentPage;
    const isVisible = this.state.moduleVisible;
    const selectedVenues = this.state.selectedListings;
    const numSchemaLabel = selectedVenues.length || "All";
    const schemaLabel = selectedVenues.length === 1 ? 'venue' : 'venues';

    return ([
      <ShowHideToggle
        key={'venues-module-showhide'} isVisible={isVisible}
        changeVisibility={this.toggleModuleVisibility}
      />,
      <div key={'venues-module-body'}>
        <SelectionControl
          numSelected={selectedVenues.length}
          selectAll={this.selectAllListings} selectNone={this.selectNoListings}
        />
        <PaginationLayout
          key={'pending-venues-pagination'} schema={'pending-venues'}
          total={pendingVenuesCount} pageSize={pageSize} activePage={currentPage}
          updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
        />
        <table className={'schema-table'} key={'pending-venues-table'}>
          <thead>{renderTableHeader(titleMap, sort, this.updateColSort)}</thead>
          <tbody>
          {
            pendingVenues.map(venue =>
              <PendingVenueRow
                key={`venue-${venue.id}`} pendingListing={venue} selected={selectedVenues.includes(venue.id)}
                hood={hoods.find(h => {return h.uuid === venue.hood_uuid})} hoods={hoods}
                saveChanges={this.saveChanges} removeListing={this.removeListing}
                selectListing={this.handleListingSelect} queryForExisting={this.queryForExisting}
              />)
          }
          </tbody>
        </table>
        <button type={'button'} onClick={this.publishListings}>Publish {numSchemaLabel} {schemaLabel}</button>
        <button type={'button'} onClick={this.discardListings}>Discard {numSchemaLabel} {schemaLabel}</button>
      </div>
    ])
  }

  render() {
    const visibility = this.state.moduleVisible ? 'visible' : 'hidden';

    return (
      <div className={'schema-module'} data-visibility={visibility}>
        <h3>Venues</h3>
        {this.renderTable()}
      </div>
    );
  }
}
