import React from "react";
import app from "../../services/socketio";
import {displayErrorMessages, renderTableHeader} from "../../utilities";

import VenueRow from "../../components/venues/VenueRow";
import VenueAddForm from "../../components/venues/VenueAddForm";
import ListingsLayout from "../../components/ListingsLayout";
import PaginationLayout from "../../components/common/PaginationLayout";

/**
 * VenuesLayout is a component which lays out the venues collection page.
 * @class
 * @child
 */
export default class VenuesLayout extends ListingsLayout {
  /**
   * The class's constructor.
   * @param {object} props
   */
  constructor(props) {
    super(props, 'venues');

    Object.assign(this.state, {
      hoods: [], hoodsLoaded: false
    });

    this.hoodsService = app.service('neighborhoods');

    this.fetchHoods = this.fetchHoods.bind(this);
  }

  /**
   * Runs when the component mounts. Fetches data and registers data service listeners.
   * @override
   */
  componentDidMount() {
    super.componentDidMount();

    this.hoodsService
      .on('created', () => {
        this.fetchHoods()
      })
      .on('updated', () => {
        this.fetchHoods()
      })
      .on('patched', () => {
        this.fetchHoods()
      })
      .on('removed', () => {
        this.fetchHoods()
      });
  }

  /**
   * Runs before the component unmounts. Unregisters data service listeners.
   * @override
   */
  componentWillUnmount() {
    super.componentWillUnmount();

    this.hoodsService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * Fetches all data required for the table.
   */
  fetchAllData() {
    super.fetchAllData();
    this.fetchHoods();
  }

  /**
   * Fetches data for all published neighborhoods.
   */
  fetchHoods() {
    this.hoodsService.find({query: this.defaultQuery})
      .then(message => {
        this.setState({hoods: message.data, hoodsLoaded: true});
      })
      .catch(err => {
        displayErrorMessages('fetch', 'neighborhoods', err, this.updateMessagePanel, 'reload');
        this.setState({hoodsLoaded: false});
      });
  }

  /**
   * Renders the venue collection table.
   *
   * @override
   * @returns {*}
   */
  renderTable() {
    if (!(this.state.listingsLoaded && this.state.hoodsLoaded)) {
      return <p key={'venues-message'} className={'loading-message single-message info'}>Data is loading... Please be patient...</p>;
    } else if (this.state.listingsTotal === 0) {
      return <p key={'venues-message'} className={'single-message no-content'}>No venues to list.</p>
    }

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['name', 'Name'],
      ['fk_hoods.name', 'Neighborhood'],
      ['updated_at', 'Last Modified']
    ]);

    const hoods = this.state.hoods;

    return ([
      <PaginationLayout
        key={'venues-pagination'} schema={'venues'} total={this.state.listingsTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={true}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <div className={'wrapper'} key={'venues-table-wrapper'}>
        <table key={'venues-table'} className={'schema-table'}>
          <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
          <tbody>
          {
            this.state.listings.map(venue =>
              <VenueRow
                key={venue.id} schema={'venues'} listing={venue} hoods={hoods}
                hood={hoods.find(h => {
                  return h.uuid === venue.hood_uuid
                })}
                updateListing={this.updateListing} deleteListing={this.deleteListing}
                createPendingListing={this.createPendingListing} checkForPending={this.checkForPending}
              />
            )
          }
          </tbody>
        </table>
      </div>
    ]);
  }

  /**
   * Renders the form for adding a new venue.
   *
   * @override
   * @returns {*}
   */
  renderAddForm() {
    if (!this.state.hoodsLoaded) {
      return <div className={'single-message info loading-message'}>Data is loading... Please be patient...</div>;
    }

    return <VenueAddForm
      schema={'venues'} hoods={this.state.hoods}
      createListing={this.createListing} createPendingListing={this.createPendingListing}
    />;
  }
};
