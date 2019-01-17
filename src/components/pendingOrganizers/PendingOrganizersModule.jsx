import PendingListingsModule from "../PendingListingsModule";

/**
 * PendingOrganizersModule is a component which displays pending organizers as a module within a layout.
 * @class
 * @child
 */
export default class PendingOrganizersModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'organizers');
  }
};
