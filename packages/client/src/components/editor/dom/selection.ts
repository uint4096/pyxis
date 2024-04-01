import { getRelativeElementPosition } from "./element-position";

export const getSelection = (element: Node) => {
  const selection = window.getSelection();
  if (!selection || !selection.anchorNode || !selection.focusNode) {
    throw new Error("Unable to get selection!");
  }

  const anchor = getRelativeElementPosition(element, selection.anchorNode);
  const focus = getRelativeElementPosition(element, selection.focusNode);

  return {
    anchor: { node: anchor, offset: selection.anchorOffset },
    focus: { node: focus, offset: selection.focusOffset },
    collapsed: selection.isCollapsed,
  };
};
