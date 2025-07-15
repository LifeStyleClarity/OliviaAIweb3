// components/NftScreen.jsx

import { Button } from '@heroui/react';
import { Plus, CircleChevronLeft } from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

const NftScreen = ({ userNfts, onPlayGame, handleBackToMenu }) => {

    const validCollectionAddresses = [
        "0:bb7d00d5e8f5f8b0367f4ffd44d380acfb5470f28a67f1e9dcef1a6e801ecab1",
        "0:719af25823c9d5c45de47c352982c53575be41f74c8073dd682394828ce896d5",
        "0:0ec34858ce3b6e6b0947f184f877243585a266f0132ef54902af986121d5394b"
    ];

    const isValidCollectionAddress = (address) => {
        return validCollectionAddresses.includes(address);
    };

    return (
        <div className="nft-screen">
            {/* <div className='flex mb-2 ml-10'>
                <Button isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"> 
                    <CircleChevronLeft onClick={handleBackToMenu} />
                </Button>
            </div> */}
            <h1 className='text-white text-5xl font-bold mb-4 mt-20 text-center'>Select Your Ship</h1>
            <div className="nft-grid grid grid-cols-2 sm:grid-cols-3 gap-4 justify-center items-center">
                <div className="nft-item grid justify-center items-center" onClick={() => { onPlayGame() }}>
                    <img src="/spaceship.png" className='min-w-28 min-h-28  max-w-28 max-h-28 p-4 rounded-lg border-1 border-solid border-default-500 hover:border-[#CBFC01] duration-250 cursor-pointer active:scale-[.95]' alt="Default" />
                    <h2>Main Ship</h2>
                </div>

                {userNfts.filter(nft => isValidCollectionAddress(nft.collection?.address)).map((nft, index) => (
                    <div key={index} className="nft-item grid justify-center items-center" onClick={() => {
                        onPlayGame(nft)
                    }}>
                        <img src={nft.metadata.image} className='min-w-28 min-h-28  max-w-28 max-h-28 p-4 rounded-lg border-1 border-solid border-default-500 hover:border-[#CBFC01] duration-250 cursor-pointer  active:scale-[.95]' alt={nft.coin_name} />
                        <h2>{nft.metadata.name}</h2>
                    </div>
                ))}

                <div className="nft-item grid justify-center items-center" >
                    <Button isDisabled={true} onPress={() => window.location.href = 'https://getgems.io/collection/EQC7fQDV6PX4sDZ_T_1E04Cs-1Rw8opn8enc7xpugB7KsfJV'}
                        variant="light" className='min-w-28 min-h-28  max-w-28 max-h-28  p-4 rounded-lg text-white border-1 border-solid border-default-500 hover:bg-transparent hover:bg-opacity-0 hover:border-[#CBFC01] duration-250 cursor-pointer active:scale-[.95]' alt="Default" >
                        <Plus />
                    </Button>

                    <h2>Coming soon</h2>
                </div>
            </div>
        </div>
    );
};

NftScreen.propTypes = {
    userNfts: PropTypes.array.isRequired,
    onPlayGame: PropTypes.func.isRequired
};

export default NftScreen;
