/**
 * utilities.js contains methods that perform common operations used in multiple places in the app.
 */
import React from 'react';
import SortIndicator from "./components/common/SortIndicator";
import {Link} from "react-router-dom";

/**
 * Generates a list of <option> elements representing members of given schema.
 *
 * @param {Array} schemaMembers
 * @param {string} keyType - What to use as the key. ID or UUID.
 *
 * @returns {Array}
 */
const renderOptionList = function (schemaMembers, keyType = 'id') {
  let optionsList = [];

  schemaMembers.forEach(record => {
    const optionValue = keyType === 'uuid' ? record.uuid : record.id;
    optionsList.push(<option key={record.id} value={optionValue}>{record.name}</option>);
  });

  return optionsList;
};

/**
 * Generates list elements containing checkbox inputs representing members of a given schema.
 *
 * @param {Array} schemaMembers
 * @param {Array} selectedIds - IDs of the members that should be selected,
 * @param {string} keyType - What to use as the key. ID or UUID.
 * @param {Boolean} disableAll - Whether checkboxes should be disabled (read-only)
 * @returns {*}
 */
const renderCheckboxList = function (schemaMembers, selectedIds, keyType = 'id', disableAll=false) {
  let chkbxList = [];

  schemaMembers.forEach(record => {
    const inputValue = keyType === 'uuid' ? record.uuid : record.id;
    chkbxList.push(
      <li key={record.uuid}>
        <label>
          <input
            type={'checkbox'} className={'js-checkbox'} value={inputValue}
            defaultChecked={selectedIds.includes(inputValue)} disabled={disableAll}
          />
          {record.name}
        </label>
      </li>
    )
  });

  return <ul className={'tags-container'}>{chkbxList}</ul>;
};

/**
 * Generates the header for a schema table.
 *
 * @param {Map} headerMap - A map of header labels and the parameters they represent.
 * @param {Array} sortState - The parameters to sort the table by.
 * @param {Function} clickHandler - The method to run on click.
 *
 * @returns {*}
 */
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

/**
 * Generates link to the listing page for a given schema. What is returned depends on the publish state and whether the
 * listing exists.
 *
 * @param {object} listing
 * @param {string} schema
 *
 * @returns {*}
 */
const renderSchemaLink = function (listing, schema) {
  let linkString;

  if (listing.source === 'pending') {
    linkString = `/pending${schema}/${listing.uuid}`;
  } else if (listing.source === 'live') {
    linkString = `/${schema}/${listing.uuid}`;
  } else {
    linkString = '/404';
  }

  return <Link to={linkString}>{listing.name}</Link>;
};

/**
 * Generates a list of schema members, created from combining live and pending schema members. Only unique members are
 * included, with preference given to live schema members.
 *
 * @param {Array} schemaMembers
 * @param {Array} pendingSchemaMembers
 *
 * @returns {*}
 */
const uniqueListingsOnly = function (schemaMembers, pendingSchemaMembers) {
  let uniqueSchema = schemaMembers;
  let schemaUUIDs = uniqueSchema.map(x => x.uuid);
  let schemaNames = uniqueSchema.map(x => x.name);

  pendingSchemaMembers.forEach(listing => {
    if ((!schemaUUIDs.includes(listing.uuid) && !schemaNames.includes(listing.name))) {
      uniqueSchema.push(listing);
      schemaUUIDs.push(listing.uuid);
      schemaNames.push(listing.name);
    }
  });

  return uniqueSchema;
};

/**
 * Generates the sort portion of a CommonAPI query, for use in complex table sorting.
 *
 * @param {Array} sortState - The parameters to sort the table by.
 * @param {Boolean} secondaryNameSort - Should the table sort secondarily by name?
 *
 * @returns {*}
 */
const buildSortQuery = function (sortState, secondaryNameSort = true) {
  if (sortState[0] === 'name') {
    return {'name': sortState[1]};
  }

  const sortStateObj = {[sortState[0]]: sortState[1]};
  if (secondaryNameSort) sortStateObj.name = 1;

  return sortStateObj;
};

/**
 * Generates a tuple of sort parameter to sort direction, for use in simple table sorting.
 *
 * @param {object} clickTarget
 * @param {Array} sortState - The parameters to sort the table by.
 *
 * @returns {any[]}
 */
const buildColumnSort = function (clickTarget, sortState) {
  const target = clickTarget.nodeName === 'TH' ? clickTarget : clickTarget.closest('th');
  const column = target.dataset.sortType;
  const direction = column === sortState[0] ? -(parseInt(sortState[1], 10)) : 1;

  return [column, direction];
};

/**
 * Makes a word singular by chopping off the last letter.
 * @note This function lazily assumes all plural words end in "s". This works for now, but this method may need
 * to be expanded to accommodate more words.
 *
 * @param string
 *
 * @returns string
 */
const makeSingular = function (string) {
  return string.slice(0, -1);
};

/**
 * Generates an array containing only unique elements of the given array.
 * @note From [MDN Array Reference - Remove duplicate elements from the array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#Remove_duplicate_elements_from_the_array)
 *
 * @param {Array} arr
 * @returns {Array}
 */
const arrayUnique = function (arr) {
  return [...new Set(arr)];
};

/**
 * Displays a list of error messages in a user-friendly way.
 *
 * @param {string} action - The action the user tried to take.
 * @param {string} target - The target of the action.
 * @param {object} errors - The error object returned from the action.
 * @param {Function} displayFunc - The method used to display a message to the user.
 * @param {string} userPrompt - A code for additional prompts to add to the message.
 */
const displayErrorMessages = function (action, target, errors, displayFunc, userPrompt = '') {
  const userPrompts = {
    reload: 'Reload the page to try again.',
    retry: 'Please try again.',
    default: 'If this problem continues, please contact the Helpdesk.'
  };
  const subscript = (userPrompt ? userPrompts[userPrompt] : '') + ' ' + userPrompts.default;

  for (let i = 0; i < errors.length; i++) {
    const subject = errors[i].dataPath.substring(1);
    displayFunc({

      status: 'error',
      details: `Could not ${action} ${target} -- ${subject} ${errors[i].message}. ${subscript}`
    });
  }
};

export {
  renderOptionList,
  renderCheckboxList,
  renderTableHeader,
  renderSchemaLink,
  uniqueListingsOnly,
  buildSortQuery,
  buildColumnSort,
  makeSingular,
  arrayUnique,
  displayErrorMessages
};
