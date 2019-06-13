import PendingListingsModule from "../PendingListingsModule";

/**
 * `PendingNeighborhoodsModule` renders the pending neighborhoods data table as a module.
 *
 * @class
 * @child
 * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
 */
export default class PendingNeighborhoodsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'neighborhoods');
  }
};
