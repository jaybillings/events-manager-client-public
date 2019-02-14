import React, {Component} from 'react';
import app from '../../services/socketio';
import {buildColumnSort, buildSortQuery, renderTableHeader} from '../../utilities';

import PaginationLayout from "../common/PaginationLayout";
import UserRow from "./UserRow";
import AddUserForm from "./AddUserForm";

import '../../styles/schema-module.css';
import '../../styles/schema-table.css';
import '../../styles/manage-users-module.css';

/**
 * ManageUsersModule is a component that displays and allows the admin to manage the console's users.
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
   * Runs after the component mounts. Fetches data.
   * @override
   */
  componentDidMount() {
    this.fetchAllData();
  }

  /**
   * Fetches all data required for the module.
   */
  fetchAllData() {
    this.usersService.find({
      query: {
        $sort: buildSortQuery(this.state.sort, false),
        $limit: this.state.pageSize,
        $skip: this.state.pageSize * (this.state.currentPage - 1)
      }
    }).then(message => {
      this.setState({users: message.data, usersTotal: message.total, usersLoaded: true});
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
      this.setState({usersLoaded: false});
    });
  }

  createUser(userData) {
    return this.usersService.create(userData).then(message => {
      this.props.updateMessagePanel({status: 'success', details: `Added user with email address ${message.email}`});
      this.fetchAllData();
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Saves changes to a given user.
   * @param {int} id
   * @param {object} newData
   */
  saveUser(id, newData) {
    this.usersService.patch(id, newData).then(message => {
      console.log('saveUser', message);
      this.props.updateMessagePanel({status: 'success', details: `Saved changes to ${message.email}`});
      this.fetchAllData();
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Permanently removes a given user from the database.
   * @param {int} userId
   */
  deleteUser(userId) {
    this.usersService.remove(userId.id).then(() => {
      this.props.updateMessagePanel({status: 'success', details: `${userId.email} has been permanently removed.`});
      this.fetchAllData();
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the component's page size and respective data.
   * @param {Event} e
   */
  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * Updates the component's current page and respective data.
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * Updates the component's column sorting and respective data.
   * @param {Event} e
   */
  updateColumnSort(e) {
    const colSortState = buildColumnSort(e.target, this.state.sort);
    this.setState({sort: colSortState}, () => this.fetchAllData());
  }

  /**
   * Renders the module's table.
   * @returns {[*]}
   */
  renderTable() {
    if (!this.state.usersLoaded) return <p>Data is loading... Please be patient...</p>;

    const titleMap = new Map([
      ['actions_NOSORT', 'Actions'],
      ['email', 'Email Address'],
      ['permissions', 'Permissions']
    ]);

    return ([
      <PaginationLayout
        key={'users-pagination'} schema={'users'} total={this.state.usersTotal}
        pageSize={this.state.pageSize} activePage={this.state.currentPage}
        updatePageSize={this.updatePageSize} updateCurrentPage={this.updateCurrentPage}
      />,
      <table key={'users-table'} className={'schema-table'}>
        <thead>{renderTableHeader(titleMap, this.state.sort, this.updateColumnSort)}</thead>
        <tbody>
        {
          this.state.users.map(user => {
            return (
              <UserRow key={user.id} user={user} saveUser={this.saveUser} deleteUser={this.deleteUser} />
            );
          })
        }
        </tbody>
      </table>
    ]);
  }

  renderAddForm() {
    return ([
      <h4 key={'add-form-header'}>Add New User</h4>,
      <AddUserForm key={'add-form'} createUser={this.createUser} />
    ])
  }

  /**
   * Renders the component.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    return (
      <div className={'schema-module manage-users'}>
        <h3>Manage Users</h3>
        {this.renderTable()}
        {this.renderAddForm()}
      </div>
    );
  }
};
