import PendingListingsModule from "../PendingListingsModule";

/**
 * PendingNeighborhoodsModule is a component which displays pending neighborhoods as a module within a layout.
 * @class
 * @child
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
