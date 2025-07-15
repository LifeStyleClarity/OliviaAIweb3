import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@heroui/react';

const PlayGameScreen = ({ onPlayGame }) => {
    const [activeTab, setActiveTab] = useState('play');

    return (
        <div className=" min-h-screen bg-black flex items-center justify-center ">
            {activeTab === 'play' && (
                <div className="w-full max-w-[600px] flex flex-col items-center relative">
                    <span className="absolute text-[140px] w-full text-center font-handwritten text-transparent bg-clip-text bg-gradient-to-b from-[#31F46E] to-[#0afde100] top-[-110px] z-0">2</span>
                    <h1 className="text-[40px] font-bold text-[#ffffff] -mb-2 relative z-10">Galaxy Blaster</h1>
                    <p className="text-[#888888] text-lg mb-12">Blast your way through the galaxy</p>

                    <Button
                        onPress={onPlayGame}
                        className="bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] text-black rounded-xl px-12 py-6 text-xl font-regular"
                    >
                        Start Game
                    </Button>
                </div>
            )}
        </div>
    );
};

PlayGameScreen.propTypes = {
    onPlayGame: PropTypes.func,
    genRefCode: PropTypes.string,
    userId: PropTypes.string,
    referrerPointsByClick: PropTypes.number,
    userNfts: PropTypes.array
};

export default PlayGameScreen;
