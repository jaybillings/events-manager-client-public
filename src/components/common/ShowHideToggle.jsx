import React, {Component} from 'react';

export default class ShowHideToggle extends Component {
  render() {
    const isVisible = this.props.isVisible;
    const buttonText = isVisible ? 'Hide' : 'Show';
    const visibilityClass = isVisible ? ' is-visible' : ' is-hidden';

    return (
      <button type={'button'} className={`visibility-toggle${visibilityClass}`} onClick={this.props.changeVisibility}>
        {buttonText}
      </button>
    );
  }
};
