import PendingListingsModule from "../PendingListingsModule";

/**
 * PendingTagsModule is a component that displays pending tags as a module within a layout.
 * @class
 * @child
 */
export default class PendingTagsModule extends PendingListingsModule {
  /**
   * The class's constructor.
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
