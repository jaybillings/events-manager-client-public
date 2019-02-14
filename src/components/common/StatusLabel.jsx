import React, {Component} from 'react';

import '../../styles/status-label.css';

/**
 * The StatusLabel component displays a label showing the publish status of a row.
 * @class
 */
export default class StatusLabel extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{writeStatus: String, schema: String}} props
   */
  constructor(props) {
    super(props);
  }

  /**
   * Renders the component.
   * @override
   * @render
   *
   * @returns {*}
   */
  render() {
    const writeStatus = this.props.writeStatus || 'unknown';
    const statusKey = `${this.props.schema}-is${writeStatus}`;

    switch (writeStatus) {
      case 'new':
        return <span className={'status-label muted'} key={statusKey} title={'This is a new listing.'}>New</span>;
      case 'update':
        return <span className={'status-label alert'} key={statusKey} title={'This is an update to a preexisting listing.'}>Update</span>;
      case 'duplicate':
        return <span className={'status-label warning'} key={statusKey} title={'This is a new listing, but may duplicate a preexisting listing.'}>Duplicate</span>;
      case 'live':
        return <span className={'status-label bolded'} key={statusKey} title={'This listing is live and available for API ingestion.'}>Live</span>;
      case 'dropped':
        return <span className={'status-label muted'} key={statusKey} title={'This listing is dropped and will not be ingested by APIs.'}>Dropped</span>;
      default:
        return <span className={'status-label muted'} key={statusKey} title={'Unable to determine the status of this listing. Reload to try again.'}>Unknown</span>;
    }
  }
};
