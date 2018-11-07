import React, {Component} from 'react';

export default class PendingListingRow extends Component {
  constructor(props) {
    super(props);

    this.state = {editable: false, is_new: true, is_dup: false};

    this.nameInput = React.createRef();

    this.startEdit = this.startEdit.bind(this);
    this.cancelEdit = this.cancelEdit.bind(this);
    this.checkIfDup = this.checkIfDup.bind(this);
    this.checkIfNew = this.checkIfNew.bind(this);
    this.handleDeleteClick = this.handleDeleteClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
  }

  componentDidMount() {
    this.checkIfDup();
    this.checkIfNew();
  }

  startEdit() {
    this.setState({editable: true});
  }

  cancelEdit() {
    this.setState({editable: false});
  }

  handleDeleteClick() {
    this.props.discardListing(this.props.pendingListing.id);
  }

  handleSaveClick() {
    const newData = { name: this.nameInput.current.value.trim() };

    this.props.saveChanges(this.props.pendingListing.id, newData);
    this.setState({editable: false});
  }

  checkIfDup() {
    // TODO: Attach to event editing
    // TODO: Attach to data for filtering/paging
    this.props.listingIsDup(this.props.pendingListing).then(message => {
      this.setState({is_dup: message.total && message.total > 0});
    }, err => console.log('error in checkIfDup()', err));
  }

  checkIfNew() {
    this.setState({is_new: !this.props.pendingListing.target_id});
  }

  render() {
    return <div></div>
  }
};
