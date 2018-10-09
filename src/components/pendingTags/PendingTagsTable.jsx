import React, {Component} from 'react';
import {renderTableHeader} from '../../utilities';

import PendingTagRow from './PendingTagRow';

import '../../styles/schema-table.css';

export default class PendingTagsTable extends Component {
  render() {
    const pendingTags = this.props.pendingTags;
    const columnSort = this.props.sort;
    const clickHandler = this.props.handleColumnClick;
    const titleMap = new Map([
      ['name', 'Name'],
      ['created_at', 'Imported On']
    ]);

    return (
      <table className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, columnSort, clickHandler)}</thead>
        <tbody>
        {
          pendingTags.map(tag => <PendingTagRow key={`tag-${tag.id}`} pendingTag={tag} />)
        }
        </tbody>
      </table>
    );
  }
};
