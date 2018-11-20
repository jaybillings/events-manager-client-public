import React, {Component} from 'react';
import '../../styles/status-label.css';

export default class StatusLabel extends Component {
  render() {
    const isDup = this.props.isDup;
    const isNew = this.props.isNew;
    const schema = this.props.schema;

    if (isDup) {
      return <span className={'status-label status-dup'} key={`${schema}-is-dup`} title={`${schema} with this status will create new listings on publish that potentially duplicate live listings.`}>Duplicate</span>;
    } else if (isNew) {
      return <span className={'status-label muted'} key={`${schema}-is-new`} title={`${schema} with this status create new listings on publish.`}>New</span>;
    }
    return <span className={'status-label status-change'} key={`${schema}-is-updated`} title={`${schema} with this status modify existing listings on publish.`}>Update</span>;
  }
};
