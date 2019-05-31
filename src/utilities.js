/**
 * utilities.js contains methods that perform common operations used in multiple places in the app.
 */
import React from 'react';
import SortIndicator from "./components/common/SortIndicator";
import {Link} from "react-router-dom";

/**
 * Generates a list of <option> elements representing members of given schema.
 *
 * @param {Array} schemaData
 * @param {string} schema
 * @param {string} keyType
 * @returns {Array}
 */
const renderOptionList = function (schemaData, schema, keyType='uuid') {
  let optionsList = [];
  let schemaSingular = makeSingular(schema);
  let recordsToDisplay = [{uuid: '', id: '', name: `NO ${schemaSingular.toUpperCase()} SELECTED`}, ...schemaData];

  recordsToDisplay.forEach(record => {
    const optionValue = keyType === 'name' ? record.name : record.uuid;
    const optionKey = optionValue ? `${record.fromPending ? 'pending-' : ''}${optionValue}` : `default-${schemaSingular}`;
    const optionLabel = record.fromPending ? `${record.name} [PENDING]` : record.name;

    optionsList.push(<option key={optionKey} value={optionValue}>{optionLabel}</option>);
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
 * @param {string} baseSchema
 *
 * @returns {*}
 */
const renderSchemaLink = function (listing, baseSchema) {
  const schemaPath = listing.fromPending ? `pending${baseSchema}` : baseSchema;
  const linkText = listing.fromPending ? `${listing.name} [Pending]` : listing.name;

  return <Link to={`/${schemaPath}/${listing.id}`}>{linkText}</Link>;
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
  let uniqueSchema = [...schemaMembers];
  let schemaUUIDs = uniqueSchema.map(x => x.uuid);

  pendingSchemaMembers.forEach(listing => {
    if (!schemaUUIDs.includes(listing.uuid)) {
      uniqueSchema.push({...listing, fromPending: true});
      schemaUUIDs.push(listing.uuid);
    }
  });

  // Sort alphabetically by name
  uniqueSchema.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
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
 * @param {string} userPrompt - A label for additional prompts to add to the message.
 *  Non-false values or the value 'default' will include the default prompt.
 */
const displayErrorMessages = function (action, target, errors, displayFunc, userPrompt = '') {
  const userPrompts = {
    reload: 'Reload the page to try again.',
    retry: 'Please try again.',
    default: <span>If this problem continues, please <a href={"mailto:" + process.env.REACT_APP_HELP_ADDRESS}>contact the Helpdesk</a>.</span>
  };

  if (!Array.isArray(errors)) errors = [errors];

  for (let i = 0; i < errors.length; i++) {
    const subject = errors[i].dataPath ? errors[i].dataPath.substring(1) : '';
    const messages = [];

    messages.push(<span key={'msg0'}>Could not {action} {target} -- {subject} {errors[i].message}.</span>);

    if (userPrompt === 'default') {
      messages.push(<span key={'msg1'}>{userPrompts.default}</span>);
    } else if (userPrompts[userPrompt]) {
      messages.push(<span key={'msg1'}>{userPrompts[userPrompt]}</span>);
      messages.push(<span key={'msg2'}>{userPrompts.default}</span>);
    }

    displayFunc({
      status: 'error',
      details: messages
    });
  }
};

const diffListings = function(listingA, listingB, parameters) {
  // noinspection JSUnresolvedFunction
  const jsdiff = require('diff');
  const defaultClassName = ' highlight-diff';
  const classNameMap = {};

  if (!listingA || !listingB) return {};

  for (let param of parameters) {
    const valueA = listingA[param];
    const valueB = listingB[param];

    if (!valueA && !valueB) classNameMap[param] = '';
    else if (!valueA || !valueB) classNameMap[param] = defaultClassName;
    else {
      const diff = jsdiff.diffWordsWithSpace(valueA.toString(), valueB.toString());
      classNameMap[param] = diff.length > 1 ? ' highlight-diff' : '';
    }
  }

  return classNameMap;
};

const printToConsole = function(messageObj, type='error') {
  if (JSON.stringify(messageObj) && console[type]) console[type](messageObj);
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
  displayErrorMessages,
  diffListings,
  printToConsole
};
