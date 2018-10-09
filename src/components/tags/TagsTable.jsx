import React, {Component} from 'react';

import TagRow from './TagRow';
import '../../styles/schema-table.css';

export default class TagsTable extends Component {
  render() {
    const tags = this.props.tags;

    return (
      <table className={'schema-table'}>
        <thead>
        <tr>
          <th>Actions</th>
          <th>Name</th>
          <th>Last Modified</th>
        </tr>
        </thead>
        <tbody>
        {tags.map(tag => <TagRow key={tag.id} tag={tag}/>)}
        </tbody>
      </table>
    );
  }
};
