import React from 'react';

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

export {renderOptionList, renderCheckboxList, buildSortQuery, buildColumnSort};
