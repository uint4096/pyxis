import { styled } from "@linaria/react";

export type ModalSize = "small" | "medium" | "large";
export type ModalProps = {
  header?: JSX.Element;
  body: JSX.Element;
  footer?: JSX.Element;
  size?: ModalSize;
  onClose?: () => void;
};

//@todo: supposed to accept children instead of having so many different elements

export const Modal = ({ body, footer, header, size, onClose }: ModalProps) => {
  return (
    <>
      <ModalOverlay />
      <ModalContainer size={size ?? "medium"}>
        {
          <ModalHeader>
            {header ?? <></>}
            {onClose && (
              <ModalCloseButton>
                <button onClick={onClose}>x</button>
              </ModalCloseButton>
            )}
          </ModalHeader>
        }
        <ModalBody>{body}</ModalBody>
        {footer && <div>{footer}</div>}
      </ModalContainer>
    </>
  );
};

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 999;
`;

const ModalContainer = styled.div<{ size: ModalSize }>`
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  border: 1px solid grey;
  box-shadow: 5px 5px 5px black;
  justify-content: flex-end;
  position: absolute;
  top: 35%;
  left: 10%;
  gap: 1em;
  background-color: rgb(17, 19, 25);
  z-index: 1000;
  padding: 0.5vh 0.5vw 2vh 0.5vw;
  width: ${(props) =>
    ({ small: "20vw", medium: "30vw", large: "40vw" })[props.size]};
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: auto;
  margin-top: 0;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
`;

const ModalCloseButton = styled.div`
  margin-left: auto;
  margin-right: 0;
`;
