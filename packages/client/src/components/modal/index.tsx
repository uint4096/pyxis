import { useState } from "react";
import './modal.css';

export type ModalSize = "small" | "medium" | "large";
export type ModalProps = {
  header?: JSX.Element;
  body: JSX.Element;
  footer?: JSX.Element;
  size?: ModalSize;
  visible?: boolean;
  allowClosing?: boolean;
};

export const Modal = ({ body, footer, header, size, visible, allowClosing }: ModalProps) => {
  const [showModal, setShowModal] = useState(visible ?? false);

  return (showModal &&
    <>
      <div className="modal-overlay" />
      <div className={`modal-${size} modal-container`}>
        {
          <div className="modal-header">
            {header ?? <></>}
            {allowClosing && <div className="modal-close-btn">
              <button onClick={() => setShowModal(false)}>x</button>
            </div>}
          </div>
        }
        <div className="modal-body">{body}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </>
  );
};
