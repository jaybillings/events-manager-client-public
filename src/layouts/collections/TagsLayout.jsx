import ListingsLayout from "../../components/ListingsLayout";

/**
 * TagsLayout is a component which lays out the tag collection page.
 * @class
 * @child
 */
export default class TagsLayout extends ListingsLayout {
  /**
   * The class's constructor.
   * @param {object} props
   */
  constructor(props) {
    super(props, 'tags');
  }
};
