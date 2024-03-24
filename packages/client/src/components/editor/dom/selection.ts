import { getRelativeElementPosition } from "./element-position";

export const getSelection = (element: Node) => {
  const selection = window.getSelection();
  /*
   * isCollapsed because a proper selection is not yet supported.
   * @Todo ^
   */
  if (selection && selection.isCollapsed && selection.anchorNode) {
    const position = getRelativeElementPosition(
      element,
      selection?.anchorNode
    );

    return { node: position, offset: selection.anchorOffset };
  }
};
