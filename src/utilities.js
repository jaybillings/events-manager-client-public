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
      <li key={record.id}>
        <label>
          <input type={'checkbox'} className={'js-checkbox'} value={record.id}
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

const renderUpdateStatus = function (isDup, isNew, schema) {
  if (isDup) {
    return <span className={'alert-dup'} key={`${schema}-is-dup`}>Duplicate</span>;
  } else if (isNew) {
    return <span className={'muted'} key={`${schema}-is-new`}>New</span>;
  }
  return <span className={'alert-change'} key={`${schema}-is-updated`}>Update</span>;
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
  renderUpdateStatus,
  buildSortQuery,
  buildColumnSort,
  makeTitleCase
};
