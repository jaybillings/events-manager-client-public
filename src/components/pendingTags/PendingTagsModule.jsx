import PendingListingsModule from "../generic/PendingListingsModule";

export default class PendingTagsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'tags');
  }
};
