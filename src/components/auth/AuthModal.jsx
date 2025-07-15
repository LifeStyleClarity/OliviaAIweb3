import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from "@heroui/react";
import PropTypes from "prop-types";
import { useState } from "react";
import { AuthModalType } from "../../api/types/auth.types";
import { toUserFriendlyAddress } from "@tonconnect/ui-react";

const shortenPublicKey = (key) => {
  if (!key) return "";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

function AuthModal({
  isOpen,
  onOpenChange,
  modalType,
  userLogingIn,
  allUsers,
  onConfirm,
  onCancel,
  loading
}) {
  const [selectedWallet, setSelectedWallet] = useState("");

  const getModalTitle = () => {
    switch (modalType) {
      case AuthModalType.WALLET_MISMATCH:
        return "Wallet Mismatch Detected";
      case AuthModalType.MULTIPLE_ACCOUNTS:
      case AuthModalType.AGGREGATE_NEW:
        return "Multiple Accounts Detected";
      case AuthModalType.ADD_WALLET:
        return "Add Wallet";
      default:
        return "";
    }
  };

  const getModalBody = () => {
    switch (modalType) {
      case AuthModalType.WALLET_MISMATCH:
        return (
          <>
            <p>
              {`We already have a user record under your Telegram account with a different wallet: ${shortenPublicKey(
                toUserFriendlyAddress(userLogingIn?.crypto_wallet_address)
              )}`}
            </p>
            <p>Do you want to replace with this wallet you&apos;re trying to login?</p>
          </>
        );
      case AuthModalType.MULTIPLE_ACCOUNTS:
      case AuthModalType.AGGREGATE_NEW:
        return (
          <>
            <p>Multiple accounts are associated with your Telegram.</p>
            <p>
              Do you want to aggregate them all to this wallet? If not click cancel
              and connect the desired wallet
            </p>
            <div className="flex flex-col gap-3 mt-4">
              {allUsers?.map((user) => (
                <label
                  key={user.user_id}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    value={user.crypto_wallet_address || ""}
                    checked={selectedWallet === (user.crypto_wallet_address || "")}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className="form-radio h-4 w-4 text-primary"
                  />
                  <span>
                    {user.crypto_wallet_address
                      ? shortenPublicKey(
                          toUserFriendlyAddress(user.crypto_wallet_address)
                        )
                      : "Telegram User"}
                  </span>
                </label>
              ))}
            </div>
          </>
        );
      case AuthModalType.ADD_WALLET:
        return (
          <>
            <p>
              We already have a user record under your Telegram account from Galaxy
              Blaster but you never connected a wallet
            </p>
            <p>Do you want to add the wallet you&apos;re trying to login to this user?</p>
          </>
        );
      default:
        return null;
    }
  };

  const handleConfirm = () => {
    if (
      (modalType === AuthModalType.MULTIPLE_ACCOUNTS ||
        modalType === AuthModalType.AGGREGATE_NEW) &&
      !selectedWallet
    ) {
      return;
    }
    onConfirm(selectedWallet);
  };

  return (
    <Modal
      hideCloseButton={true}
      isDismissable={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="bg-black"
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {getModalTitle()}
            </ModalHeader>
            <ModalBody>{getModalBody()}</ModalBody>
            <ModalFooter>
              <Button
                className="bg-[#CBFC01] text-black rounded-xl"
                isDisabled={loading}
                onPress={handleConfirm}
              >
                {loading ? <Spinner className="text-black" /> : "Yes"}
              </Button>
              <Button color="danger" onPress={onCancel}>
                No
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  modalType: PropTypes.oneOf(Object.values(AuthModalType)).isRequired,
  userLogingIn: PropTypes.object,
  allUsers: PropTypes.array,
  currentWallet: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default AuthModal;
