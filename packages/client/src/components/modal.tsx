import { styled } from "@linaria/react";
import ReactModal from "react-modal";
import { IoCloseSharp } from "react-icons/io5";

export type ModalProps = {
  children: React.ReactNode;
  onClose?: () => void;
  easyClose: boolean;
};

ReactModal.setAppElement("#root");

export const Modal = ({ children, onClose, easyClose }: ModalProps) => {
  const customStyles = {
    content: {
      margin: "auto",
      backgroundColor: "#000",
      border: "1px solid #8f94f3",
      maxWidth: "fit-content",
      maxHeight: "fit-content",
      borderRadius: "5px",
    },
    overlay: {
      backgroundColor: "rgba(32, 32, 32, 0.4)",
    },
  };

  return (
    <ReactModal
      onRequestClose={onClose}
      isOpen
      shouldCloseOnEsc={easyClose}
      shouldCloseOnOverlayClick={easyClose}
      style={customStyles}
    >
      {easyClose && (
        <CloseButton onClick={onClose}>
          <IoCloseSharp size={24} id={"icon"} />
        </CloseButton>
      )}
      {children}
    </ReactModal>
  );
};

const CloseButton = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  padding: 1vh 0.5vw;
  cursor: pointer;

  &:hover #icon {
    color: #c6011f;
  }
`;
