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
   *
   * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
   */
  constructor(props) {
    super(props, 'neighborhoods');
  }
};
