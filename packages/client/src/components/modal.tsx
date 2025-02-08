import { styled } from "@linaria/react";
import ReactModal from "react-modal";
import { IoCloseSharp } from "react-icons/io5";

export type ModalProps = {
  children: React.ReactNode;
  onClose?: () => void;
  easyClose: boolean;
};

export const Modal = ({ children, onClose, easyClose }: ModalProps) => {
  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#1a1a1a",
    },
    overlay: {
      backgroundColor: "transparent",
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
