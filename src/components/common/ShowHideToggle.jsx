import React, {Component} from 'react';

export default class ShowHideToggle extends Component {
  render() {
    const buttonText = this.props.isVisible ? 'Hide' : 'Show';
    const visibilityClass = this.props.isVisible ? ' is-visible' : ' is-hidden';

    return (
      <button type={'button'} className={`visibility-toggle${visibilityClass}`} onClick={this.props.changeVisibility}>
        {buttonText}
      </button>
    );
  }
};
