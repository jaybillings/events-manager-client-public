import React from 'react';
import SortIndicator from "./components/common/SortIndicator";

const renderOptionList = function (schema) {
  let optionsList = [];

  schema.forEach(record => {
    optionsList.push(<option key={record.id} value={record.id}>{record.name}</option>);
  });

  return optionsList;

};

const renderCheckboxList = function (schema, selectedIds) {
  let chkbxList = [];

  schema.forEach(record => {
    chkbxList.push(
      <label key={record.id}>
        <input type={'checkbox'} className={'js-checkbox'} value={record.id}
               defaultChecked={selectedIds.includes(record.id)} />
        {record.name}
      </label>
    );
  });

  return chkbxList;
};

const renderTableHeader = function(headerMap, sortState, clickHandler) {
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

const buildSortQuery = function (sortState) {
  if (sortState[0] === 'name') return {'name': sortState[1]};

  return {[sortState[0]]: sortState[1], 'name': 1};
};

const buildColumnSort = function(clickTarget, sortState) {
  const target = clickTarget.nodeName === 'TH' ? clickTarget : clickTarget.closest('th');
  const column = target.dataset.sortType;
  const direction = column === sortState[0] ? -(parseInt(sortState[1], 10)) : -1;

  return {sort: [column, direction]};
};

export {renderOptionList, renderCheckboxList, renderTableHeader, buildSortQuery, buildColumnSort};
