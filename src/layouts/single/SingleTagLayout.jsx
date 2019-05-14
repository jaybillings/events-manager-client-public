import SingleListingLayout from "../../components/SingleListingLayout";

/**
 * SingleTagLayout is a component which lays out a single tag page.
 * @class
 * @child
 */
export default class SingleTagLayout extends SingleListingLayout {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
