import React, {Component} from 'react';
import app from '../../services/socketio';
import {buildColumnSort, buildSortQuery, renderTableHeader} from '../../utilities';

import '../../styles/schema-module.css';
import '../../styles/schema-table.css';
import PaginationLayout from "../common/PaginationLayout";

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
    this.handleDeleteUser = this.handleDeleteUser.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updatePageSize = this.updatePageSize.bind(this);
    this.updateCurrentPage = this.updateCurrentPage.bind(this);
    this.updateColumnSort = this.updateColumnSort.bind(this);
    this.renderTable = this.renderTable.bind(this);
  }

  /**
   * Runs after the component mounts. Fetches data.
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

  handleDeleteUser(user) {
    // TODO: Add a confirm requirement
    this.usersService.remove(user.id).then(() => {
      this.props.updateMessagePanel({status: 'success', details: `${user.email} has been permanently removed.`})
    }, err => {
      this.props.updateMessagePanel({status: 'error', details: JSON.stringify(err)});
    });
  }

  /**
   * Updates the component's page size, then fetches new listings.
   * @param {Event} e
   */
  updatePageSize(e) {
    this.setState({pageSize: parseInt(e.target.value, 10), currentPage: 1}, () => this.fetchAllData());
  }

  /**
   * Updates the component's current page, then fetches new listings.
   * @param {string} page
   */
  updateCurrentPage(page) {
    this.setState({currentPage: parseInt(page, 10)}, () => this.fetchAllData());
  }

  /**
   * Updates the component's column sorting, then fetches new listings.
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

    // TODO: Make user row own componenet
    
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
              <tr className={'schema-row'} key={user.id}>
                <td><button type={'button'} className={'delete'} onClick={this.handleDeleteUser}>Delete</button></td>
                <td>{user.email}</td>
                <td><select name={'userPermissions'} value={user.permissions} onChange={this.handleInputChange}>{renderOptionList(this.state.users)}</select></td>
              </tr>
            );
          })
        }
        </tbody>
      </table>
    ]);
  }

  /**
   * Renders the component.
   * @override
   * @render
   * @returns {*}
   */
  render() {
    return (
      <div className={'schema-module'}>
        <h3>Manage Users</h3>
        {this.renderTable()}
      </div>
    );
  }
};
