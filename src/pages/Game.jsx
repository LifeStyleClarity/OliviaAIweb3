import { useState, useEffect, useRef } from 'react';
import { Toaster } from 'sonner'
import { useTonWallet } from '@tonconnect/ui-react';
import { Spinner } from '@heroui/react';
import { checkGalaxyBlasterInstance, updateGalaxyBlasterInstanceGamesPlayed, updateGalaxyBlasterScores } from '../api/services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import NftScreen from '../components/features/Game/NftScreen';
import PlayGameScreen from '../components/features/Game/playGameScreen';
import Game from '../components/features/Game/Game';
import GameOverScreen from '../components/features/Game/GameOverScreen';
import { nftService } from '../api/services/nft.service';

function PlayGame() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [score, setScore] = useState(0); // Store score here
  const walletConnected = useTonWallet();
  const mainContainerRef = useRef(null); // Add a ref for the main container
  const [genRefCode, setGenRefCode] = useState("");
  const [referrerPointsByClick, setReferrerPointsByClick] = useState(0);
  const [userNfts, setUserNfts] = useState([]);
  const [showNftScreen, setShowNftScreen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null); // State to store the selected NFT
  const { userData } = useAuth()
  const [isLoading, setisLoading] = useState(false);

  const [aliensKilled, setALiensKilled] = useState(0);
  const [aliensThreshold, setAliensThreshold] = useState(0);

  const [isTelegramApp, setIsTelegramApp] = useState(false);

  const [userLoggedIn, setUserLoggedIn] = useState([]);
  const [galaxyPlayer, setGalaxyPlayer] = useState(null);


  //check nft user 
  useEffect(() => {
    if (walletConnected) {
      setIsConnected(true);
      let walletAddress = String(walletConnected.account.address); // Convert to string
      const checkAndCreateUser = async () => {
        try {
          setisLoading(true)
          const nfts = await nftService.getNfts(walletAddress);
          //console.log(nfts);
          if (nfts) {
            setUserNfts(nfts.nft_items)
          } else {
            setUserNfts([])
          }
        } catch (error) {
          console.error('Error checking or creating user:', error);
        } finally {
          setisLoading(false)
        }
      };
      checkAndCreateUser();
    } else {
      // Reset states when the wallet is disconnected
      setIsConnected(false);
      setHasStartedGame(false);
    }
  }, [walletConnected]);

  const handleGameOver = async (finalScore) => {
    setIsGameOver(true);
    setShowNftScreen(false);
    setScore(finalScore); // Store whatever finalScore includes
    //console.log(finalScore);

    if (userData.user_id) {
      try {
        const existingInstance = await checkGalaxyBlasterInstance(userData.user_id);
        //console.log("existingInstance: ", existingInstance);
        setAliensThreshold(existingInstance.aliens_threshold);

        if (existingInstance) {
          // 1) Find or create the ONAI token in the user's tokens_collected
          let onaiToken = existingInstance.season_two_tokens_collected.find(
            (token) => token.coin_name === "ONAI"
          );

          if (!onaiToken) {
            // If there's no ONAI token yet, create a default one
            onaiToken = {
              amount: 0,
              coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3", // ONAI's coin_id
              coin_name: "ONAI",
              image_url:
                "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
            };
          }

          // 2) Increment ONAI by  finalScore.onaiScore (default 0 if undefined)
          const onaiToAdd = finalScore.onaiScore || 0;
          onaiToken.amount = (onaiToken.amount || 0) + onaiToAdd;

          // 3) Build a new tokens array containing ONLY the updated ONAI token
          //    (all other tokens are effectively ignored/removed here)
          const coinsCollected = [onaiToken];

          // 4) Compute other game stats if needed
          const highScore = Math.max(existingInstance.high_score, finalScore.score);
          const totalScore = existingInstance.season_two_total_score + finalScore.score;
          const newReferralPoints = existingInstance.referral_points_earned;
          const totalAliens = existingInstance.total_aliens_killed + finalScore.aliensKilled;
          setALiensKilled(totalAliens);

          // If needed, reset or define the ship upgrade
          const shipUpgrade = [
            { Rockets: 0 },
            { Guns: 0 },
            { Lasers: 0 },
            { Shield: 0 },
            { Speed: 0 },
          ];

          // 5) Persist all changes back to DB
          const updated = await updateGalaxyBlasterScores(
            userData.user_id,
            finalScore.score,
            highScore,
            totalScore,
            coinsCollected,
            newReferralPoints,
            totalAliens,
            shipUpgrade
          );

          setGalaxyPlayer(updated);
          //console.log("Game scores updated (ONAI only).");
        }
      } catch (error) {
        console.error("Error updating game scores:", error);
      }
    }
  };

  const handleTryAgain = async () => {
    setIsGameOver(false);
    setHasStartedGame(true);
    if (userData.user_id) {
      try {
        const existingInstance = await checkGalaxyBlasterInstance(userData.user_id);
        if (existingInstance) {
          //await updateGalaxyBlasterInstance(userId, existingInstance.games_played);
          await handleExistingInstance(existingInstance, userData.user_id);
          //console.log('Game instance updated for try again');
        }
      } catch (error) {
        console.error('Error updating game instance for try again:', error);
      }
    }
  };

  const handleNftPlayGame = (nft) => {
    setSelectedNft(nft); // Store the selected NFT
    setHasStartedGame(true); // Start the game
  };

  const handleStartGame = async () => {
    //console.log(userId.userId);
    if (!userData.user_id) return;
    try {
      const existingInstance = await checkGalaxyBlasterInstance(userData.user_id);
      //check if the user exists under galaxy bblaster in order to start the game
      //if exists updates the existing instance
      //if not creates a new one
      if (existingInstance) {
        //This is to give the referral user 50 points 
        await handleExistingInstance(existingInstance, userData.user_id);
        setGalaxyPlayer(existingInstance);
      } else {
        //this is to create a new galaxy blaster user - meaning he never played before
      }
      // if (userNfts && userNfts.length > 0) {
      //   setShowNftScreen(true); // Show the NFT screen if user has NFTs
      // } else {
      //   setHasStartedGame(true);
      // }
      setShowNftScreen(true);
      setIsGameOver(false);
      setHasStartedGame(false);
    } catch (error) {
      console.error('Error checking or creating new game instance:', error);
    }
  };

  const handleExistingInstance = async (existingInstance, userId) => {
    //this is to display under mining
    //updates the times played
    await updateGalaxyBlasterInstanceGamesPlayed(userId, existingInstance.games_played);
  };


  const handleBackToMenu = () => {
    setHasStartedGame(false);
    setShowNftScreen(false);
  }

  return (
    <>
      <div
        className=""
        ref={mainContainerRef}
      >
        {isLoading ? (
          <Spinner />
        ) : !hasStartedGame ? (
          showNftScreen ? (
            <NftScreen
              handleBackToMenu={handleBackToMenu}
              userNfts={userNfts}
              onPlayGame={handleNftPlayGame}
            />
          ) : (
            userData.user_id &&
            (
              <PlayGameScreen
                userNfts={userNfts}
                onPlayGame={handleStartGame}
                genRefCode={genRefCode}
                userId={userData.user_id}
                referrerPointsByClick={referrerPointsByClick}
                userLoggedIn={userLoggedIn}
              />
            )
          )
        ) : !isGameOver ? (
          <Game
            galaxyPlayer={galaxyPlayer}
            onGameOver={handleGameOver}
            selectedNft={selectedNft}
            userId={userData.user_id}
          />
        ) : (
          <GameOverScreen
            userNfts={userNfts}
            onPlayGame={handleStartGame}
            genRefCode={genRefCode}
            userId={userData.user_id}
            referrerPointsByClick={referrerPointsByClick}
            onTryAgain={handleTryAgain}
            score={score}
            userLoggedIn={userLoggedIn}
          />
        )}
      </div>
      <Toaster richColors position="top-center" expand={false} />
    </>
  );

}

export default PlayGame;
