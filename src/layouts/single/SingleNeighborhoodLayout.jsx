import SingleListingLayoutUniversal from "../../components/SingleListingLayoutUniversal";

/**
 * SingleNeighborhoodLayout is a component which lays a single neighborhood listing page.
 */
export default class SingleNeighborhoodLayout extends SingleListingLayoutUniversal {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'neighborhoods');
  }
};
