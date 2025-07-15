import Button from './Button'
import { Bell, ArrowLeft, ChevronRight, ChevronDown, ChartCandlestick } from 'lucide-react'
import { 
  useDisclosure, 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody 
} from '@heroui/react'
import { notificationService } from '../../api'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function NotificationButton() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const observerTarget = useRef(null)
  const { userData } = useAuth()

  const handleNotificationClick = async (notification) => {
    const isExpanded = expandedId === notification.notification_id;
    
    // Toggle expanded state
    setExpandedId(isExpanded ? null : notification.notification_id);

    // If notification is unread and we're expanding it, mark it as read
    if (!isExpanded && notification.status === 'Unread') {
      try {
        await notificationService.updateNotification(notification.notification_id, {
          status: 'Read'
        });
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.notification_id === notification.notification_id
              ? { ...n, status: 'Read' }
              : n
          )
        );
      } catch (error) {
        console.error('Error updating notification status:', error);
      }
    }
  }
    
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && notifications.length > visibleCount) {
          // Add 10 more notifications when user scrolls to bottom
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 10, notifications.length))
          }, 500) // Add delay for smooth loading
        }
      },
      { threshold: 0.5, rootMargin: '100px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [notifications.length, visibleCount])

  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        setIsLoading(true)
        try {
          if (!userData?.user_id) {
            console.error('No user ID available');
            return;
          }
          const data = await notificationService.getNotificationsByUserId(userData.user_id)
          // Sort notifications by date, newest first
          const sortedData = data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )
          setNotifications(sortedData)
        } catch (error) {
          console.error('Error fetching notifications:', error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchNotifications()
    }
  }, [isOpen])

  return (
    <>
      <Button 
        variant="ghost" 
        isIconOnly
        size="sm"
        className="p-2"
        onPress={onOpen}
      >
        <Bell className="w-5 h-5" />
      </Button>

      <Drawer
        hideCloseButton
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="right"
        size="full"
      >
        <DrawerContent className="bg-gradient-to-t from-[#181818] to-[#000000]">
          {(onClose) => (
            <>
              <DrawerHeader className="relative flex items-center justify-center px-6 py-4">
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onClose}
                  className="absolute left-6 text-white bg-[#1D2530] rounded-full h-10 w-10"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h4 className="text-[16px] font-medium text-white">Notifications</h4>
              </DrawerHeader>

              <DrawerBody>
                <div className="flex justify-between items-center w-full">
                  <h4 className="text-[16px] font-medium text-white">All notifications</h4>
                  <Button
                    size="sm"
                    variant="light"
                    className="text-sm text-white/70 underline"
                    isDisabled={isMarkingRead || notifications.length === 0}
                    onPress={async () => {
                      setIsMarkingRead(true)
                      try {
                        if (!userData?.user_id) return;
                        await notificationService.setNotificationsToRead(userData.user_id)
                        // Update all notifications to read status
                        setNotifications(prevNotifications => 
                          prevNotifications.map(n => ({
                            ...n,
                            status: 'Read'
                          }))
                        )
                      } catch (error) {
                        console.error('Error marking all notifications as read:', error)
                      } finally {
                        setIsMarkingRead(false)
                      }
                    }}
                  >
                    {isMarkingRead ? 'Marking as read...' : 'Mark all as read'}
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2 py-2">
                  {isLoading && notifications.length === 0 && (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col p-4 rounded-2xl bg-[#131820] animate-pulse"
                        >
                          <div className="flex justify-between items-center">
                            <div className='flex flex-col justify-start items-start gap-2'>
                              <div className="flex justify-start items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#1D2530]" />
                                <div className="h-4 w-40 bg-[#1D2530] rounded" />
                              </div>
                              <div className="h-3 w-24 bg-[#1D2530] rounded" />
                            </div>
                            <div className="w-5 h-5 rounded bg-[#1D2530]" />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {!isLoading && notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Bell className="w-12 h-12 text-[#1D2530] mb-4" />
                      <p className="text-white/70 text-center">No notifications yet</p>
                      <p className="text-sm text-white/50 text-center mt-1">
                        When you receive notifications, they will appear here
                      </p>
                    </div>
                  )}
                  {notifications.slice(0, visibleCount).map((notification) => {
                    const isExpanded = expandedId === notification.notification_id;
                    const isUnread = notification.status === 'Unread';
                    
                    return (
                      <div
                        key={notification.notification_id}
                        className={`flex flex-col p-4 rounded-2xl bg-[#131820] duration-250 hover:bg-[#1a202b] cursor-pointer animate-fadeIn transition-all ${
                          isUnread ? 'border border-[#45EF34]' : 'border border-transparent'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between items-center">
                          <div className='flex flex-col justify-start items-start gap-2'>
                            <div className="flex justify-start items-center gap-2">
                              <ChartCandlestick color='#45EF34' className='w-5 h-5' />
                              <p className="text-[14px] font-normal text-white">
                                {notification.message_subject.replace('🚨 NOTIFICATION 🚨\n\n ', '')}
                              </p>
                            </div>
                            <p className="text-sm text-[#666]">
                              {new Date(notification.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-[#666]" />
                          ) : (
                            <ChevronRight className={`w-5 h-5 ${isUnread ? "text-[#45EF34]": "text-[#666]"} `} />
                          )}
                        </div>
                        
                        <div className={`overflow-hidden transition-all duration-250 ease-in-out ${
                          isExpanded ? 'max-h-40' : 'max-h-0'
                        }`}>
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-sm text-white/70">
                              {notification.message_content.trim()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length > visibleCount && (
                    <div ref={observerTarget} className="py-4 flex justify-center">
                      <div className="w-2 h-2 bg-[#45EF34] rounded-full animate-wave mx-1" />
                      <div className="w-2 h-2 bg-[#45EF34] rounded-full animate-wave mx-1 [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-[#45EF34] rounded-full animate-wave mx-1 [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
