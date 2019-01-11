import PendingListingsModule from "../PendingListingsModule";

/**
 * The PendingNeighborhoodsModule component displays pending neighborhoods as a module within another page.
 * @class
 */
export default class PendingNeighborhoodsModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'neighborhoods');
  }
};
