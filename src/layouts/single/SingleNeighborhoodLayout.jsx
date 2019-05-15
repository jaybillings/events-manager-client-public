import SingleListingLayout from "../../components/SingleListingLayout";

/**
 * SingleNeighborhoodLayout is a component which lays a single neighborhood listing page.
 */
export default class SingleNeighborhoodLayout extends SingleListingLayout {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'neighborhoods');
  }
};
