// src/hooks/useWalletAuthFlow.js
import { useState, useEffect } from 'react';
import * as api from '../auth/utils/api';
import { useTonConnectAuth } from '../auth/TonConnectAuth';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { aggregateUsers, checkUserExists } from '../api/services/auth.service';
import { createDefaultGalaxyInstance, createDefaultProfileSettings, createDefaultUser } from '../auth/utils/defaults';
import { generateRefCode, getReferralCodeFromURL, getTelegramUserInfo } from '../auth/utils/helpers';

export function useWalletAuthFlow() {
    const { wallet, checkUser, tonError, handleDisconnect } = useTonConnectAuth();
    const { setUserAuthenticated, setUserData, telegramUser, setTelegramUser } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalUsers, setModalUsers] = useState([]);
    const [isAggregating, setIsAggregating] = useState(false);
    const [userLogingIn, setUserLogingIn] = useState(null);
    const [modalMessages, setModalMessages] = useState("");
    const [userId, setUserId] = useState('');
    const [userGalaxyData, setUserGalaxyData] = useState(null);
    // When wallet connects, check authentication status and decide if a modal is needed.
    useEffect(() => {
        if (wallet) {
            //console.log("Wallet exists:", wallet);
            checkUser().then(async (result) => {
                const walletUser = await checkUserExists(String(wallet.account.address));
                const telegramUsers = await api.getAllUsersTelegramId(result?.telegramId);
                const telegramData = getTelegramUserInfo();
                const { telegramId, telegramInfo } = telegramData;
                const refCode = getReferralCodeFromURL();
                const generatedRefCode = generateRefCode(String(wallet.account.address));
                const walletAddress = String(wallet.account.address);
                const walletType = wallet.appName;
                if (!walletUser) {
                    if (telegramUsers?.length === 1) {
                        // Wallet mismatch – one Telegram user exists with a different wallet
                        //console.log("another record with wallet, should change wallet:", result?.telegramUsers);
                        setModalUsers([telegramUsers[0]]);
                        setUserLogingIn(telegramUsers[0]);
                        setIsModalOpen(true);
                        setModalMessages("1");
                    } else if (telegramUsers?.length > 1) {
                        // Multiple Telegram users found
                        //console.log("multiple accounts should  aggregate 1:", result?.telegramUsers);
                        setModalUsers(telegramUsers);
                        setIsModalOpen(true);
                        setModalMessages("2");
                    } else {
                        // No matching user – new user creation flow can be triggered
                        const newUser = createDefaultUser({
                            walletAddress,
                            walletType,
                            refCode,
                            generatedRefCode,
                            telegramInfo,
                            telegramId: String(telegramId),
                            isTeleUser: true
                        });

                        const createdUser = await api.createUser(newUser);
                        if (createdUser) {
                            const newInstance = createDefaultGalaxyInstance(createdUser.user_id, createdUser.walletAddress);
                            const createdGalaxyInstance = await api.createGalaxyBlasterInstance(newInstance);
                            setUserGalaxyData(createdGalaxyInstance);
                            setUserId(createdUser.user_id);
                            const newSettings = createDefaultProfileSettings(createdUser.user_id);
                            await api.createProfileSettingsUser(newSettings);
                            //console.log("created user 2:", createdUser);
                            setUserData(createdUser)
                            setUserAuthenticated(true);
                        }
                        //console.log("create user:", createdUser);
                    }
                } else {
                    if (result.needsAggregation) {
                        // Force modal regardless of the other conditions
                        setModalUsers(result.telegramUsers);
                        setUserLogingIn(result.telegramUsers[0]);
                        setIsModalOpen(true);
                        // You can decide which modal message you need
                        setModalMessages("2");
                        return;
                    }
                    else if (result?.telegramUsers?.length > 1) {
                        //console.log("multiple accounts should  aggregate 2:", result?.telegramUsers);
                        // Multiple accounts found
                        setModalUsers(result.telegramUsers);
                        setIsModalOpen(true);
                        setModalMessages("2");
                    } else if (
                        result?.telegramUsers?.length === 1 &&
                        !result.telegramUsers[0].crypto_wallet_address
                    ) {
                        // Telegram user exists without a wallet connected
                        //console.log("this is when user connects  telegram,  never  had a record and then connects the  wallet: ", result?.telegramUsers);
                        setModalUsers(result.telegramUsers);
                        setUserLogingIn(result.telegramUsers[0]);
                        setIsModalOpen(true);
                        setModalMessages("3");
                    } else {
                        // Single user with matching wallet – authentication successful
                        //console.log("only one record should login:", result?.telegramUsers);
                        setUserAuthenticated(true);
                        setUserData(walletUser);
                    }
                }
            });
        }
    }, [wallet, checkUser, setUserAuthenticated, setUserData]);

    // Handle wallet disconnection and errors.
    // useEffect(() => {
    //     if (!wallet) {
    //         setUserAuthenticated(false);
    //         setUserData(null);
    //     }
    //     if (tonError) {
    //         handleDisconnect();
    //         setUserAuthenticated(false);
    //         setUserData(null);
    //     }
    // }, [wallet, tonError, handleDisconnect, setUserAuthenticated, setUserData]);

    useEffect(() => {
        // console.log("telegramUser:", telegramUser);
        if (!wallet && !telegramUser) {
            //console.log('👛 Wallet disconnected');
            setUserAuthenticated(false);
            setUserData(null); // Clear user data on disconnect
            //This bellow is correct
        } else if (telegramUser && !wallet) {
            setUserAuthenticated(true);
        }
        if (tonError) {
            console.error('TON Connect error:', tonError);
            handleDisconnect();
            setUserAuthenticated(false);
            setUserData(null); // Clear user data on error
        }
    }, [wallet, tonError, handleDisconnect, setUserAuthenticated, setUserData, telegramUser]);


    // Function to handle account aggregation, wallet replacement, or wallet connection.
    const handleAggregateAccounts = async () => {
        setIsAggregating(true);
        try {
            if (modalMessages === "1") {
                //console.log("userLogingIn for change  wallet:", userLogingIn);
                // Replace wallet for the user (wallet mismatch)
                const userUpdated = await api.walletChange(
                    userLogingIn.user_id,
                    String(wallet.account.address),
                    wallet.appName
                );
                if (!userUpdated.success) {
                    throw new Error('Failed to update wallet');
                }
            } else if (modalMessages === "3") {
                // Connect wallet to Telegram user
                const userUpdated = await api.updateUser(userLogingIn.user_id, {
                    crypto_wallet_address: String(wallet.account.address),
                    crypto_wallet_type: wallet.appName,
                    is_tele_user: false,
                });
                if (!userUpdated) {
                    throw new Error('Failed to connect wallet');
                }
                await api.updateGalaxyBlasterInstance(
                    userLogingIn.user_id,
                    String(wallet.account.address)
                );
            } else {
                // Aggregate multiple accounts
                const currentUser = await checkUserExists(String(wallet.account.address));
                if (!currentUser) {
                    throw new Error('Current user not found');
                }
                //console.log("currentUser at aggregate:", currentUser);
                const aggregated = await aggregateUsers(currentUser.user_id);
                //console.log(aggregated);
                if (!aggregated.success) {
                    throw new Error('Failed to aggregate accounts');
                }
            }
            // Close the modal and update authentication state.
            setIsModalOpen(false);
            setUserAuthenticated(true);
            const updatedUser = await checkUserExists(String(wallet.account.address));
            setUserData(updatedUser);
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Operation failed');
            handleDisconnect();
        } finally {
            setIsAggregating(false);
        }
    };

    const handleCancelAggregate = () => {
        handleDisconnect();
        setIsModalOpen(false);
        setUserAuthenticated(false);
        setUserData(null);
    };

    return {
        isModalOpen,
        modalUsers,
        isAggregating,
        userLogingIn,
        modalMessages,
        handleAggregateAccounts,
        handleCancelAggregate,
    };
}
