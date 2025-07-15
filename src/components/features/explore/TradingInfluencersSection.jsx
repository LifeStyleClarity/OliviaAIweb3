import { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Info } from 'lucide-react';
import BubbleMap from './BubbleMap';
import { socialService } from '../../../api';
import { ScrollShadow, useDisclosure, Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/react";
import Button from '../../ui/Button';
import { startOliviaChat } from '../../../utils/olivia';
import { useTokenInfluencer } from '../../../contexts/TokenInfluencerContext';
import { useAuth } from '../../../contexts/AuthContext';


export default function TradingInfluencersSection() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedInfluencer, setSelectedInfluencer] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState([]);
  const { setTokenInfluencerData } = useTokenInfluencer();
  const { userData } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, tokensData] = await Promise.all([
          socialService.getInfluencers(),
          socialService.getTokens()
        ]);
        setTokens(tokensData);
        // Map all influencers (no slice)
        const allInfluencers = data
          .map(({ influencer, cashtags }) => ({
            id: influencer.id,
            name: influencer.username,
            handle: `@${influencer.username}`,
            image: influencer.avatar_image,
            tag: cashtags?.length > 0 ? `$${cashtags[0].cashtag}` : '$TON',
            tagColor: '#4ED342', // Keep consistent green color
            followers_count: influencer.followers_count,
            following_count: influencer.following_count,
            onai_table_user_id: influencer.onai_table_user_id,
            influencer_points: influencer.influencer_points,
            is_verified: influencer.is_verified,
            olivia_users_ids: influencer.olivia_users_ids,
            community_trades_ids: influencer.community_trades_ids,
            cashtags: cashtags
          }));
        // console.log("All Influencers: ", allInfluencers);
        setInfluencers(allInfluencers);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 z-10 mt-6">
          <h2 className="text-sm font-medium">Explore Trading Influencers</h2>
        </div>
        <div className="rounded-2xl">
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="h-3 w-24 bg-gray-700 rounded"></div>
                  <div className="h-2 w-20 bg-gray-700 rounded"></div>
                  <div className="h-5 w-16 bg-gray-700/20 rounded-full mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 z-10 mt-6">
          <h2 className="text-sm font-medium">Explore Trading Influencers</h2>
        </div>

        <div className="rounded-2xl">
          <ScrollShadow
            className="h-[360px]"
            hideScrollBar={false}
            size={40}
          >
            <div className="flex flex-col gap-4">
              {influencers.map(influencer => (
                <button
                  key={influencer.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                  onClick={() => {
                    setSelectedInfluencer(influencer);
                    onOpen();
                  }}
                >
                  <div className="min-w-12 w-12 min-h-12 h-12 rounded-full overflow-hidden border-[#1B1B1B] border-solid border-2">
                    <img
                      src={influencer.image}
                      alt={influencer.name}
                      className="min-w-12 w-12 min-h-12 h-12 object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start justify-between w-full">
                    <div className='flex justify-start flex-col items-start'>
                      <span className="text-[12px] font-medium">{influencer.name}</span>
                      <span className="text-[10px] text-white/80">{influencer.handle}</span>
                    </div>
                  </div>
                  <div className='flex justify-end items-center gap-2'>
                    <div
                      className="text-[12px] border-1 border-solid px-2 py-0.2 border-[#22D911]/40 rounded-full"
                      style={{
                        backgroundColor: `${influencer.tagColor}20`,
                        color: influencer.tagColor
                      }}
                    >
                      {influencer.tag}
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-white/50" />
                  </div>
                </button>
              ))}
            </div>
          </ScrollShadow>
        </div>
      </div>

      <Drawer
        hideCloseButton
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="right"
        size="full"
      >
        <DrawerContent className="bg-gradient-to-t from-[#181818]  to-[#000000]">
          {(onClose) => (
            <>
              <DrawerHeader className="relative flex items-center  justify-center px-6 py-8">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  className="absolute left-6 text-white bg-[#1D2530] rounded-full h-10 w-10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </DrawerHeader>

              <DrawerBody className="flex justify-center p-0 px-4  w-full h-full">
                {selectedInfluencer && (
                  <>
                    < div className="flex flex-col gap-4 w-full pb-100">
                      <div className="flex flex-col items-center rounded-2xl mt-[370px]">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-[#1B1B1B] border-solid border-2">
                          <img
                            src={selectedInfluencer.image}
                            alt={selectedInfluencer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center items-center">
                          <div className='flex justify-start items-center gap-1 mt-2'>
                            <span className="text-[32px] text-white font-medium">{selectedInfluencer.name}</span>
                            <img
                              src="/Olivia-ai-LOGO.png"
                              alt="Olivia Icon"
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-extralight text-white/80">{selectedInfluencer.handle}</span>
                        </div>
                      </div>
                      {
                        userData.is_influencer === true && userData.influencer_id == selectedInfluencer.user_id ? (
                          (() => {
                            console.log(userData);
                            return <div className='text-white'>hello influencer</div>;
                          })()
                        ) : null
                      }
                      {/* Action Buttons */}
                      <div className="flex gap-2 w-full">
                        <Button
                          className="flex-1 rounded-full border-opacity-30 hover:opacity-90 gap-2 text-white"
                          size="md"
                          variant="bordered"
                          onClick={() => window.open(`https://x.com/${selectedInfluencer.cashtags?.[0]?.posts?.[0]?.screen_name || selectedInfluencer.name}`, '_blank')}
                        >
                          <img
                            src="/X-logo.svg"
                            alt="X Logo"
                            className="w-[13px] h-[13px] rounded-full object-cover"
                          /> View Profile
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r rounded-full from-[#31F46E] to-[#0AFDE1] hover:opacity-90 gap-2 text-black"
                          size="md"
                          onPress={() => startOliviaChat({
                            action: "quick_chat",
                            message: `Can you tell me more about ${selectedInfluencer.handle} on X?`,
                            suggestions: ["Portfolio overview", "Market analysis", "Trading opportunities"],
                            sendMessage: true
                          })}
                        >
                          Profile Summary
                        </Button>

                      </div>

                      {/* Stats Section */}
                      <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="flex flex-col items-start justify-between p-4 h-[112px] rounded-2xl border-1 border-[#2D394A] border-solid">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-white/80">Followers</span>
                          </div>
                          <span className="text-[24px] font-extralight text-white">
                            {new Intl.NumberFormat().format(influencers.find(i => i.id === selectedInfluencer.id)?.followers_count || 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-start justify-between p-4 h-[112px] rounded-2xl border-1 border-[#2D394A] border-solid">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-white/80">Following</span>
                          </div>
                          <span className="text-[24px] font-extralight text-white">
                            {new Intl.NumberFormat().format(influencers.find(i => i.id === selectedInfluencer.id)?.following_count || 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-start justify-between p-4 h-[112px] rounded-2xl border-1 border-[#2D394A] border-solid">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-white/80">Number of $</span>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-white/50" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px] text-center">
                                Number of token mentions in the last 30 days
                              </div>
                            </div>
                          </div>
                          <span className="text-[24px] font-extralight text-white">
                            {new Intl.NumberFormat().format(
                              influencers.find(i => i.id === selectedInfluencer.id)?.cashtags?.filter(cashtag => {
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return cashtag.posts.some(post => new Date(post.created_at) > thirtyDaysAgo);
                              })?.length || 0
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col items-start justify-between p-4 h-[112px] rounded-2xl border-1 border-[#2D394A] border-solid">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-white/80">Mentions</span>
                            <div className="group relative">
                              <Info className="w-3 h-3 text-white/50" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px] text-center">
                                Number of different token mentions
                              </div>
                            </div>
                          </div>
                          <span className="text-[24px] font-extralight text-white">
                            {new Intl.NumberFormat().format(
                              influencers.find(i => i.id === selectedInfluencer.id)?.cashtags?.reduce((sum, cashtag) => sum + cashtag.mentions, 0) || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Trading Tokens Grid */}
                      <div className="w-full mt-4">
                        <div className="flex items-center gap-1 mb-4">
                          <span className="text-sm text-white/80">Token Activity</span>
                          <div className="group relative">
                            <Info className="w-3 h-3 text-white/50" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#344256] text-xs text-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 w-[162px] max-w-[162px] text-center">
                              Tokens mentioned by this influencer
                            </div>
                          </div>
                        </div>
                        <div className="border-[#2D394A] border-1 border-solid rounded-2xl p-2">
                          <div className="grid grid-cols-4 gap-2">
                            {influencers.find(i => i.id === selectedInfluencer.id)?.cashtags?.map(token => (
                              <button
                                key={token.cashtag}
                                className="bg-[#1D2530] rounded-xl p-2 flex flex-col items-center gap-1 hover:bg-[#2D394A] transition-colors"
                                onClick={() => {
                                  // Store the token and influencer data in context
                                  const currentInfluencer = influencers.find(i => i.id === selectedInfluencer.id);

                                  // Find the matching token with more details
                                  const matchingTokens = tokens.filter(t => t.token_symbol === token.cashtag);
                                  const forcedToken = matchingTokens.find(t => t.force_show);
                                  const chosenToken = forcedToken || matchingTokens[0];

                                  // Combine token data
                                  const tokenData = {
                                    ...token,
                                    details: chosenToken || {},
                                  };

                                  // Set data in context
                                  setTokenInfluencerData(tokenData, currentInfluencer, userData);
                                  console.log("tokenData: ", tokenData)
                                  console.log("currentInfluencer: ", currentInfluencer)
                                  console.log("userData: ", userData)
                                  // Continue with the chat
                                  startOliviaChat({
                                    action: "quick_chat",
                                    message: `Can you tell me more about $${token.cashtag}`,
                                    suggestions: ["Portfolio overview", "Market analysis", "Trading opportunities"],
                                    sendMessage: true
                                  });
                                }}
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden border-[#2D394A] border-solid border-2 flex items-center justify-center">
                                  {(() => {
                                    const matchingTokens = tokens.filter(t => t.token_symbol === token.cashtag);
                                    const forcedToken = matchingTokens.find(t => t.force_show);
                                    const chosenToken = forcedToken || matchingTokens[0];
                                    return chosenToken?.token_icon ? (
                                      <img
                                        src={chosenToken.token_icon}
                                        alt={token.cashtag}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[24px] text-white/10 font-black">{token.cashtag}</span>
                                    );
                                  })()}
                                </div>
                                <span className="text-[10px] font-medium text-white/80">{token.cashtag}</span>
                                <span className="text-[8px] text-[#4ED342]">
                                  {token.mentions} mentions
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Cashtags Bubble Map */}
                      <div className="flex mt-4 items-center gap-1 px-4">
                        <span className="text-sm text-white/80">Recent token mentions</span>
                      </div>

                      <div className="w-full rounded-2xl border-1 border-[#2D394A] border-solid mb-8">
                        <BubbleMap
                          data={influencers.find(i => i.id === selectedInfluencer.id)?.cashtags?.map(cashtag => ({
                            name: cashtag.cashtag,
                            value: cashtag.mentions
                          })) || []}
                          bubbleIsLoading={false}
                        />
                      </div>
                    </div>
                  </>
                )}
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer >
    </>
  );
}
