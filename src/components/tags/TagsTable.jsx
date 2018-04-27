import React, {Component} from 'react';

import TagsRow from './TagsRow';
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
        {tags.map(tag => <TagsRow key={tag.id} tag={tag}/>)}
        </tbody>
      </table>
    );
  }
};
