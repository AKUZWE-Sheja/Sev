import { useState, useEffect } from 'react';
import { useAuth } from '../context/authUtils';
import { getMessages, sendMessage } from '../services/api';
import ErrorMessage from '../utils/ErrorMsg';
import { FaEnvelope } from 'react-icons/fa';
import Lottie from 'lottie-react';
import Empty from '../assets/empty.json';
import NavBar from '../components/Navbar';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  sender: { id: number; fname: string; lname: string; email: string };
  receiver: { id: number; fname: string; lname: string; email: string };
}

interface Conversation {
  otherUser: { id: number; fname: string; lname: string; email: string };
  latestMessage: string;
  messages: Message[];
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !hasRedirected) {
      console.log('Redirecting to /login: No user authenticated');
      setHasRedirected(true);
      window.location.href = '/login';
      return;
    }

    if (authLoading || !user) return;

    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const messagesRes = await getMessages({ page: 1, limit: 100 }).catch((err) => {
          console.error('getMessages error:', err);
          throw err;
        });

        if (isMounted) {
          // Group messages by the other user
          const messageMap = new Map<number, Message[]>();
          messagesRes.data.forEach((msg: Message) => {
            if (msg.senderId === user.id || msg.receiverId === user.id) {
              const otherUserId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
              if (otherUserId !== user.id) { // Prevent self-messaging
                const currentMessages = messageMap.get(otherUserId) || [];
                messageMap.set(otherUserId, [...currentMessages, msg]);
              }
            }
          });

          // Create conversations array
          const convos: Conversation[] = [];
          messageMap.forEach((msgs) => {
            const otherUser = msgs[0].senderId === user.id ? msgs[0].receiver : msgs[0].sender;
            const sortedMessages = msgs.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            convos.push({
              otherUser: {
                id: otherUser.id,
                fname: otherUser.fname,
                lname: otherUser.lname,
                email: otherUser.email,
              },
              latestMessage: sortedMessages[sortedMessages.length - 1].content,
              messages: sortedMessages,
            });
          });

          // Sort conversations by latest message date
          convos.sort((a, b) => {
            const aDate = new Date(a.messages[a.messages.length - 1].createdAt).getTime();
            const bDate = new Date(b.messages[b.messages.length - 1].createdAt).getTime();
            return bDate - aDate;
          });

          setConversations(convos);
          setError('');
        }
      } catch (err: unknown) {
        if (isMounted) {
          let errorMessage = 'Failed to load messages';
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const response = (err as { response?: { data?: { error?: string } } }).response;
            errorMessage = response?.data?.error || errorMessage;
            console.error('API error details:', response?.data);
          }
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, hasRedirected]);

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsConversationDialogOpen(true);
    setNewMessageContent('');
    setMessageError('');
    setMessageSuccess('');
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation) return;
    if (!newMessageContent.trim()) {
      setMessageError('Message cannot be empty');
      return;
    }
    if (newMessageContent.length > 500) {
      setMessageError('Message cannot exceed 500 characters');
      return;
    }
    if (selectedConversation.otherUser.id === user.id) {
      setMessageError('You cannot message yourself');
      return;
    }

    setIsSending(true);
    setMessageError('');
    setMessageSuccess('');

    try {
      const messageData = {
        receiverId: selectedConversation.otherUser.id,
        content: newMessageContent,
      };
      const newMessage = await sendMessage(messageData);
      setMessageSuccess('Message sent successfully!');
      setNewMessageContent('');
      // Update conversation
      setConversations((prev) =>
        prev.map((convo) =>
          convo.otherUser.id === selectedConversation.otherUser.id
            ? {
                ...convo,
                messages: [...convo.messages, newMessage],
                latestMessage: newMessage.content,
              }
            : convo
        )
      );
      setTimeout(() => {
        setMessageSuccess('');
      }, 2000);
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      let errorMessage = 'Failed to send message';
      if (typeof err === 'object' && err !== null && 'response' in err) { 
        const response = (err as { response?: { data?: { error?: string } } }).response;
        errorMessage = response?.data?.error || errorMessage;
      }
      setMessageError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const closeConversationDialog = () => {
    setIsConversationDialogOpen(false);
    setSelectedConversation(null);
    setNewMessageContent('');
    setMessageError('');
    setMessageSuccess('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-off-white-tint flex items-center justify-center text-gray-500">
        <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lato">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Messages, <span className="text-dark-orange">{user ? `${user.name}` : 'User'}</span>
          </h1>
        </div>

        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-68 text-gray-500 bg-white p-8 rounded-xl shadow-sm">
            <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
            <p className="mt-4 text-lg">No messages found</p>
            <p className="text-sm text-gray-400">You haven't started any conversations yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaEnvelope className="mr-2 text-dark-orange" /> Your Conversations
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <div
                  key={conversation.otherUser.id}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {conversation.otherUser.fname} {conversation.otherUser.lname}
                      </h3>
                      <p className="text-sm text-gray-500">{conversation.otherUser.email}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{conversation.latestMessage}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(conversation.messages[conversation.messages.length - 1].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation Dialog */}
        <Transition appear show={isConversationDialogOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeConversationDialog}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    {selectedConversation ? (
                      <>
                        <Dialog.Title as="h3" className="text-2xl font-bold text-gray-800 mb-4">
                          Conversation with {selectedConversation.otherUser.fname} {selectedConversation.otherUser.lname}
                        </Dialog.Title>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {selectedConversation.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs p-3 rounded-lg ${
                                  msg.senderId === user?.id
                                    ? 'bg-dark-orange text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          <textarea
                            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-orange"
                            rows={4}
                            placeholder="Write a message..."
                            value={newMessageContent}
                            onChange={(e) => {
                              setNewMessageContent(e.target.value);
                              setMessageError('');
                              setMessageSuccess('');
                            }}
                            disabled={isSending}
                          />
                          {messageError && (
                            <p className="text-red-500 text-sm mt-1">{messageError}</p>
                          )}
                          {messageSuccess && (
                            <p className="text-green-500 text-sm mt-1">{messageSuccess}</p>
                          )}
                          <button
                            className={`mt-2 px-4 py-2 text-sm font-medium text-white rounded-lg ${
                              isSending
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-dark-orange hover:bg-secondary-orange focus:ring-2 focus:ring-dark-orange'
                            }`}
                            onClick={handleSendMessage}
                            disabled={isSending}
                          >
                            {isSending ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-dark-orange rounded-lg hover:bg-secondary-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dark-orange"
                            onClick={closeConversationDialog}
                          >
                            Close
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No conversation selected</p>
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
};

export default Messages;