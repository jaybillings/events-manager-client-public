import PendingListingsModule from "../PendingListingsModule";

/**
 * The PendingTagsModule component displays pending tags as a module within another page.
 *
 * @class
 * @child
 */
export default class PendingTagsModule extends PendingListingsModule {
  /**
   * The class's constructor.
   *
   * @constructor
   * @param {object} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
