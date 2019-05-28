import React, {Component} from 'react';
import Header from "../components/common/Header";

export default class EmailVerification extends Component {
  constructor(props) {
    super(props);

    this.authManagementUrl = 'http://localhost:3030/authmanagement/';

    this.state = {verifySuccess: null};

    this.sendValidation = this.sendValidation.bind(this);
  }

  componentDidMount() {
    this.sendValidation();
  }

  sendValidation() {
    // TODO: Replace with config
    const token = this.props.match.params.token;
    const payload = {
      action: 'verifySignupLong',
      value: token
    };

    console.debug(token);
    console.debug(JSON.stringify(payload));
    console.debug(payload);

    fetch(this.authManagementUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {'Content-Type': 'application/json'}
    })
      .then(response => {
        return response.json(); // convert raw response body to JSON
      })
      .then(body => {
        if (body.code >= 400) {
          console.error(body.message);
          this.setState({verifySuccess: false});
        } else {
          console.debug('success!');
          this.setState({verifySuccess: true});
        }
      });
  }

  renderVerificationMessage() {
    if (this.state.verifySuccess === null) return <p className={'single-message info'}>Verifying your token...</p>;
    else if (this.state.verifySuccess) return <p className={'single-message success'}>Congratulations! You have been verified! Click the login button above to log in to your account.</p>;
    else return <p className={'single-message error'}>Error: Verification failed. Please contact the HelpDesk for support.</p>
  }

  render() {
    return (
      <div className={'container'}>
        <Header />
        <h2>Email Verification</h2>
        {this.renderVerificationMessage()}
      </div>
    )
  }
};
