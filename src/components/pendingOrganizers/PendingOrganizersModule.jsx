import PendingListingsModule from "../PendingListingsModule";

/**
 * The PendingOrganizersModule component displays pending organizers as a module within another page.
 * @class
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
