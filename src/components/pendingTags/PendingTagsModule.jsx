import PendingListingsModule from "../PendingListingsModule";

/**
 * `PendingTagsModule` renders the pending tags data table within a module.
 *
 * @class
 * @child
 * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
 */
export default class PendingTagsModule extends PendingListingsModule {
  constructor(props) {
    super(props, 'tags');
  }
};
