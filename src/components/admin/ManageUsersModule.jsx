import React, {Component} from 'react';
import app from '../../services/socketio';
import {
  buildColumnSort,
  buildSortQuery,
  displayErrorMessages,
  printToConsole,
  renderTableHeader
} from '../../utilities';

import PaginationLayout from "../common/PaginationLayout";
import UserRow from "./UserRow";
import AddUserForm from "./AddUserForm";

/**
 * `ManageUsersModule` displays a module for adding and editing users.
 *
 * @class
 * @parent
 */
export default class ManageUsersModule extends Component {
  constructor(props) {
    super(props);

    this.defaultSort = ['email', 1];
    this.defaultPageSize = 25;

    this.state = {
      users: [], usersTotal: 0, usersLoaded: false,
      sort: this.defaultSort, currentPage: 1, pageSize: this.defaultPageSize
    };

    this.usersService = app.service('users');

    this.fetchAllData = this.fetchAllData.bind(this);

    this.createUser = this.createUser.bind(this);
    this.saveUser = this.saveUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);

    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);

    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Runs once the component is mounted.
   *
   * During `componentDidMount`, the component fetches all data and registers data service listeners.
   *
   * @override
   */
  componentDidMount() {
    this.fetchAllData();

    this.usersService
      .on('created', message => {
        this.props.updateMessagePanel({status: 'success', details: `Added user with email address "${message.email}"`});
        this.fetchAllData();
      })
      .on('updated', message => {
        this.props.updateMessagePanel({status: 'success', details: `Saved changes to "${message.email}"`});
        this.fetchAllData();
      })
      .on('patched', message => {
        this.props.updateMessagePanel({status: 'success', details: `Saved changes to "${message.email}"`});
        this.fetchAllData();
      })
      .on('removed', message => {
        this.props.updateMessagePanel({status: 'info', details: `"${message.email}" has been permanently removed.`});
        this.fetchAllData();
      })
  }

  /**
   * Runs before the component is unmounted.
   *
   * During `componentWillUnmount`, the component unregisters data service
   * listeners.
   *
   * @override
   */
  componentWillUnmount() {
    this.usersService
      .removeAllListeners('created')
      .removeAllListeners('updated')
      .removeAllListeners('patched')
      .removeAllListeners('removed');
  }

  /**
   * `fetchAllData` fetches data required by the module.
   */
  fetchAllData() {
    const query = {
      $sort: buildSortQuery(this.state.sort, false),
      $limit: this.state.pageSize,
      $skip: this.state.pageSize * (this.state.currentPage - 1)
    };

    this.usersService.find({query})
      .then(message => {
        this.setState({users: message.data, usersTotal: message.total, usersLoaded: true});
      })
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('fetch', 'user data', err, this.props.updateMessagePanel, 'reload');
        this.setState({usersLoaded: false});
      });
  }

  /**
   * `createUser` runs on button click and creates a new user.
   *
   * @async
   * @param userData
   * @returns {Promise<*>}
   */
  createUser(userData) {
    return this.usersService.create(userData);
  }

  /**
   * `saveUser` saves changes to a given user.
   *
   * @param {int} id
   * @param {object} newData
   */
  saveUser(id, newData) {
    this.usersService.patch(id, newData)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('create', 'new user', err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `deleteUser` permanently removes a given user from the database.
   *
   * @param {int} userId
   */
  deleteUser(userId) {
    this.usersService.remove(userId)
      .catch(err => {
        printToConsole(err);
        displayErrorMessages('delete', `user with id ${userId}`, err, this.props.updateMessagePanel, 'retry');
      });
  }

  /**
   * `updatePageSize` updates the component's page size, then fetches new listings.
   *
   * @param pageSize
   */
  updatePageSize(pageSize) {
    this.setState({pageSize: parseInt(pageSize, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * `updateCurrentPage` updates the data table's current page, then fetches new listings.
   *
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * `updateColumnSort` updates the data table's column sorting, then fetches new listings.
   *
   * @param {Event} e
   */
  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchAllData());
  }

  /**
   * Renders the module's table.
   *
   * @returns {*[]|*}
   */
  renderTable() {
    if (!this.state.usersLoaded) return <div className={'message-compact single-message info'}>Data is loading... Please be patient...</div>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['email', 'Email Address'],
      ['api_key_NOSORT', 'API Key'],
      ['permissions', 'Permissions']
    ]);

    return ([
      <PaginationLayout
        key={'users-pagination'} schema={'users'} total={this.state.usersTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage} includeAll={true}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <table key={'users-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.users.map(user => {
            return <UserRow
              key={user.id} user={user} saveUser={this.saveUser} deleteUser={this.deleteUser}
            />;
          })
        }
        </tbody>
      </table>
    ]);
  }

  /**
   * `renderAddForm` renders the form for adding a new user.
   *
   * @returns {*[]}
   */
  renderAddForm() {
    return ([
      <h4 key={'add-form-header'}>Add New User</h4>,
      <AddUserForm key={'add-form'} createUser={this.createUser} />
    ])
  }

  /**
   * Renders the component.
   *
   * @override
   * @render
   * @returns {*}
   */
  render() {
    return (
      <div className={'schema-module admin-module'}>
        <h3>Manage Users</h3>
        {this.renderTable()}
        {this.renderAddForm()}
      </div>
    );
  }
};
