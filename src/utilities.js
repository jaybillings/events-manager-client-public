import React from 'react';

const renderOptionList = function (schema) {
  let optionsList = [];

  schema.forEach(record => {
    optionsList.push(<option key={record.id} value={record.id}>{record.name}</option>);
  });

  return optionsList;

};

const renderCheckboxList = function(schema, selectedIds) {
  let chkbxList = [];

  schema.forEach(record => {
    chkbxList.push(
      <label key={record.id}>
        <input type={'checkbox'} className={'js-checkbox'} value={record.id} defaultChecked={selectedIds.includes(record.id)} />
        {record.name}
      </label>
    );
  });

  return chkbxList;
};

export {renderOptionList, renderCheckboxList};
