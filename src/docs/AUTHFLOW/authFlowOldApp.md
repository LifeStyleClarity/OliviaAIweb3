import PropTypes from "prop-types";
import {
  TonConnectButton,
  useTonWallet,
  toUserFriendlyAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { useCallback, useEffect, useState } from "react";
import {
  aggregateUsers,
  checkGalaxyBlasterInstance,
  checkUserExists,
  createGalaxyBlasterInstance,
  createUser,
  getAllUsersTelegramId,
  getAllUsersTelegramId,
  updateGalaxyBlasterInstance,
  updateUser,
  walletChange,
} from "../utils/UserUtils";
import {
  checkUserProfileSettingsExists,
  createProfileSettingsUser,
} from "../utils/tradeUtils";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import RadioAggregate from "../components/AgreggateRadios";
import { toast } from "sonner";
// TODO: SEND AFTER TO UTILS FILE:
const generateRefCode = (walletAddress) => {
  const lastFourDigits = walletAddress.slice(-4);
  const timestamp = Date.now().toString().slice(-6); // Get the last 6 digits of the timestamp
  return lastFourDigits + timestamp; // Combine last 4 digits of wallet and last 6 digits of timestamp
};

function convertAddress(rawAddress) {
  return toUserFriendlyAddress(rawAddress);
}

function AuthFlow({
  setUserId,
  setUserGalaxyData,
  setTelegramUser,
  setUserAuthenticated,
  setWalletDisconnected,
  walletDisconnected,
}) {
  const wallet = useTonWallet();
  const [refCode, setRefCode] = useState("");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalMessages, setModalMessages] = useState("");
  const [userLogingIn, setUserLogingIn] = useState(null);
  const [tonConnectUi] = useTonConnectUI();
  const [allUserLogins, setAllUserLogin] = useState([]);
  const [walletSelected, setWalletSelected] = useState("");
  const [loadingAggregate, setLoadingAggregate] = useState(false);

  // const location = useLocation();

  useEffect(() => {
    const unsubscribe = tonConnectUi.onStatusChange((wallet) => {
      if (wallet) {
        // Wallet is connected
        //console.log('Wallet connected authFlow:', wallet);
        setWalletDisconnected(false);
        // Update your user session or state here
      } else {
        // Wallet is disconnected
        setWalletDisconnected(true);
        //console.log('Wallet disconnected');
        // Handle the disconnection, e.g., clear user session or prompt for reconnection
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [tonConnectUi]);

  const shortenPublicKey = (key) => {
    if (!key) return "";
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  // Get URL parameter from URL
  useEffect(() => {
    //console.log("you are on auth");
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const referralCode = params.get("referral_code");
    if (referralCode) {
      setRefCode(referralCode);
    }
  }, []);

  useEffect(() => {
    if (walletDisconnected) {
      //console.log("you are on auth");
      setAllUserLogin([]);
      setModalMessages("");
      setUserId("");
      setUserLogingIn(null);
      setUserAuthenticated(false);
      setUserGalaxyData([]);
    }
  }, [walletDisconnected]);

  //login  the  desired  User
  const loginUser = async (user, isTelegram) => {
    //console.log("login user from authFlow");
    //console.log(isTelegram);
    if (isTelegram == true) {
      setUserAuthenticated(false);
    } else {
      setUserAuthenticated(true);
    }
    try {
      if (user) {
        //console.log("user is true:", user);
        // User exists, fetch the Galaxy Blaster data
        const getGalaxyInstanceData = await checkGalaxyBlasterInstance(
          user.user_id
        );
        //If galaxy blaster then set the states, if not create a new galaxy blaster instance
        if (getGalaxyInstanceData) {
          setUserGalaxyData(getGalaxyInstanceData);
          setUserId(user.user_id);
          // console.log(getGalaxyInstanceData);
        } else {
          const newInstance = {
            user_id: user.user_id,
            crypto_wallet_address: user.walletAddress,
            last_score: 0,
            high_score: 0,
            total_score: 0,
            season_two_total_score: 0,
            games_played: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tokens_collected: [
              {
                amount: 0,
                coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                coin_name: "ONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
              },
              {
                amount: 0,
                coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
                coin_name: "TONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif",
              },
              {
                amount: 0,
                coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
                coin_name: "SENTAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z",
              },
            ],
            season_two_tokens_collected: [
              {
                amount: 0,
                coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                coin_name: "ONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
              },
            ],
            points_by_click: 0,
            referral_points_earned: 0,
            aliens_threshold: 50,
            total_aliens_killed: 0,
          };
          const createGalaxyInstanceData = await createGalaxyBlasterInstance(
            newInstance
          );
          //console.log(createGalaxyInstanceData);
          setUserGalaxyData(createGalaxyInstanceData);
          setUserId(user.user_id);
        }
        const getUserProfileSettings = await checkUserProfileSettingsExists(
          user.user_id
        );
        // console.log(getUserProfileSettings);
        //IF Portfolio settings do not exist
        if (!getUserProfileSettings) {
          const newUserProfileSettings = {
            user_id: user.user_id,
            trade_style: "Manual",
            wallets: [],
            risk_profile: "Low",
            stop_loss: 0.2,
            take_profit: 0.2,
            trailing_stop: 0.2,
            slippage: 0.1,
            current_step: 1,
          };
          await createProfileSettingsUser(newUserProfileSettings);
        }
      }
    } catch (error) {
      console.log("error during login user:", error);
    }
  };

  ////////////////////TELEGRAM LOGIN////////////////////////////////////////

  ////////for telegram user
  const handleContinueWithTelegram = async () => {
    let generatedRefCode;
    let telegramUser;
    let telegramInfoArray;
    let telegramId;
    //console.log("continue with telegram");
    // alert("Enter")
    // Ensure Telegram WebApp is available
    if (
      window.Telegram &&
      window.Telegram.WebApp &&
      window.Telegram.WebApp.initDataUnsafe
    ) {
      // if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initData) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      telegramUser = tg.initDataUnsafe.user;
      if (telegramUser) {
        telegramId = telegramUser?.id;
        generatedRefCode = generateRefCode(String(telegramUser?.id));
        telegramInfoArray = [
          {
            ID: telegramUser?.id,
            Is_Bot: telegramUser?.is_bot ? "Yes" : "No",
            Username: telegramUser?.username,
            First_Name: telegramUser?.first_name,
            Last_Name: telegramUser?.last_name,
            Is_Premium_User: telegramUser?.is_premium ? "Yes" : "No",
            Language: telegramUser?.language_code,
            Added_to_Attachment_Menu: telegramUser?.added_to_attachment_menu
              ? "Yes"
              : "No",
            Allows_Write_to_PM: telegramUser?.allows_write_to_pm ? "Yes" : "No",
          },
        ];
      } else {
        // telegramInfoArray = [
        //     {
        //         ID: 952080226,
        //         Is_Bot: telegramUser?.is_bot ? "Yes" : "No",
        //         Username: "Ed_Ai_dev",
        //         First_Name: "Eduardo",
        //         Last_Name: "Brito",
        //         Is_Premium_User: telegramUser?.is_premium ? "Yes" : "No",
        //         Language: "en",
        //         Added_to_Attachment_Menu: telegramUser?.added_to_attachment_menu ? "Yes" : "No",
        //         Allows_Write_to_PM: telegramUser?.allows_write_to_pm ? "Yes" : "No"
        //     }
        // ];
        // telegramId = "952080226"
        //FABIO TG INFO
        telegramInfoArray = [
          {
            ID: 1118448788,
            Is_Bot: "No",
            Language: "en",
            Username: "crosseo",
            Last_Name: "",
            First_Name: "Crosseo",
            Is_Premium_User: "No",
            Allows_Write_to_PM: "Yes",
            Added_to_Attachment_Menu: "No",
          },
        ];
        telegramId = "1118448788";
        generatedRefCode = generateRefCode(String(telegramId));
      }

      let filteredUsersWithWallets = false;
      try {
        const teleUser = await getAllUsersTelegramId(telegramId);
        // Filter users where is_tele_user is false or null
        if (teleUser) {
          filteredUsersWithWallets = teleUser.filter(
            (user) => user.is_tele_user === false || user.is_tele_user === null
          );
        }

        //console.log("filteredUsersWithWallets:", filteredUsersWithWallets);
        if (filteredUsersWithWallets) {
          //console.log(filteredUsersWithWallets[0]);
          //Login user
          setTelegramUser(true);
          loginUser(filteredUsersWithWallets[0], true);
          //this is to create if not exists
          //TO create a tele game user
        } else {
          //console.log("creating new  user");
          const newUser = {
            used_ref_code: refCode,
            genereated_ref_code: generatedRefCode,
            crypto_wallet_address: null,
            telegram_info: telegramInfoArray,
            registration_date: new Date().toISOString(),
            last_login_date: new Date().toISOString().slice(0, 10),
            // telegram_id: telegramUser.id
            telegram_id: String(telegramId),
            is_tele_user: true,
          };
          const createdUser = await createUser(newUser);
          //console.log(createdUser);
          const newInstance = {
            user_id: createdUser.user_id,
            crypto_wallet_address: null,
            last_score: 0,
            high_score: 0,
            total_score: 0,
            season_two_total_score: 0,
            games_played: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tokens_collected: [
              {
                amount: 0,
                coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                coin_name: "ONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
              },
              {
                amount: 0,
                coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
                coin_name: "TONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif",
              },
              {
                amount: 0,
                coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
                coin_name: "SENTAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z",
              },
            ],
            season_two_tokens_collected: [
              {
                amount: 0,
                coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                coin_name: "ONAI",
                image_url:
                  "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
              },
            ],
            points_by_click: 0,
            referral_points_earned: 0,
            aliens_threshold: 50,
            total_aliens_killed: 0,
          };
          const createGalaxyInstanceData = await createGalaxyBlasterInstance(
            newInstance
          );
          setUserGalaxyData(createGalaxyInstanceData);
          setUserId(createdUser.user_id);
          const newUserProfileSettings = {
            user_id: createdUser.user_id,
            trade_style: "Manual",
            wallets: [],
            risk_profile: "Low",
            stop_loss: 0.2,
            take_profit: 0.2,
            trailing_stop: 0.2,
            slippage: 0.1,
            current_step: 1,
          };
          await createProfileSettingsUser(newUserProfileSettings);
          // setUserProfileSettings(createUserProfileSettings);
          setTelegramUser(true);
          loginUser(createdUser, true);
        }
      } catch (error) {
        console.error("Error checking or creating user:", error);
      }
    } else {
      //console.log("you need to be using our app on telegram");
    }
  };

  ////////////////////TELEGRAM LOGIN////////////////////////////////////////

  // Define the async function for user data fetching
  const checkAndCreateUser = useCallback(async () => {
    //console.log("checks the user");
    if (!wallet) {
      return;
    } else {
      //console.log("inside");
    }
    // console.log("here");
    const walletAddress = String(wallet.account.address);
    // const walletAddress = "0:2976e5e4d97323ff1070bfcfb051ef908b16af5774d1a7333fc6a007aa0c5911";
    let generatedRefCode = generateRefCode(walletAddress);
    let telegramUser;
    let telegramInfo = [];
    let telegramId = "";
    //If user using telegram fills the telegramInfo, if not is just []
    // if (window.Telegram && window.Telegram.WebApp.initData) {
    if (
      window.Telegram &&
      window.Telegram.WebApp &&
      window.Telegram.WebApp.initDataUnsafe &&
      window.Telegram.WebApp.initData
    ) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      // Retrieve the user data from the Telegram WebApp
      telegramUser = tg.initDataUnsafe.user;
      telegramId = telegramUser?.id;
      telegramInfo = [
        {
          ID: telegramUser?.id,
          Is_Bot: telegramUser?.is_bot ? "Yes" : "No",
          Username: telegramUser?.username,
          First_Name: telegramUser?.first_name,
          Last_Name: telegramUser?.last_name,
          Is_Premium_User: telegramUser?.is_premium ? "Yes" : "No",
          Language: telegramUser?.language_code,
          Added_to_Attachment_Menu: telegramUser?.added_to_attachment_menu
            ? "Yes"
            : "No",
          Allows_Write_to_PM: telegramUser?.allows_write_to_pm ? "Yes" : "No",
        },
      ];
    } else {
      // telegramInfo = [
      //     {
      //         ID: 952080226,
      //         Is_Bot: telegramUser?.is_bot ? "Yes" : "No",
      //         Username: "Ed_Ai_dev",
      //         First_Name: "Eduardo",
      //         Last_Name: "Brito",
      //         Is_Premium_User: telegramUser?.is_premium ? "Yes" : "No",
      //         Language: "en",
      //         Added_to_Attachment_Menu: telegramUser?.added_to_attachment_menu ? "Yes" : "No",
      //         Allows_Write_to_PM: telegramUser?.allows_write_to_pm ? "Yes" : "No"
      //     }
      // ];
      // telegramId = "952080226"
      //FABIO TG INFO
      telegramInfo = [
        {
          ID: 1118448788,
          Is_Bot: "No",
          Language: "en",
          Username: "crosseo",
          Last_Name: "",
          First_Name: "Crosseo",
          Is_Premium_User: "No",
          Allows_Write_to_PM: "Yes",
          Added_to_Attachment_Menu: "No",
        },
      ];
      telegramId = "1118448788";
      //BEN
      // telegramInfo = [
      //     {
      //         "ID": 5473635519,
      //         "Is_Bot": "No",
      //         "Language": "en",
      //         "Username": "Bcaolivia",
      //         "Last_Name": "",
      //         "First_Name": "Bca",
      //         "Is_Premium_User": "Yes",
      //         "Allows_Write_to_PM": "Yes",
      //         "Added_to_Attachment_Menu": "No"
      //     }
      // ];
      // telegramId = "5473635519"
    }
    try {
      //console.log("telegramInfo:", telegramInfo);
      //console.log("telegramId:", telegramId);
      const user = await checkUserExists(walletAddress);
      if (user) {
        //console.log("user exists");
        if (
          user.telegram_info === null ||
          !user.telegram_info ||
          user.telegram_info.length === 0
        ) {
          // const userUpdate = await updateUser(user.user_id, { telegram_info: telegramInfo });
          await updateUser(user.user_id, { telegram_info: telegramInfo });
        }
        const allUsers = await getAllUsersTelegramId(telegramId);
        // Filter users where is_tele_user is false or null
        // const filteredUsersWithWallets = allUsers.filter(user => user.is_tele_user === false || user.is_tele_user === null);
        const filteredUsersWithWallets = allUsers;
        //console.log("Filtered Users:", filteredUsersWithWallets);
        if (filteredUsersWithWallets) {
          setAllUserLogin(allUsers);
          if (filteredUsersWithWallets.length == 1) {
            // console.log("allUsers", allUsers);
            if (filteredUsersWithWallets[0].crypto_wallet_address) {
              if (
                walletAddress ==
                filteredUsersWithWallets[0].crypto_wallet_address
              ) {
                //console.log("login this user lenght 1");
                //login user
                loginUser(user, false);
              } else {
                //Modal 1
                //DONE
                //console.log("lenght 1 but wallet is different");
                //console.log("modal opens - your user already exists do you want to switch to this wallet?");
                setUserLogingIn(filteredUsersWithWallets[0]);
                setModalMessages("1");
                // onOpen()
                //modal logic - if yes update the user with the new wallet
                //if no disconnect user
                //modal closes
                //login user
              }
            } else {
              setModalMessages("2");
              //console.log("lenght > 1 but does not have wallet address so it  means  is  the  telegram user from this user");
              //console.log("Aggregate");
              // console.log("allUsers", filteredUsersWithWallets);
              // loginUser(filteredUsersWithWallets[0], false)
              // onOpen()
              //modal logic - show all wallets with radio button to choose which  wallet
              //if cancel disconnects user
              //modal closes
              //login users
            }
          } else if (filteredUsersWithWallets.length > 1) {
            //Modal 2
            setModalMessages("2");
            //console.log("lenght > 1");
            // console.log("allUsers", filteredUsersWithWallets);
            //console.log("Aggregate");
            // loginUser(filteredUsersWithWallets[0], false)
            // onOpen()
            //modal logic - show all wallets with radio button to choose which  wallet
            //if cancel disconnects user
            //modal closes
            //login users
          }
        }
        //this means wallet but no TG ID - allUsers is empty
        else {
          if (
            user.telegram_info === null ||
            !user.telegram_info ||
            user.telegram_info.length === 0
          ) {
            // const userUpdate = await updateUser(user.user_id, { telegram_info: telegramInfo });
            await updateUser(user.user_id, { telegram_info: telegramInfo });
          }
          console.log("all users is  false");
          //login user
          loginUser(user, false);
        }
      } else {
        //need to check if he  exists under the  same tg IDZ because is a new user->
        //Meaning: is a new wallet but  I need to check if his TG ID  is alreadyb on my  DB
        try {
          // setUserAuthenticated(true);
          //console.log("user do not exists");
          const allUsers = await getAllUsersTelegramId(telegramId);
          // Filter users where is_tele_user is false or null
          // const filteredUsersWithWallets = allUsers.filter(user => user.is_tele_user === false || user.is_tele_user === null);
          const filteredUsersWithWallets = allUsers;
          //console.log("Filtered Users:", filteredUsersWithWallets);
          //console.log("walletAddress:", walletAddress);
          //console.log("user do not exist so I checked under telegram id");
          if (filteredUsersWithWallets) {
            setAllUserLogin(allUsers);
            if (filteredUsersWithWallets.length == 1) {
              //this if  bellow is is probably never going to happen because the user detcted with this TG ID did not had  a wallet
              if (filteredUsersWithWallets[0].crypto_wallet_address) {
                if (
                  walletAddress ==
                  filteredUsersWithWallets[0].crypto_wallet_address
                ) {
                  //console.log("login this user lenght 1");
                  //login user
                  loginUser(user, false);
                } else {
                  //Modal 1
                  //DONE
                  //console.log("lenght 1 but wallet is different");
                  //console.log("modal opens - your user already exists do you want to switch to this wallet?");
                  setUserLogingIn(filteredUsersWithWallets[0]);
                  setModalMessages("1");
                  // onOpen()
                  //modal logic - if yes update the user with the new wallet
                  //if no disconnect user
                  //modal closes
                  //login user
                }
              }
              //So it goes here and needs to aggregate all - or just adds the cryupto  wallet  to the TG user and puts  the is_tele_user to false?
              else {
                setUserLogingIn(filteredUsersWithWallets[0]);
                setModalMessages("3");
                //console.log("lenght == 1 but does not have wallet address so it  means  is  the  telegram user from this user");
                //console.log("adds the wallet logging in to the telegram user");
                // console.log("allUsers", filteredUsersWithWallets);
                // loginUser(filteredUsersWithWallets[0], false)
                // onOpen()
                //modal logic - show all wallets with radio button to choose which  wallet
                //if cancel disconnects user
                //modal closes
                //login users
              }
            } else if (filteredUsersWithWallets.length > 1) {
              //create this  user get them all again and then show the aggregate modal
              const newUser = {
                used_ref_code: refCode,
                genereated_ref_code: generatedRefCode,
                telegram_info: telegramInfo,
                registration_date: new Date().toISOString(),
                last_login_date: new Date().toISOString(),
                crypto_wallet_address: walletAddress,
                crypto_wallet_type: wallet.appName,
                telegram_id: telegramId,
              };
              const createdUser = await createUser(newUser);
              const newInstance = {
                user_id: createdUser.user_id,
                crypto_wallet_address: walletAddress,
                last_score: 0,
                high_score: 0,
                total_score: 0,
                season_two_total_score: 0,
                games_played: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                tokens_collected: [
                  {
                    amount: 0,
                    coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                    coin_name: "ONAI",
                    image_url:
                      "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
                  },
                  {
                    amount: 0,
                    coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
                    coin_name: "TONAI",
                    image_url:
                      "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif",
                  },
                  {
                    amount: 0,
                    coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
                    coin_name: "SENTAI",
                    image_url:
                      "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z",
                  },
                ],
                season_two_tokens_collected: [
                  {
                    amount: 0,
                    coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                    coin_name: "ONAI",
                    image_url:
                      "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
                  },
                ],
                points_by_click: 0,
                referral_points_earned: 0,
                aliens_threshold: 50,
                total_aliens_killed: 0,
              };
              const createGalaxyInstanceData =
                await createGalaxyBlasterInstance(newInstance);
              const newUserProfileSettings = {
                user_id: createdUser.user_id,
                trade_style: "Manual",
                wallets: [],
                risk_profile: "Low",
                stop_loss: 0.2,
                take_profit: 0.2,
                trailing_stop: 0.2,
                slippage: 0.1,
                current_step: 1,
              };
              const createUserProfile = await createProfileSettingsUser(
                newUserProfileSettings
              );
              //console.log("finished creating the user");
              //create this  user get them all again and then show the aggregate modal
              if (
                createdUser &&
                createGalaxyInstanceData &&
                createUserProfile
              ) {
                //Modal 2
                //console.log("user created because wallet did not existed but he had records under the same TG ID ");
                //console.log("createdUser:", createdUser);
                const allUsers = await getAllUsersTelegramId(telegramId);
                setAllUserLogin(allUsers);
                setModalMessages("4");
                //console.log("lenght > 1");
                //console.log("Aggregate and wallet dont  exist");
              }
            }
          }
          //Then you can create the user because no records of him on the DB
          else {
            //This is not tested
            //create new user logic
            const newUser = {
              used_ref_code: refCode,
              genereated_ref_code: generatedRefCode,
              telegram_info: telegramInfo,
              registration_date: new Date().toISOString(),
              last_login_date: new Date().toISOString(),
              crypto_wallet_address: walletAddress,
              crypto_wallet_type: wallet.appName,
            };
            const createdUser = await createUser(newUser);
            const newInstance = {
              user_id: createdUser.user_id,
              crypto_wallet_address: walletAddress,
              last_score: 0,
              high_score: 0,
              total_score: 0,
              season_two_total_score: 0,
              games_played: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              tokens_collected: [
                {
                  amount: 0,
                  coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                  coin_name: "ONAI",
                  image_url:
                    "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
                },
                {
                  amount: 0,
                  coin_id: "b314e305-f678-4572-a10c-fba28990d4c3",
                  coin_name: "TONAI",
                  image_url:
                    "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/TONAI_COIN.gif",
                },
                {
                  amount: 0,
                  coin_id: "cec39e92-6c8d-4ba1-a33c-b5951066ba22",
                  coin_name: "SENTAI",
                  image_url:
                    "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/SENTAI_COIN.gif?t=2024-07-08T15%3A48%3A25.095Z",
                },
              ],
              season_two_tokens_collected: [
                {
                  amount: 0,
                  coin_id: "2fd97971-522f-4293-b133-6b04c1da80f3",
                  coin_name: "ONAI",
                  image_url:
                    "https://wqhimlgqnpmxubhgyysi.supabase.co/storage/v1/object/public/token_images/ONAI_COIN.gif?t=2024-06-21T10%3A15%3A06.918Z",
                },
              ],
              points_by_click: 0,
              referral_points_earned: 0,
              aliens_threshold: 50,
              total_aliens_killed: 0,
            };
            const createGalaxyInstanceData = await createGalaxyBlasterInstance(
              newInstance
            );
            const newUserProfileSettings = {
              user_id: createdUser.user_id,
              trade_style: "Manual",
              wallets: [],
              risk_profile: "Low",
              stop_loss: 0.2,
              take_profit: 0.2,
              trailing_stop: 0.2,
              slippage: 0.1,
              current_step: 1,
            };
            await createProfileSettingsUser(newUserProfileSettings);
            // setUserGalaxyData(createGalaxyInstanceData);
            // setUserId(createdUser.user_id);
            // setUserProfileSettings(createUserProfileSettings);
            loginUser(createdUser, false);
          }
        } catch (error) {
          console.error(
            "no user found and error finding by telegramId: ",
            error
          );
        }
      }
    } catch (error) {
      console.error("Error checking or creating user:", error);
    }
  }, [wallet]);

  //For Modal 1
  const changeWallet = async () => {
    // console.log("contisnue");
    setLoadingAggregate(true);
    try {
      //updating user with new wallet wallet
      //Need to do  this on the Backend Remeber to also update crypto_wallet_type
      // await updateUser(userLogingIn.user_id, { crypto_wallet_address: String(wallet.account.address) });
      // await updateGalaxyBlasterInstance(userLogingIn.user_id, String(wallet.account.address));
      const userUpdated = await walletChange(
        userLogingIn.user_id,
        String(wallet.account.address),
        wallet.appName
      );
      if (userUpdated.success == true) {
        loginUser(userLogingIn);
      } else {
        handleDisconnect();
        toast.error(
          "Error aggregating wallets, please login with a valid TON wallet"
        );
      }
      // loginUser(userLogingIn);
    } catch (error) {
      console.log("error chaning wallets:", error);
    } finally {
      setLoadingAggregate(false);
    }
  };

  //For Modal 2
  const aggregateWallets = async () => {
    try {
      setLoadingAggregate(true);
      const userToKeep = await checkUserExists(String(wallet.account.address));
      if (userToKeep) {
        const userAggregated = await aggregateUsers(userToKeep.user_id);
        //console.log(userAggregated);
        if (userAggregated.success == true) {
          loginUser(userToKeep);
        } else {
          handleDisconnect();
          toast.error(
            "Error aggregating wallets, please login with a valid TON wallet"
          );
        }
      }
    } catch (error) {
      console.log("error chaning wallets:", error);
    } finally {
      setLoadingAggregate(false);
    }
  };

  //For Modal 3
  const addWalletToTelegramUser = async () => {
    // console.log("contisnue");
    setLoadingAggregate(true);
    try {
      //updating user with new wallet wallet
      //Need to do  this on the Backend Remeber to also update crypto_wallet_type
      const userUpdated = await updateUser(userLogingIn.user_id, {
        crypto_wallet_address: String(wallet.account.address),
        crypto_wallet_type: wallet.appName,
        is_tele_user: false,
      });
      await updateGalaxyBlasterInstance(
        userLogingIn.user_id,
        String(wallet.account.address)
      );
      // const userUpdated = await walletChange(userLogingIn.user_id, String(wallet.account.address), wallet.appName)
      if (userUpdated) {
        loginUser(userLogingIn);
      } else {
        handleDisconnect();
        toast.error(
          "Error aggregating wallets, please login with a valid TON wallet"
        );
      }
      // loginUser(userLogingIn);
    } catch (error) {
      console.log("error chaning wallets:", error);
    } finally {
      setLoadingAggregate(false);
    }
  };

  //For Modal 4
  const aggregateWalletsModalFour = async () => {
    try {
      setLoadingAggregate(true);
      const userToKeep = await checkUserExists(String(wallet.account.address));
      if (userToKeep) {
        const userAggregated = await aggregateUsers(userToKeep.user_id);
        //console.log(userAggregated);
        if (userAggregated.success == true) {
          loginUser(userToKeep);
        } else {
          handleDisconnect();
          toast.error(
            "Error aggregating wallets, please login with a valid TON wallet"
          );
        }
      }
    } catch (error) {
      console.log("error chaning wallets:", error);
    } finally {
      setLoadingAggregate(false);
    }
  };

  //Disconnect  the user on  the cancel press
  const handleDisconnect = async () => {
    try {
      await tonConnectUi.disconnect();
      setAllUserLogin([]);
      setModalMessages("");
      setUserAuthenticated(false);
      setUserId("");
      setUserLogingIn(null);
      onOpenChange();
      //set all the States to empty
      // Optionally do any other cleanup or state resets you need here
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // Fetch user data only when wallet changes
  useEffect(() => {
    checkAndCreateUser(); // Fetch user and Galaxy Blaster data
  }, [checkAndCreateUser]);

  // Ensure the modal waits for `userLogingIn` to be set before opening
  useEffect(() => {
    if (userLogingIn && modalMessages === "1") {
      onOpen();
    } else if (allUserLogins && modalMessages === "2") {
      onOpen();
    } else if (allUserLogins && modalMessages === "3") {
      onOpen();
    } else if (allUserLogins && modalMessages === "4") {
      onOpen();
    }
  }, [userLogingIn, modalMessages, onOpen]);

  // useEffect(() => {
  //     console.log(walletSelected);
  // }, [walletSelected]);

  return (
    <>
      <div className="min-h-screen w-full flex justify-center items-center flex-col gap-8 px-4 bg-[#020712]">
        <div className="w-full flex gap-4 flex-col justify-start items-center">
          <img
            src="./olivia-logo-no-bg.webp"
            className="w-[150px]"
            alt="Onai Logo"
          />
          <h1 className="text-xl">AN ALL-IN-ONE AI ENGINE</h1>
          <p className="text-center">
            Join the AI Web3 Community and Unlock the power of AI with your ONAI
            Wallet
          </p>
        </div>
        <TonConnectButton className="con_btt_primary" />
        <div className="mt-3 w-full flex justify-center">
          <Button
            onPress={() => handleContinueWithTelegram()}
            className="bg-[#CBFC01] text-black rounded-xl"
          >
            Continue with Telegram
          </Button>
        </div>
      </div>
      <Modal
        hideCloseButton={true}
        isDismissable={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-black"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalMessages === "1"
                  ? "Wallet Mismatch Detected"
                  : "Multiple Accounts Detected"}
              </ModalHeader>
              <ModalBody>
                {modalMessages === "1" ? (
                  <>
                    <p>
                      {`We already have a user record under your Telegram account with a different wallet: ${shortenPublicKey(
                        convertAddress(userLogingIn.crypto_wallet_address)
                      )}`}
                    </p>
                    <p>
                      {" "}
                      Do you want to replace with this wallet you're trying to
                      login?
                    </p>
                  </>
                ) : modalMessages === "2" ? (
                  <>
                    <p>Multiple accounts are associated with your Telegram.</p>
                    <p>
                      Do you want to aggregate them all to this wallet? If not
                      click cancel and connect the desired wallet
                    </p>
                    {wallet && (
                      <RadioAggregate
                        setWalletSelected={setWalletSelected}
                        wallet={wallet.account.address}
                        allUsers={allUserLogins}
                        shortenPublicKey={shortenPublicKey}
                      />
                    )}
                  </>
                ) : modalMessages === "3" ? (
                  <>
                    <p>
                      {`We already have a user record under your Telegram account from Galaxy Blaster but you never  connected a wallet`}
                    </p>
                    <p>
                      {" "}
                      Do you want to add the wallet you're trying to login to
                      this user?
                    </p>
                  </>
                ) : modalMessages === "4" ? (
                  <>
                    <p>Multiple accounts are associated with your Telegram.</p>
                    <p>
                      {`Do you want to aggregate  them all to  this wallet ${
                        wallet
                          ? convertAddress(String(wallet?.account?.address))
                          : null
                      }? If not click cancel and connect the desired wallet`}
                    </p>
                    {wallet && (
                      <RadioAggregate
                        setWalletSelected={setWalletSelected}
                        wallet={String(wallet.account.address)}
                        allUsers={allUserLogins}
                        shortenPublicKey={shortenPublicKey}
                      />
                    )}
                  </>
                ) : null}
              </ModalBody>
              <ModalFooter>
                {modalMessages === "1" && (
                  <>
                    <Button
                      className="bg-[#CBFC01] text-black rounded-xl"
                      isDisabled={loadingAggregate}
                      onPress={() => {
                        // Logic to update the wallet
                        // console.log("Updating wallet...");
                        // onClose();
                        changeWallet();
                      }}
                    >
                      {loadingAggregate ? (
                        <Spinner className="text-black" />
                      ) : (
                        "Yes"
                      )}
                    </Button>
                    <Button
                      color="danger"
                      onPress={() => {
                        // Logic to keep current wallet
                        // console.log("Logging in with current wallet...");
                        // onClose();
                        handleDisconnect();
                      }}
                    >
                      No
                    </Button>
                  </>
                )}
                {modalMessages === "2" && (
                  <>
                    <Button
                      className="bg-[#CBFC01] text-black rounded-xl"
                      isDisabled={loadingAggregate}
                      onPress={() => {
                        // Logic to update the wallet
                        // console.log("Updating wallet...");
                        // onClose();
                        aggregateWallets();
                      }}
                    >
                      {loadingAggregate ? (
                        <Spinner className="text-black" />
                      ) : (
                        "Aggregate"
                      )}
                    </Button>
                    <Button
                      color="danger"
                      onPress={() => {
                        // Logic to keep current wallet
                        // console.log("Logging in with current wallet...");
                        // onClose();
                        handleDisconnect();
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {modalMessages === "3" && (
                  <>
                    <Button
                      className="bg-[#CBFC01] text-black rounded-xl"
                      isDisabled={loadingAggregate}
                      onPress={() => {
                        // Logic to update the wallet
                        // console.log("Updating wallet...");
                        // onClose();
                        addWalletToTelegramUser();
                      }}
                    >
                      {loadingAggregate ? (
                        <Spinner className="text-black" />
                      ) : (
                        "Yes"
                      )}
                    </Button>
                    <Button
                      color="danger"
                      onPress={() => {
                        // Logic to keep current wallet
                        // console.log("Logging in with current wallet...");
                        // onClose();
                        handleDisconnect();
                      }}
                    >
                      No
                    </Button>
                  </>
                )}
                {modalMessages === "4" && (
                  <>
                    <Button
                      className="bg-[#CBFC01] text-black rounded-xl"
                      isDisabled={loadingAggregate}
                      onPress={() => {
                        // Logic to update the wallet
                        // console.log("Updating wallet...");
                        // onClose();
                        aggregateWalletsModalFour();
                      }}
                    >
                      {loadingAggregate ? (
                        <Spinner className="text-black" />
                      ) : (
                        "Yes"
                      )}
                    </Button>
                    <Button
                      color="danger"
                      onPress={() => {
                        // Logic to keep current wallet
                        // console.log("Logging in with current wallet...");
                        // onClose();
                        handleDisconnect();
                      }}
                    >
                      No
                    </Button>
                  </>
                )}
                {/* {!["1", "2"].includes(modalMessages) && (
                                    <Button color="primary" onPress={onClose}>
                                        Close
                                    </Button>
                                )} */}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

AuthFlow.propTypes = {
  setUserId: PropTypes.func.isRequired,
  setUserGalaxyData: PropTypes.func.isRequired,
  setTelegramUser: PropTypes.func.isRequired,
  setUserAuthenticated: PropTypes.func.isRequired,
  setWalletDisconnected: PropTypes.func,
  walletDisconnected: PropTypes.bool,
};

export default AuthFlow;
