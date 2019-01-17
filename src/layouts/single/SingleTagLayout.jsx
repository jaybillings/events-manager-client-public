import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SingleTagLayout is a component which lays out a single tag page.
 * @class
 * @child
 */
export default class SingleTagLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
