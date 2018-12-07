import React from 'react';
import SortIndicator from "./components/common/SortIndicator";
import {Link} from "react-router-dom";

const renderOptionList = function (schema) {
  let optionsList = [];

  schema.forEach(record => {
    optionsList.push(<option key={record.uuid} value={record.uuid}>{record.name}</option>);
  });

  return optionsList;
};

const renderCheckboxList = function (schema, selectedIds) {
  let chkbxList = [];

  schema.forEach(record => {
    chkbxList.push(
      <li key={record.id}>
        <label>
          <input type={'checkbox'} className={'js-checkbox'} value={record.uuid}
                 defaultChecked={selectedIds.includes(record.id)} />
          {record.name}
        </label>
      </li>
    )
  });

  return <ul className={'tags-container'}>{chkbxList}</ul>;
};

const renderTableHeader = function (headerMap, sortState, clickHandler) {
  let headersList = [];

  headerMap.forEach((title, dataKey) => {
    if (dataKey.indexOf('_NOSORT') !== -1) {
      headersList.push(<th key={dataKey}>{title}</th>);
      return;
    }

    let classNames = 'sort-label', direction = 0;

    // TODO: Is active used?
    if (sortState[0] === dataKey) {
      classNames += ' active';
      direction = sortState[1];
    }

    headersList.push(
      <th className={classNames} key={dataKey} data-sort-type={dataKey} onClick={clickHandler}>
        <span>{title}</span> <SortIndicator direction={direction} />
      </th>
    );
  });

  return <tr>{headersList}</tr>;
};

const renderSchemaLink = function (listing, schema) {
  let linkString;

  if (listing.source === 'pending') {
    linkString = `/pending${makeTitleCase(schema)}/${listing.uuid}`;
  } else if (listing.source === 'live') {
    linkString = `/${schema}/${listing.uuid}`;
  } else {
    linkString = '/404';
  }

  return <Link to={linkString}>{listing.name}</Link>;
};

const uniqueListingsOnly = function (schema, pendingSchema) {
  let uniqueSchema = schema;
  let schemaUUIDs = uniqueSchema.map(x => x.uuid);
  let schemaNames = uniqueSchema.map(x => x.name);

  pendingSchema.forEach(listing => {
    if ((!schemaUUIDs.includes(listing.uuid) && !schemaNames.includes(listing.name))) {
      uniqueSchema.push(listing);
      schemaUUIDs.push(listing.uuid);
      schemaNames.push(listing.name);
    }
  });

  return uniqueSchema;
};

const buildSortQuery = function (sortState) {
  if (sortState[0] === 'name') {
    return {'name': sortState[1]};
  }
  return {[sortState[0]]: sortState[1], 'name': 1};
};

const buildColumnSort = function (clickTarget, sortState) {
  const target = clickTarget.nodeName === 'TH' ? clickTarget : clickTarget.closest('th');
  const column = target.dataset.sortType;
  const direction = column === sortState[0] ? -(parseInt(sortState[1], 10)) : 1;

  return [column, direction];
};

/**
 * From https://gomakethings.com/converting-a-string-to-title-case-with-vanilla-javascript/
 * @param string
 */
const makeTitleCase = function(string) {
  const tmpStr = string.toLocaleLowerCase().split(' ');
  tmpStr.forEach((word, i, arr) => {
    arr[i] = word.charAt(0).toLocaleUpperCase() + word.slice(1);
  });
  return tmpStr.join(' ');
};

export {
  renderOptionList,
  renderCheckboxList,
  renderTableHeader,
  renderSchemaLink,
  uniqueListingsOnly,
  buildSortQuery,
  buildColumnSort,
  makeTitleCase
};
