import React, {Component} from 'react';

/**
 * The ShowHideToggle component displays a button to hide or show modules.
 * @class
 */
export default class ShowHideToggle extends Component {
  /**
   * The class's constructor.
   * @constructor
   *
   * @param {{isVisible: Boolean, changeVisibility: Function}} props
   */
  constructor(props) {
    super(props);
  }

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
