import "./modal.css";

export type ModalSize = "small" | "medium" | "large";
export type ModalProps = {
  header?: JSX.Element;
  body: JSX.Element;
  footer?: JSX.Element;
  size?: ModalSize;
  onClose?: () => void;
};

export const Modal = ({
  body,
  footer,
  header,
  size,
  onClose,
}: ModalProps) => {

  return (
      <>
        <div className="modal-overlay" />
        <div className={`modal-${size} modal-container`}>
          {
            <div className="modal-header">
              {header ?? <></>}
              {onClose && (
                <div className="modal-close-btn">
                  <button onClick={onClose}>x</button>
                </div>
              )}
            </div>
          }
          <div className="modal-body">{body}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </>
  );
};
