import PendingListingsModule from "../PendingListingsModule";

export default class PendingOrganizersModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'organizers');
  }
};
