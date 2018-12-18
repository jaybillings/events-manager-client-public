import React from "react";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import app from "../../services/socketio";

import Header from "../../components/common/Header";
import EventRecord from "../../components/events/EventRecord";
import MessagePanel from "../../components/common/MessagePanel";
import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

export default class SingleEventLayout extends SingleListingLayoutUniversal {
  constructor(props) {
    super(props, 'events');

    this.state = {
      listing: {}, venues: [], orgs: [], tags: [], tagsForListing: [],
      listingLoaded: false, venuesLoaded: false, orgsLoaded: false, tagsLoaded: false,
      hasDeleted: false, notFound: false, messages: [], messagePanelVisible: false,
    };

    this.venuesService = app.service('venues');
    this.orgsService = app.service('organizers');
    this.tagsService = app.service('tags');
    this.tagsLookupService = app.service('events-tags-lookup');
    this.liveEventService = app.service('events-live');
    this.droppedEventService = app.service('events-dropped');

    this.fetchVenues = this.fetchVenues.bind(this);
    this.fetchOrgs = this.fetchOrgs.bind(this);
    this.fetchTags = this.fetchTags.bind(this);
    this.fetchTagAssociations = this.fetchTagAssociations.bind(this);
    this.checkForLive = this.checkForLive.bind(this);

    this.createTagAssociations = this.createTagAssociations.bind(this);
    this.removeTagAssociations = this.removeTagAssociations.bind(this);
    this.registerEventLive = this.registerEventLive.bind(this);
    this.registerEventDropped = this.registerEventDropped.bind(this);
  }

  componentDidMount() {
    super.componentDidMount();

    this.venuesService
      .on('created', this.fetchVenues)
      .on('patched', this.fetchVenues)
      .on('removed', this.fetchVenues);

    this.orgsService
      .on('created', this.fetchOrgs)
      .on('patched', this.fetchOrgs)
      .on('removed', this.fetchOrgs);

    this.tagsService
      .on('created', this.fetchOrgs)
      .on('patched', this.fetchOrgs)
      .on('removed', this.fetchOrgs);

    this.liveEventService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to live list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from live list.'}));

    this.droppedEventService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Event added to dropped list.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Event removed from dropped list'}));

    this.tagsLookupService
      .on('created', () => this.updateMessagePanel({status: 'info', details: 'Saved tag associated with event.'}))
      .on('removed', () => this.updateMessagePanel({status: 'info', details: 'Removed tag associated with event.'}));
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    this.venuesService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.orgsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.tagsService
      .removeAllListeners('created')
      .removeAllListeners('patched')
      .removeAllListeners('removed');

    this.liveEventService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    this.droppedEventService
      .removeAllListeners('created')
      .removeAllListeners('removed');

    this.tagsLookupService
      .removeAllListeners('created')
      .removeAllListeners('removed');
  }

  fetchAllData() {
    this.fetchListing();
    this.fetchVenues();
    this.fetchOrgs();
    this.fetchTags();
    this.fetchTagAssociations();
  }

  fetchListing() {
    this.listingsService.get(this.props.match.params.id).then(message => {
      this.setState({listing: message, listingLoaded: true});
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({notFound: true});
    });
  }

  fetchVenues() {
    this.venuesService.find({query: this.defaultQuery}).then(message => {
      this.setState({venues: message.data, venuesLoaded: true})
    }, err => {
      console.log('fetch venue error', JSON.stringify(err));
      this.setState({venuesLoaded: false});
    });
  }

  fetchOrgs() {
    this.orgsService.find({query: this.defaultQuery}).then(message => {
      this.setState({orgs: message.data, orgsLoaded: true})
    }, err => {
      console.log('fetch org error', JSON.stringify(err));
      this.setState({orgsLoaded: false});
    });
  }

