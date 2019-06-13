import SingleListingLayout from "../../components/SingleListingLayout";

/**
 * `SingleTagLayout` lays out a single tag page.
 * @class
 * @child
 */
export default class SingleTagLayout extends SingleListingLayout {
  constructor(props) {
    super(props, 'tags');
  }
};
