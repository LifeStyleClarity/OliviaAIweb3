import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@heroui/react';
import PropTypes from 'prop-types';

import { MODAL_MESSAGES } from '../../auth/constants';

AuthModals.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  modalType: PropTypes.string,
  userLoggingIn: PropTypes.shape({
    crypto_wallet_address: PropTypes.string
  }),
  allUserLogins: PropTypes.array,
  wallet: PropTypes.shape({
    account: PropTypes.shape({
      address: PropTypes.string
    })
  }),
  setWalletSelected: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  shortenPublicKey: PropTypes.func.isRequired,
  convertAddress: PropTypes.func.isRequired
};

export default function AuthModals({
  isOpen,
  onOpenChange,
  modalType,
  userLoggingIn,
  allUserLogins,
  wallet,
  setWalletSelected,
  loading,
  onConfirm,
  onCancel,
  shortenPublicKey,
  convertAddress
}) {
  // console.log('🎭 AuthModals rendered with props:', {
  //   isOpen,
  //   modalType,
  //   hasUserLoggingIn: !!userLoggingIn,
  //   userWallet: userLoggingIn?.crypto_wallet_address,
  //   hasAllUserLogins: !!allUserLogins?.length,
  //   connectedWallet: wallet?.account?.address,
  //   loading
  // });

  const getModalContent = () => {
    switch (modalType) {
      case "1": // WALLET_MISMATCH
        return {
          title: MODAL_MESSAGES.WALLET_MISMATCH.title,
          body: (
            <>
              <p>
                {`We already have a user record under your Telegram account with a different wallet: ${shortenPublicKey(
                  convertAddress(userLoggingIn?.crypto_wallet_address)
                )}`}
              </p>
              <p>Do you want to replace with this wallet you&apos;re trying to login?</p>
            </>
          ),
          actions: (
            <>
              <Button
                className="bg-[#CBFC01] text-black rounded-xl"
                isDisabled={loading}
                onPress={onConfirm}
              >
                {loading ? <Spinner className="text-black" /> : "Yes"}
              </Button>
              <Button color="danger" onPress={onCancel}>
                No
              </Button>
            </>
          )
        };

      case "2": // MULTIPLE_ACCOUNTS
        return {
          title: MODAL_MESSAGES.MULTIPLE_ACCOUNTS.title,
          body: (
            <>
              <p>Multiple accounts are associated with your Telegram.</p>
              <p>
                Do you want to aggregate them all to this wallet? If not click cancel and connect the desired wallet
              </p>
              {wallet && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Wallet: {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</p>
                </div>
              )}
            </>
          ),
          actions: (
            <>
              <Button
                className="bg-[#CBFC01] text-black rounded-xl"
                isDisabled={loading}
                onPress={onConfirm}
              >
                {loading ? <Spinner className="text-black" /> : "Aggregate"}
              </Button>
              <Button color="danger" onPress={onCancel}>
                Cancel
              </Button>
            </>
          )
        };

      case "3": // ADD_WALLET
        return {
          title: MODAL_MESSAGES.ADD_WALLET.title,
          body: (
            <>
              <p>
                We already have a user record under your Telegram account from Galaxy Blaster but you never connected a wallet
              </p>
              <p>Do you want to add the wallet you&apos;re trying to login to this user?</p>
            </>
          ),
          actions: (
            <>
              <Button
                className="bg-[#CBFC01] text-black rounded-xl"
                isDisabled={loading}
                onPress={onConfirm}
              >
                {loading ? <Spinner className="text-black" /> : "Yes"}
              </Button>
              <Button color="danger" onPress={onCancel}>
                No
              </Button>
            </>
          )
        };

      case "4": // AGGREGATE_NEW
        return {
          title: MODAL_MESSAGES.AGGREGATE_NEW.title,
          body: (
            <>
              <p>Multiple accounts are associated with your Telegram.</p>
              <p>
                {`Do you want to aggregate them all to this wallet ${wallet ? convertAddress(String(wallet?.account?.address)) : null
                  }? If not click cancel and connect the desired wallet`}
              </p>
              {wallet && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Wallet: {String(wallet.account.address).slice(0, 6)}...{String(wallet.account.address).slice(-4)}</p>
                </div>
              )}
            </>
          ),
          actions: (
            <>
              <Button
                className="bg-[#CBFC01] text-black rounded-xl"
                isDisabled={loading}
                onPress={onConfirm}
              >
                {loading ? <Spinner className="text-black" /> : "Yes"}
              </Button>
              <Button color="danger" onPress={onCancel}>
                No
              </Button>
            </>
          )
        };

      default:
        return null;
    }
  };

  const modalContent = getModalContent();
  if (!modalContent) {
    //console.log('⚠️ No modal content for type:', modalType);
    return null;
  }

  return (
    <Modal
      onClose={() => {
        //console.log('🚪 Modal closing');
        onOpenChange();
      }}
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
              {modalContent.title}
            </ModalHeader>
            <ModalBody>{modalContent.body}</ModalBody>
            <ModalFooter>{modalContent.actions}</ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
