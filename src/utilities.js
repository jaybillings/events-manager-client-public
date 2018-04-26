import React from 'react';

const renderOptionList = function (schema) {
  let optionsList = [];

  schema.forEach(record => {
    optionsList.push(<option key={record.id} value={record.id}>{record.name}</option>);
  });

  return optionsList;

};

const friendlyDate = function (timestamp) {
  const dateFormatOptions = {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric"
  };

  return new Date(timestamp).toLocaleString('en-US', dateFormatOptions);
};

export {renderOptionList, friendlyDate};
