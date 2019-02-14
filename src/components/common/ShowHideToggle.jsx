import React, {Component} from 'react';

/**
 * The ShowHideToggle component displays a button to hide or show modules.
 * @class
 *
 * @param {{isVisible: Boolean, changeVisibility: Function}} props
 */
export default class ShowHideToggle extends Component {
  /**
   * Renders the component.
   * @render
   * @override
   *
   * @returns {*}
   */
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
