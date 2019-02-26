import React, {Component} from 'react';
import app from '../../services/socketio';
import {arrayUnique, displayErrorMessages, renderOptionList, uniqueListingsOnly} from "../../utilities";

export default class ReplaceNeighborhoodsModule extends Component {
  constructor(props) {
    super(props);

    this.defaultQuery = {$sort: {name: 1}, $limit: 100};

    this.state = {
      liveHoods: [], uniqueHoods: [], pendingHoods: [], hoodToReplace: {}, hoodReplacingWith: {},
      hoodsLoaded: false,
    };

    this.hoodsService = app.service('neighborhoods');
    this.pendingHoodsService = app.service('pending-neighborhoods');
    this.vsBdNeighborhoodLookup = app.service('vs-bd-neighborhood-lookup');
    this.venuesService = app.service('venues');
    this.pendingVenuesService = app.service('pending-venues');

    this.fetchAllData = this.fetchAllData.bind(this);
    this.fetchHoods = this.fetchHoods.bind(this);
    this.fetchPendingHoods = this.fetchPendingHoods.bind(this);
    this.fetchPendingHoodsToReplace = this.fetchPendingHoodsToReplace.bind(this);
    this.fetchLiveHoodsToReplace = this.fetchLiveHoodsToReplace.bind(this);

    this.createNeighborhoodLookup = this.createNeighborhoodLookup.bind(this);
    this.replaceAndDeleteLive = this.replaceAndDeleteLive.bind(this);
    this.replaceAndDeletePending = this.replaceAndDeletePending.bind(this);
    this.handleListSelect = this.handleListSelect.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData() {
    Promise.all([
      this.fetchHoods(),
      this.fetchPendingHoods()
    ]).then(() => {
      const uniqueHoods = uniqueListingsOnly(this.state.liveHoods, this.state.pendingHoods);
      this.setState({uniqueHoods: uniqueHoods, hoodsLoaded: true});
    });
  }

  fetchHoods() {
    return this.hoodsService.find({query: this.defaultQuery}).then(result => {
      this.setState({liveHoods: result.data});
    }, err => {
      displayErrorMessages('fetch', 'neighborhoods', err, this.props.updateMessagePanel, 'reload');
      this.setState({hoodsLoaded: false});
    });
  }

  fetchPendingHoods() {
    return this.pendingHoodsService.find({query: this.defaultQuery}).then(result => {
      this.setState({pendingHoods: result.data});
    }, err => {
      displayErrorMessages('fetch', 'pending neighborhoods', err, this.props.updateMessagePanel, 'reload');
      this.setState({pendingHoodsLoaded: false});
    });
  }

  fetchLiveHoodsToReplace() {
    return this.hoodsService.find({query: {name: this.state.hoodToReplace.name}}).catch(err => {
      console.log("~~~ COE Logger ~~~ Could not fetch matching live hoods: " + JSON.stringify(err));
    });
  }

  fetchPendingHoodsToReplace() {
    return this.pendingHoodsService.find({query: {name: this.state.hoodToReplace.name}}).catch(err => {
      console.log("~~~ COE Logger ~~~ Could not fetch matching pending hoods: ");
      console.log(JSON.stringify(err));
      return null;
    });
  }

  createNeighborhoodLookup() {
    return this.vsBdNeighborhoodLookup.create({
      bd_region_name: this.state.hoodToReplace.name,
      vs_hood_id: this.state.hoodReplacingWith.id
    }).catch(err => {
      console.log('~~~ COE Logger ~~~ error creating neighborhood lookup:');
      console.log(JSON.stringify(err));
    });
  }

  replaceAndDeleteLive(matchingHoods) {
    const hoodIDs = matchingHoods.map(row => row.id);
    const target = this.state.hoodToReplace;

    // Replace with target
    this.venuesService.patch(null, {hood_id: target.id}, {query: {hood_id: {$in: hoodIDs}}})
      .then(() => {
        // Remove originals
        this.hoodsService.remove(null, {query: {id: {$in: hoodIDs}}}).catch(err => {
          this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        });
      }, err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  replaceAndDeletePending(matchingLiveHoods, matchingPendingHoods) {
    const target = this.state.hoodToReplace;
    let hoodUUIDs = [...matchingLiveHoods.map(row => row.uuid), ...matchingPendingHoods.map(row => row.uuid)];
    hoodUUIDs = arrayUnique(hoodUUIDs);

    this.pendingVenuesService.patch(null, {hood_uuid: target.uuid}, {query: {hood_uuid: {$in: hoodUUIDs}}})
      .then(() => {
        // Remove (pending) originals
        this.pendingHoodsService.remove(null, {query: {uuid: {$in: hoodUUIDs}}}).catch(err => {
          this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
        });
      }, err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      });
  }

  handleListSelect(e) {
    if (!e.target.name) return;
    this.setState({[e.target.name]: e.target.value.trim()});
  }

  async handleSubmit(e) {
    e.preventDefault();
    const target = this.state.hoodToReplace;
    const replacement = this.state.hoodReplacingWith;

    if (target.name.toLowerCase() === replacement.name.toLowerCase()) {
      this.props.updateMessagePanel({status: 'error', details: 'Cannot replace hood with same hood.'});
      return;
    }

    this.createNeighborhoodLookup()
      .then(() => {
        return Promise.all([
          this.replaceAndDeleteLive(),
          this.replaceAndDeletePending()
        ])
      })
      .then(() => {
        this.props.updateMessagePanel({
          status: 'success',
          details: `Replaced all neighborhoods named "${target.name}" with neighborhood #${replacement.id} "${replacement.name}"`
        });
      })
      .catch(err => {
        this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err.message)});
      });
  }

  render() {
    const defaultHoodToReplace = this.state.hoodToReplace || this.state.uniqueHoods[0].id;
    const defaultHoodReplacingWith = this.state.hoodReplacingWith || this.state.liveHoods[0].id;

    return (
      <div className={'schema-module manage-hoods'}>
        <form id={'neighborhood-replace-form'} className={'add-form'} onSubmit={this.handleSubmit}>
          <h3>Replace Neighborhoods</h3>
          <label>
            <span>Replace all neighborhoods named this:</span>
            <select name={'hoodToReplace'} value={defaultHoodToReplace} onChange={this.handleListSelect}>
              {renderOptionList(this.state.uniqueHoods)}
            </select>
          </label>
          <label>
            <span>With this neighborhood listing:</span>
            <select name={'hoodReplacingWith'} value={defaultHoodReplacingWith} onChange={this.handleListSelect}>
              {renderOptionList(this.state.liveHoods)}
            </select>
          </label>
          <button type={'submit'}>Replace and Delete Neighborhood</button>
        </form>
      </div>
    );
  }
};
