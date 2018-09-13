import React, {Component} from 'react';

import SortIndicator from '../common/SortIndicator';
import EventRow from './EventRow';

import '../../styles/schema-table.css';

export default class EventsTable extends Component {
  constructor(props) {
    super(props);

    this.renderHeader = this.renderHeader.bind(this);
  }

  renderHeader() {
    const titleMap = new Map([
      ['name', 'Name'],
      ['start_date', 'Start Date'],
      ['end_date', 'End Date'],
      ['fk_venue', 'Venue'],
      ['fk_org', 'Organizer'],
      ['is_published', 'Status'],
      ['updated_at', 'Last Modified']
    ]);
    let headersList = [<th key={'none'}>Actions</th>];

    titleMap.forEach((title, dataKey) => {
      let classNames = 'sort-label', direction = 0;

      // TODO: Is 'active' being used?
      if (this.props.sort[0] === dataKey) {
        classNames += ' active';
        direction = this.props.sort[1];
      }

      headersList.push(
        <th className={classNames} key={dataKey} data-sort-type={dataKey} onClick={this.props.handleColumnClick}>
          {title} <SortIndicator direction={direction} />
        </th>
      );
    });

    return <tr>{headersList}</tr>;
  }

  render() {
    const events = this.props.events;
    const venues = this.props.venues;
    const organizers = this.props.organizers;

    return (
      <table className={'schema-table'}>
        <thead>
        {this.renderHeader()}
        </thead>
        <tbody>
        {
          events.map(event =>
            <EventRow key={event.id}
                      event={event}
                      venue={venues.find(v => {
                        return v.id === event.venue_id
                      })}
                      organizer={organizers.find(o => {
                        return o.id === event.org_id
                      })}
                      venues={venues}
                      organizers={organizers}
            />
          )
        }
        </tbody>
      </table>
    );
  }
};
