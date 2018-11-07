import PendingListingsModule from "../generic/PendingListingsModule";

export default class PendingOrganizersModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'organizers');
  }
};
