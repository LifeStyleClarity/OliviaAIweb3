// src/components/ui/ConnectWalletModal.jsx
import React from "react";
import PropTypes from "prop-types";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { useTonConnectModal } from "@tonconnect/ui-react";

function ConnectWalletModalComponent({ isOpen, onClose }) {
    const { open } = useTonConnectModal(); // Opens the TonConnect modal

    const targetRef = React.useRef(null);
    // const { moveProps } = useDraggable({
    //     targetRef,
    //     canOverflow: true,
    //     isDisabled: !isOpen,
    // });
    const { moveProps } = ({
        targetRef,
        canOverflow: true,
        isDisabled: !isOpen,
    });

    return (
        <Modal className="bg-[#0c0c0c] py-2 border-1 border-solid border-[#31F46E]" ref={targetRef} isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader {...moveProps} className="flex flex-col gap-1 text-white">
                            Connect Your Wallet
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-white">Please connect your wallet to access the app features.</p>
                            <Button
                                className="connect-wallet text-black rounded-xl"
                                onPress={open} // Open TonConnect modal
                            >
                                Connect Wallet
                            </Button>
                        </ModalBody>
                        <ModalFooter>
                            {/* <Button color="danger" variant="light" onPress={close}>
                                Cancel
                            </Button> */}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

ConnectWalletModalComponent.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default ConnectWalletModalComponent;
