import React, {Component} from 'react';

import '../../styles/status-label.css';

/**
 * The StatusLabel component displays a label showing the publish status of a row.
 *
 * @class
 */
export default class StatusLabel extends Component {
  /**
   * Renders the component.
   *
   * @render
   * @returns {*}
   */
  render() {
    const writeStatus = this.props.writeStatus;
    const schema = this.props.schema;

    switch (writeStatus) {
      case 'new':
        return <span className={'status-label muted'} key={`${schema}-is-new`} title={'This is a new listing.'}>New</span>;
      case 'update':
        return <span className={'status-label status-change'} key={`${schema}-is-update`} title={'This is an update to a preexisting listing.'}>Update</span>;
      case 'duplicate':
        return <span className={'status-label status-dup'} key={`${schema}-is-dup`} title={'This is a new listing, but may duplicate a preexisting listing.'}>Duplicate</span>;
      default:
        return <span className={'status-label muted'} key={`${schema}-is-unknown`} title={'Unable to determine the status of this listing. Reload to try again.'}>Unknown</span>;
    }
  }
};
