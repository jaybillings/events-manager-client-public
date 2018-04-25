import React from 'react';

const renderOptionList = function (schema) {
  let optionsList = [];

  schema.forEach(record => {
    optionsList.push(<option key={record.id} value={record.id}>{record.name}</option>);
  });

  return optionsList;

};

export {renderOptionList};
