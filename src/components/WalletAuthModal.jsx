// src/components/WalletAuthModal.jsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import Button from './ui/Button';

export function WalletAuthModal({
    isOpen,
    modalUsers,
    modalMessages,
    handleAggregateAccounts,
    handleCancelAggregate,
    wallet
}) {
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) handleCancelAggregate();
            }}
            isDismissable={false}
            hideCloseButton
            className="bg-black"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 text-white">
                    {modalMessages === "1"
                        ? "Wallet Mismatch Detected"
                        : modalMessages === "3"
                            ? "Add Wallet to Telegram Account"
                            : "Multiple Accounts Found"}
                    <p className="text-white/70 text-base font-light">
                        {modalMessages === "1" ? (
                            `${modalUsers[0]?.crypto_wallet_address ? `We found a user record under your Telegram account with a different wallet: ${modalUsers[0]?.crypto_wallet_address?.slice(0, 6)}...${modalUsers[0]?.crypto_wallet_address?.slice(-4)}` : 'We found a user record under your Telegram account'}`
                        ) : modalMessages === "3" ? (
                            "We found your Telegram account but it doesn't have a wallet connected."
                        ) : (
                            "We found multiple accounts associated with your Telegram ID."
                        )}
                    </p>
                    <p className="text-white/70 text-base font-light">
                        {modalMessages === "1"
                            ? `${modalUsers[0]?.crypto_wallet_address ? "Would you like to replace it with your current wallet?" : 'Would you like to add this current wallet?'}`
                            : modalMessages === "3"
                                ? "Would you like to connect your current wallet?"
                                : "Would you like to aggregate these accounts?"}
                    </p>
                </ModalHeader>
                <ModalBody>
                    <div className="space-y-2">
                        {modalUsers.map((user, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-2xl bg-[#131820] relative ${user.crypto_wallet_address === wallet?.account?.address
                                    ? 'before:absolute before:-inset-0.5 before:rounded-2xl before:p-1 before:bg-gradient-to-r before:from-[#31F46E] before:to-[#0AFDE1]'
                                    : 'border border-white/10'
                                    }`}
                            >
                                <div className={`relative ${user.crypto_wallet_address === wallet?.account?.address ? 'bg-[#131820] p-3 -m-3 rounded-2xl' : ''}`}>
                                    <div className={`font-medium ${user.crypto_wallet_address === wallet?.account?.address ? 'bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] bg-clip-text text-transparent' : 'text-white'}`}>
                                        {user.telegram_info?.[0]?.Username || user.telegram_info?.[0]?.First_Name || 'Unknown User'}
                                    </div>
                                    {user.crypto_wallet_address && (
                                        <div className="text-sm text-white/50 mt-1">
                                            Wallet: {user.crypto_wallet_address.slice(0, 6)}...{user.crypto_wallet_address.slice(-4)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="primary"
                        onPress={handleAggregateAccounts}
                        className="rounded-xl"
                    >
                        {modalMessages === "1"
                            ? `${modalUsers[0]?.crypto_wallet_address ? "Replace Wallet" : "Add Wallet"}`
                            : modalMessages === "3"
                                ? "Connect Wallet"
                                : "Aggregate Accounts"}
                    </Button>
                    <Button
                        variant="ghost"
                        onPress={handleCancelAggregate}
                        className="text-white/70"
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
