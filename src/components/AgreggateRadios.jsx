import { cn, ScrollShadow } from '@heroui/react';
import { toUserFriendlyAddress } from '@tonconnect/sdk';
import PropTypes from 'prop-types';

function convertAddress(rawAddress) {
    // Ensure the address is properly formatted
    const hexPart = rawAddress.split(':')[1]; // Extract the hex part
    if (!hexPart) {
        throw new Error('Invalid TON address format: missing hex part.');
    }

    if (hexPart.length > 64) {
        console.warn('Trimming extra character from address:', rawAddress);
        rawAddress = rawAddress.slice(0, -1); // Remove extra character
    } else if (hexPart.length < 64) {
        console.error('Invalid TON address length:', rawAddress);
        return null;
    }

    return toUserFriendlyAddress(rawAddress);
}

function RadioAggregate({ wallet, allUsers, shortenPublicKey, setWalletSelected }) {

    return (
        <ScrollShadow hideScrollBar className="max-h-[160px] overflow-y-auto">
            <div className="flex flex-col w-full">
                {allUsers &&
                    <>
                        {allUsers
                            .filter((item) => item?.crypto_wallet_address)
                            .map((item, idx) => {
                                const isSelected = wallet === item.crypto_wallet_address;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setWalletSelected(item.crypto_wallet_address)}
                                        className={cn(
                                            'group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between tap-highlight-transparent w-full cursor-pointer border-2 mt-2 rounded-lg gap-4 p-4',
                                            isSelected ? 'border-[#CBFC00]' : 'border-default'
                                        )}
                                    >
                                        <span>
                                            {shortenPublicKey(convertAddress(item.crypto_wallet_address))}
                                        </span>
                                        <span>
                                            {item.crypto_wallet_type || 'Unknown Wallet Type'}
                                        </span>
                                    </div>
                                );
                            })}
                        {allUsers
                            .filter((item) => !item?.crypto_wallet_address)
                            .map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setWalletSelected("")}
                                    className="group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between tap-highlight-transparent w-full cursor-pointer border-2 mt-2 border-default rounded-lg gap-4 p-4 data-[selected=true]:border-[#CBFC00]"
                                >
                                    <span>Other Profiles</span>
                                    <span>Telegram User</span>
                                </div>
                            ))}
                    </>
                }
            </div>
        </ScrollShadow>
    );
}

RadioAggregate.propTypes = {
    allUsers: PropTypes.array,
    shortenPublicKey: PropTypes.func,
    wallet: PropTypes.string,
    setWalletSelected: PropTypes.func,
};

export default RadioAggregate;
