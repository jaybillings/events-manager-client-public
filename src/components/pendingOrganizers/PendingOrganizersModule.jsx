import PendingListingsModule from "../PendingListingsModule";

/**
 * `PendingOrganizersModule` renders the pending organizers data table as a module.
 * @class
 * @child
 * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
 */
export default class PendingOrganizersModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'organizers');
  }
};
