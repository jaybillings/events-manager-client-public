import PendingListingsModule from "../PendingListingsModule";

/**
 * PendingTagsModule is a component that displays pending tags as a module within a layout.
 * @class
 * @child
 */
export default class PendingTagsModule extends PendingListingsModule {
  /**
   * The component's constructor.
   *
   * @param {{defaultPageSize: Number, defaultSortOrder: Object, updateMessagePanel: Function}} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
