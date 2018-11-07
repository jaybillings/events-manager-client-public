import PendingListingsModule from "../common/PendingListingsModule";

export default class PendingOrganizersModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'organizers');
  }
};