  fetchTags() {
    this.tagsService.find({query: this.defaultQuery}).then(message => {
      this.setState({tags: message.data, tagsLoaded: true});
    }, err => {
      console.log('find tags error', JSON.stringify(err));
      this.setState({tagsLoaded: false});
    });
  }

  fetchTagAssociations() {
    this.tagsLookupService.find({query: {event_id: this.state.listing.id}}).then(message => {
      console.log("+++++++++++++" + JSON.stringify(message));
      this.setState({tagsForListing: message.data.map(row => row.tag_id)});
    }, err => {
      console.log('find tags-lookup error', JSON.stringify(err));
    });
  }

  checkForLive() {
    return this.liveEventService.find({query: {event_id: this.state.listing.id}});
  }

  updateListing(eventData, tagData, publishState) {
    this.listingsService.patch(this.state.listing.id, eventData).then(() => {
      console.log('in updatelisting');
      if (tagData.toSave) {
        this.createTagAssociations(tagData.toSave);
      }
      if (tagData.toRemove) {
        this.removeTagAssociations(tagData.toRemove);
      }


      if (publishState === 'publish') {
        this.registerEventLive();
      } else if (publishState === 'drop') {
        this.registerEventDropped();
      }
    }, err => {
      this.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  deleteListing(id) {
    this.listingsService.remove(id).then(() => {
      // noinspection JSCheckFunctionSignatures
      Promise.all([
        this.removeTagAssociations(),
        this.registerEventDropped()
      ]).then(() => {
        this.setState({hasDeleted: true});
      }, err => {
        console.log('remove event error', JSON.stringify(err));
      });
    });
  }

  createTagAssociations(tagsToSave) {
    this.tagsLookupService.create(tagsToSave).catch(err => {
      const details = `Could not associate tags with event. Please re-save listing. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  removeTagAssociations(tagsToRemove) {
    return this.tagsLookupService.remove(null, {query: {event_id: {$in: tagsToRemove}}}).catch(err => {
      const details = `Could not de-associate tags from event. Please re-save listing. Error is: ${JSON.stringify(err)}`;
      this.updateMessagePanel({status: 'error', details: details});
    });
  }

  registerEventLive() {
    const id = this.state.listing.id;

    //noinspection JSCheckFunctionSignatures
    Promise.all([
      this.liveEventService.create({event_id: id}),
      this.droppedEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event as live. Error is: ${JSON.stringify(err)}`
      });
    });
  }

  registerEventDropped() {
    const id = this.state.listing.id;

    // noinspection JSCheckFunctionSignatures
    Promise.all([
      this.droppedEventService.create({event_id: id}),
      this.liveEventService.remove(null, {query: {event_id: id}})
    ]).catch(err => {
      this.updateMessagePanel({
        status: 'error',
        details: `Failed to register event as live. Error is: ${JSON.stringify(err)}`
      });
    });
  }

  renderRecord() {
    if (!(this.state.listingLoaded && this.state.venuesLoaded && this.state.orgsLoaded && this.state.tagsLoaded)) {
      return <p>Data is loading... Please be patient...</p>;
    }

    return <EventRecord listing={this.state.listing} venues={this.state.venues} orgs={this.state.orgs}
                        tags={this.state.tags} tagsForListing={this.state.tagsForListing}
                        updateListing={this.updateListing} deleteListing={this.deleteListing}
                        checkForLive={this.checkForLive} />;
  }

  render() {
    if (this.state.notFound) return <Redirect to={'/404'} />;

    if (this.state.hasDeleted) return <Redirect to={'/events'} />;

    const showMessagePanel = this.state.messagePanelVisible;
    const messages = this.state.messages;
    const name = this.state.listing.name;

    return (
      <div className={'container'}>
        <Header />
        <p><Link to={'/events'}>&lt; Return to events</Link></p>
        <MessagePanel messages={messages} isVisible={showMessagePanel} dismissPanel={this.dismissMessagePanel} />
        <h2>{name}</h2>
        {this.renderRecord()}
      </div>
    );
  }
};
