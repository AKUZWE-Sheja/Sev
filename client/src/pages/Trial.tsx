// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/authUtils';
// import { getListings, getRequests, getMessages, getUsers, getLogs, sendMessage, getUser, updateUserLocation } from '../services/api';
// import ErrorMessage from '../utils/ErrorMsg';
// import { 
//   FaUsers, 
//   FaListAlt, 
//   FaEnvelope, 
//   FaFileAlt, 
//   FaPlus, 
//   FaQuestionCircle,
//   FaMapMarkerAlt 
// } from 'react-icons/fa';
// import { 
//   IoMdCheckmarkCircle, 
//   IoMdCloseCircle, 
//   IoMdTime 
// } from 'react-icons/io';
// import { 
//   GiClothes, 
//   GiSofa 
// } from 'react-icons/gi';
// import { 
//   MdElectricBolt, 
//   MdFastfood, 
//   MdMenuBook, 
//   MdHouse 
// } from 'react-icons/md';
// import Lottie from 'lottie-react';
// import Empty from '../assets/empty.json';
// import NavBar from '../components/Navbar';
// import { Dialog, Transition } from '@headlessui/react';
// import { Fragment } from 'react';
// import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Fix Leaflet marker icons
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

// interface User {
//   id: number;
//   fname: string;
//   lname: string;
//   email: string;
//   role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
//   isVerified: boolean;
//   address: string | null;
//   createdAt: string;
//   location?: { latitude: number; longitude: number } | null;
// }

// interface Listing {
//   id: number;
//   userId: number;
//   title: string;
//   description?: string;
//   category: string;
//   status: 'ACTIVE' | 'CLAIMED' | 'COMPLETED';
//   createdAt: string;
//   location?: { longitude: number; latitude: number } | null;
// }

// interface Request {
//   id: number;
//   userId: number;
//   title: string;
//   description?: string;
//   category: string;
//   status: 'OPEN' | 'FULFILLED' | 'CLOSED';
//   createdAt: string;
//   location?: { longitude: number; latitude: number } | null;
// }

// interface Log {
//   id: number;
//   userId?: number;
//   action: string;
//   createdAt: string;
// }

// interface Stats {
//   users: number;
//   listings: number;
//   requests: number;
//   messages: number;
// }

// const CategoryBar = ({ 
//   categories, 
//   selectedCategory, 
//   onCategoryClick 
// }: { 
//   categories: { name: string; icon: React.ReactElement }[];
//   selectedCategory: string | null;
//   onCategoryClick: (category: string) => void;
// }) => {
//   return (
//     <div className="mb-8">
//       <div className="flex flex-wrap gap-3">
//         {categories.map((category) => (
//           <button
//             key={category.name}
//             onClick={() => onCategoryClick(category.name)}
//             className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
//               selectedCategory === category.name
//                 ? 'bg-dark-orange text-white shadow-md'
//                 : 'bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white hover:border-secondary-orange'
//             }`}
//           >
//             <span className="mr-2 text-lg">{category.icon}</span>
//             <span className="text-sm font-medium capitalize">
//               {category.name.toLowerCase().replace('_', ' ')}
//             </span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// const DistanceBar = ({
//   selectedDistance,
//   onDistanceClick,
//   hasUserLocation,
//   onSetLocationClick,
// }: {
//   selectedDistance: number | null;
//   onDistanceClick: (distance: number | null) => void;
//   hasUserLocation: boolean;
//   onSetLocationClick: () => void;
// }) => {
//   const distances = [5, 10, 25, 50];
//   return (
//     <div className="mb-8">
//       <div className="flex flex-wrap gap-3">
//         <button
//           onClick={() => onDistanceClick(null)}
//           className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
//             selectedDistance === null
//               ? 'bg-dark-orange text-white shadow-md'
//               : 'bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white hover:border-secondary-orange'
//           }`}
//         >
//           <span className="mr-2 text-lg"><FaMapMarkerAlt /></span>
//           <span className="text-sm font-medium">All Distances</span>
//         </button>
//         {hasUserLocation ? (
//           distances.map((distance) => (
//             <button
//               key={distance}
//               onClick={() => onDistanceClick(distance)}
//               className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${
//                 selectedDistance === distance
//                   ? 'bg-dark-orange text-white shadow-md'
//                   : 'bg-white text-gray-700 border border-gray-200 hover:bg-secondary-orange hover:text-white hover:border-secondary-orange'
//               }`}
//             >
//               <span className="mr-2 text-lg"><FaMapMarkerAlt /></span>
//               <span className="text-sm font-medium">Within {distance} km</span>
//             </button>
//           ))
//         ) : (
//           <button
//             onClick={onSetLocationClick}
//             className="flex items-center px-4 py-3 text-sm text-gray-500 hover:text-dark-orange border border-gray-200 rounded-lg transition-all duration-200"
//           >
//             <FaMapMarkerAlt className="mr-2" />
//             Set your location to filter by distance
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// const categories = [
//   { name: 'CLOTHING', icon: <GiClothes /> },
//   { name: 'ELECTRONICS', icon: <MdElectricBolt /> },
//   { name: 'FOOD', icon: <MdFastfood /> },
//   { name: 'FURNITURE', icon: <GiSofa /> },
//   { name: 'BOOKS', icon: <MdMenuBook /> },
//   { name: 'HOUSEHOLD', icon: <MdHouse /> },
//   { name: 'SPECIAL_REQUEST', icon: <FaQuestionCircle /> },
// ];

// const StatusBadge = ({ status }: { status: string }) => {
//   const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
//   switch (status) {
//     case 'ACTIVE':
//     case 'OPEN':
//       return (
//         <span className={`${base} bg-green-100 text-green-800`}>
//           <IoMdCheckmarkCircle className="mr-1" />
//           {status}
//         </span>
//       );
//     case 'CLAIMED':
//     case 'FULFILLED':
//       return (
//         <span className={`${base} bg-amber-100 text-amber-800`}>
//           <IoMdTime className="mr-1" />
//           {status}
//         </span>
//       );
//     case 'COMPLETED':
//     case 'CLOSED':
//       return (
//         <span className={`${base} bg-red-100 text-red-800`}>
//           <IoMdCloseCircle className="mr-1" />
//           {status}
//         </span>
//       );
//     default:
//       return <span className={`${base} bg-gray-100 text-gray-800`}>Unknown</span>;
//   }
// };

// const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
//   useMapEvents({
//     click(e) {
//       onMapClick(e.latlng.lat, e.latlng.lng);
//     },
//   });
//   return null;
// };

// const ItemDialog = ({ 
//   item, 
//   type, 
//   isOpen, 
//   onClose 
// }: { 
//   item: Listing | Request | null; 
//   type: 'listing' | 'request'; 
//   isOpen: boolean; 
//   onClose: () => void;
// }) => {
//   const { user } = useAuth();
//   const [messageContent, setMessageContent] = useState('');
//   const [messageError, setMessageError] = useState('');
//   const [messageSuccess, setMessageSuccess] = useState('');
//   const [isSending, setIsSending] = useState(false);

//   const handleSendMessage = async () => {
//     if (!item || !user) return;
//     if (!messageContent.trim()) {
//       setMessageError('Message cannot be empty');
//       return;
//     }
//     if (messageContent.length > 500) {
//       setMessageError('Message cannot exceed 500 characters');
//       return;
//     }

//     setIsSending(true);
//     setMessageError('');
//     setMessageSuccess('');

//     try {
//       const messageData = {
//         receiverId: item.userId,
//         content: messageContent,
//         ...(type === 'listing' ? { listingId: item.id } : { requestId: item.id }),
//       };
//       await sendMessage(messageData);
//       setMessageSuccess('Message sent successfully!');
//       setMessageContent('');
//       setTimeout(() => {
//         setMessageSuccess('');
//         onClose();
//       }, 2000);
//     } catch (err: unknown) {
//       console.error('Error sending message:', err);
//       let errorMsg = 'Failed to send message';
//       if (typeof err === 'object' && err !== null && 'response' in err) { 
//         const response = (err as { response?: { data?: { error?: string } } }).response;
//         errorMsg = response?.data?.error || errorMsg;
//       }
//       setMessageError(errorMsg);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const canMessage = user && user.id !== item?.userId && (
//     (user.role === 'DONOR' && type === 'request') ||
//     (user.role === 'ACCEPTOR' && type === 'listing') ||
//     (user.role === 'ACCEPTOR' && type === 'request')
//   );

//   const messageContext = item && item.userId === user?.id
//     ? 'yourself'
//     : (type === 'listing' ? 'donor' : 'acceptor');

//   return (
//     <Transition appear show={isOpen} as={Fragment}>
//       <Dialog as="div" className="relative z-50" onClose={onClose}>
//         <Transition.Child
//           as={Fragment}
//           enter="ease-out duration-300"
//           enterFrom="opacity-0"
//           enterTo="opacity-100"
//           leave="ease-in duration-200"
//           leaveFrom="opacity-100"
//           leaveTo="opacity-0"
//         >
//           <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
//         </Transition.Child>

//         <div className="fixed inset-0 overflow-y-auto">
//           <div className="flex min-h-full items-center justify-center p-4">
//             <Transition.Child
//               as={Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 scale-95"
//               enterTo="opacity-100 scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 scale-100"
//               leaveTo="opacity-0 scale-95"
//             >
//               <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
//                 {item ? (
//                   <>
//                     <Dialog.Title as="h3" className="text-2xl font-bold text-gray-800 mb-4">
//                       {item.title}
//                     </Dialog.Title>
//                     <div className="space-y-4">
//                       <p className="text-gray-600">
//                         <strong>Category:</strong> {item.category.replace('_', ' ')}
//                       </p>
//                       <p className="text-gray-600">
//                         <strong>Status:</strong> <StatusBadge status={item.status} />
//                       </p>
//                       <p className="text-gray-600">
//                         <strong>Description:</strong> {item.description || 'No description provided'}
//                       </p>
//                       <p className="text-gray-600">
//                         <strong>{type === 'listing' ? 'Posted' : 'Requested'}:</strong> {new Date(item.createdAt).toLocaleDateString()}
//                       </p>
//                       {item.location && (
//                         <p className="text-gray-600">
//                           <strong>Location:</strong> ({item.location.latitude}, {item.location.longitude})
//                         </p>
//                       )}
//                       {canMessage && (
//                         <div className="mt-4">
//                           <textarea
//                             className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-orange"
//                             rows={4}
//                             placeholder={`Write a message to the ${messageContext}...`}
//                             value={messageContent}
//                             onChange={(e) => {
//                               setMessageContent(e.target.value);
//                               setMessageError('');
//                               setMessageSuccess('');
//                             }}
//                             disabled={isSending}
//                           />
//                           {messageError && (
//                             <p className="text-red-500 text-sm mt-1">{messageError}</p>
//                           )}
//                           {messageSuccess && (
//                             <p className="text-green-500 text-sm mt-1">{messageSuccess}</p>
//                           )}
//                           <button
//                             className={`mt-2 px-4 py-2 text-sm font-medium text-white rounded-lg ${
//                               isSending
//                                 ? 'bg-gray-400 cursor-not-allowed'
//                                 : 'bg-dark-orange hover:bg-secondary-orange focus:ring-2 focus:ring-dark-orange'
//                             }`}
//                             onClick={handleSendMessage}
//                             disabled={isSending}
//                           >
//                             {isSending ? 'Sending...' : `Message ${messageContext.charAt(0).toUpperCase() + messageContext.slice(1)}`}
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                     <div className="mt-6 flex justify-end">
//                       <button
//                         type="button"
//                         className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-dark-orange rounded-lg hover:bg-secondary-orange focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dark-orange"
//                         onClick={onClose}
//                       >
//                         Close
//                       </button>
//                     </div>
//                   </>
//                 ) : (
//                   <p className="text-gray-500">No item selected</p>
//                 )}
//               </Dialog.Panel>
//             </Transition.Child>
//           </div>
//         </div>
//       </Dialog>
//     </Transition>
//   );
// };

// // Haversine formula to calculate distance between two points in kilometers
// const getDistance = (
//   lat1: number,
//   lon1: number,
//   lat2: number,
//   lon2: number
// ): number => {
//   const R = 6371; // Earth's radius in kilometers
//   const dLat = (lat2 - lat1) * Math.PI / 180;
//   const dLon = (lon2 - lon1) * Math.PI / 180;
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
//     Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// };

// const Dashboard = () => {
//   const { user, loading: authLoading, setUser } = useAuth();
//   const [stats, setStats] = useState<Stats>({ users: 0, listings: 0, requests: 0, messages: 0 });
//   const [recentLogs, setRecentLogs] = useState<Log[]>([]);
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [requests, setRequests] = useState<Request[]>([]);
//   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
//   const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [errors, setErrors] = useState<{ api?: string; location?: string }>({ api: '' });
//   const [hasRedirected, setHasRedirected] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<Listing | Request | null>(null);
//   const [dialogType, setDialogType] = useState<'listing' | 'request'>('listing');
//   const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
//   const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
//   const [isGettingLocation, setIsGettingLocation] = useState(false);

//   const mapContainerStyle = {
//     height: '400px',
//     width: '100%',
//   };

//   const defaultCenter: [number, number] = [-1.9441, 30.0619]; // Kigali, Rwanda

//   useEffect(() => {
//     if (!authLoading && !user && !hasRedirected) {
//       console.log('Redirecting to /login: No user authenticated');
//       setHasRedirected(true);
//       window.location.href = '/login';
//       return;
//     }
    
//     if (authLoading || !user) return;

//     let isMounted = true;

//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         if (user.role === 'ADMIN') {
//           const [usersRes, listingsRes, requestsRes, messagesRes, logsRes] = await Promise.all([
//             getUsers({ page: 1, limit: 1 }).catch((err) => {
//               console.error('getUsers error:', err);
//               throw err;
//             }),
//             getListings({ page: 1, limit: 1 }).catch((err) => {
//               console.error('getListings error:', err);
//               throw err;
//             }),
//             getRequests({ page: 1, limit: 1 }).catch((err) => {
//               console.error('getRequests error:', err);
//               throw err;
//             }),
//             getMessages({ page: 1, limit: 1 }).catch((err) => {
//               console.error('getMessages error:', err);
//               throw err;
//             }),
//             getLogs({ page: 1, limit: 5 }).catch((err) => {
//               console.error('getLogs error:', err);
//               throw err;
//             }),
//           ]);

//           if (isMounted) {
//             setStats({
//               users: usersRes?.meta?.totalItems || 0,
//               listings: listingsRes?.meta?.totalItems || 0,
//               requests: requestsRes?.meta?.totalItems || 0,
//               messages: messagesRes?.meta?.totalItems || 0,
//             });
//             setRecentLogs(logsRes.data || []);
//           }
//         }

//         const listingsRes = await getListings({ page: 1, limit: 10, category: selectedCategory ?? undefined }).catch((err) => {
//           console.error('getListings error:', err);
//           throw err;
//         });
//         const requestsRes = await getRequests({ page: 1, limit: 10, category: selectedCategory ?? undefined }).catch((err) => {
//           console.error('getRequests error:', err);
//           throw err;
//         });

//         if (isMounted) {
//           setListings(listingsRes.data || []);
//           setRequests(requestsRes.data || []);
//           setErrors({ api: '' });
//         }
//       } catch (err: unknown) {
//         if (isMounted) {
//           let errorMessage = 'Failed to load dashboard data';
//           if (typeof err === 'object' && err !== null && 'response' in err) {
//             const response = (err as { response?: { data?: { error?: string } } }).response;
//             errorMessage = response?.data?.error || errorMessage;
//             console.error('API error details:', response?.data);
//           }
//           setErrors({ api: errorMessage });
//         }
//       } finally {
//         if (isMounted) {
//           setIsLoading(false);
//         }
//       }
//     };

//     fetchData();

//     return () => {
//       isMounted = false;
//     };
//   }, [user, authLoading, selectedCategory, hasRedirected]);

//   const handleCategoryClick = (category: string) => {
//     setSelectedCategory(category === selectedCategory ? null : category);
//   };

//   const handleDistanceClick = (distance: number | null) => {
//     setSelectedDistance(distance);
//   };

//   const handleListingClick = (listing: Listing) => {
//     console.log('Opening dialog for listing:', listing.id, 'User:', user);
//     setSelectedItem(listing);
//     setDialogType('listing');
//     setDialogOpen(true);
//   };

//   const handleRequestClick = (request: Request) => {
//     console.log('Opening dialog for request:', request.id, 'User:', user);
//     setSelectedItem(request);
//     setDialogType('request');
//     setDialogOpen(true);
//   };

//   const closeDialog = () => {
//     setDialogOpen(false);
//     setSelectedItem(null);
//   };

//   const getCurrentLocation = () => {
//     setIsGettingLocation(true);
//     if (!navigator.geolocation) {
//       setErrors((prev) => ({ ...prev, location: 'Geolocation is not supported by your browser' }));
//       setIsGettingLocation(false);
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
//         setSelectedLocation({ lat: latitude, lng: longitude });
//         setIsGettingLocation(false);
//         setErrors((prev) => ({ ...prev, location: undefined }));
//       },
//       (error) => {
//         console.error('Geolocation error:', error);
//         setErrors((prev) => ({
//           ...prev,
//           location: 'Unable to get your location. Please allow location access or click on the map.',
//         }));
//         setIsGettingLocation(false);
//       },
//       { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//     );
//   };

//   const handleMapClick = (lat: number, lng: number) => {
//     setSelectedLocation({ lat, lng });
//     setErrors((prev) => ({ ...prev, location: undefined }));
//   };

//   const handleLocationSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!selectedLocation) {
//       setErrors((prev) => ({ ...prev, location: 'Please select a location on the map or use your current location' }));
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await updateUserLocation({ longitude: selectedLocation.lng, latitude: selectedLocation.lat });
//       const updatedUser = await getUser();
//       setUser({
//         ...updatedUser,
//         location: updatedUser.location
//           ? { latitude: updatedUser.location.latitude, longitude: updatedUser.location.longitude }
//           : null,
//       });
//       setIsLocationModalOpen(false);
//       setSelectedLocation(null);
//       setErrors((prev) => ({ ...prev, location: undefined }));
//     } catch (err: unknown) {
//       let errorMessage = 'Failed to update location';
//       if (typeof err === 'object' && err !== null && 'response' in err) {
//         const response = (err as { response?: { data?: { error?: string } } }).response;
//         errorMessage = response?.data?.error || errorMessage;
//       }
//       setErrors((prev) => ({ ...prev, location: errorMessage }));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredListings = listings
//     .filter((l) => !selectedCategory || l.category === selectedCategory)
//     .filter((l) => {
//       if (!selectedDistance || !user?.location || !l.location) return true;
//       const distance = getDistance(
//         user.location.latitude,
//         user.location.longitude,
//         l.location.latitude,
//         l.location.longitude
//       );
//       return distance <= selectedDistance;
//     });

//   const filteredRequests = requests
//     .filter((r) => !selectedCategory || r.category === selectedCategory)
//     .filter((r) => {
//       if (!selectedDistance || !user?.location || !r.location) return true;
//       const distance = getDistance(
//         user.location.latitude,
//         user.location.longitude,
//         r.location.latitude,
//         r.location.longitude
//       );
//       return distance <= selectedDistance;
//     });

//   if (authLoading) {
//     return (
//       <div className="min-h-screen bg-off-white-tint flex items-center justify-center text-gray-500">
//         <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
//         <p className="mt-4 text-lg">Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 font-lato">
//       <NavBar />
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="flex justify-between items-center mb-8">
//           <h1 className="text-3xl font-bold text-gray-800">
//             Welcome back, <span className="text-dark-orange">{user ? `${user.fname} ${user.lname}` : 'User'}</span>!
//           </h1>
//           {user && user.role === 'ACCEPTOR' && (
//             <Link
//               to="/create-request"
//               className="inline-flex items-center px-4 py-2 bg-dark-orange text-white rounded-lg hover:bg-secondary-orange font-medium transition-colors shadow-md hover:shadow-lg"
//             >
//               <FaPlus className="mr-2" />
//               Create Request
//             </Link>
//           )}
//         </div>

//         <CategoryBar 
//           categories={categories} 
//           selectedCategory={selectedCategory} 
//           onCategoryClick={handleCategoryClick} 
//         />

//         <DistanceBar
//           selectedDistance={selectedDistance}
//           onDistanceClick={handleDistanceClick}
//           hasUserLocation={!!user?.location}
//           onSetLocationClick={() => setIsLocationModalOpen(true)}
//         />

//         {errors.api && <ErrorMessage message={errors.api} />}
//         {errors.location && <ErrorMessage message={errors.location} />}

//         <ItemDialog 
//           item={selectedItem} 
//           type={dialogType} 
//           isOpen={dialogOpen} 
//           onClose={closeDialog} 
//         />

//         {isLocationModalOpen && (
//           <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//               <h3 className="text-xl font-bold text-dark-orange mb-4">Set Your Location</h3>
//               <form onSubmit={handleLocationSubmit} className="space-y-4">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-4">
//                     Click on the map to select your location or use your current location:
//                   </p>
//                   <button
//                     type="button"
//                     onClick={getCurrentLocation}
//                     disabled={isGettingLocation}
//                     className="flex items-center px-4 py-2 bg-dark-orange text-white rounded-lg hover:bg-secondary-orange transition-colors disabled:opacity-50 mb-4"
//                   >
//                     <FaMapMarkerAlt className="mr-2" />
//                     {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
//                   </button>
//                   <div className="border border-gray-200 rounded-lg overflow-hidden">
//                     <MapContainer
//                       center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
//                       zoom={13}
//                       style={mapContainerStyle}
//                     >
//                       <TileLayer
//                         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                       />
//                       <MapClickHandler onMapClick={handleMapClick} />
//                       {selectedLocation && (
//                         <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
//                       )}
//                     </MapContainer>
//                   </div>
//                 </div>
//                 {selectedLocation && (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div>
//                       <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
//                         Latitude
//                       </label>
//                       <input
//                         id="latitude"
//                         type="text"
//                         value={selectedLocation.lat.toFixed(6)}
//                         readOnly
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
//                         Longitude
//                       </label>
//                       <input
//                         id="longitude"
//                         type="text"
//                         value={selectedLocation.lng.toFixed(6)}
//                         readOnly
//                         className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
//                       />
//                     </div>
//                   </div>
//                 )}
//                 {errors.location && <ErrorMessage message={errors.location} />}
//                 <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsLocationModalOpen(false);
//                       setSelectedLocation(null);
//                       setErrors((prev) => ({ ...prev, location: undefined }));
//                     }}
//                     className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={!selectedLocation}
//                     className="px-4 py-2 bg-dark-orange text-white rounded-lg hover:bg-secondary-orange transition-colors disabled:opacity-50"
//                   >
//                     Save Location
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
//           </div>
//         ) : filteredListings.length === 0 && filteredRequests.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-68 text-gray-500 bg-white p-8 rounded-xl shadow-sm">
//             <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
//             <p className="mt-4 text-lg">No listings or requests found</p>
//             <p className="text-sm text-gray-400">
//               {selectedCategory || selectedDistance
//                 ? `for ${selectedCategory ? selectedCategory.toLowerCase().replace('_', ' ') : ''}${
//                     selectedCategory && selectedDistance ? ' and ' : ''
//                   }${selectedDistance ? `within ${selectedDistance} km` : ''}`
//                 : 'Try selecting a different category or distance'}
//             </p>
//           </div>
//         ) : (
//           <>
//             <div className="mb-8">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-2xl font-bold text-gray-800">Available Listings</h2>
//                 <span className="text-sm text-gray-500">
//                   {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
//                 </span>
//               </div>
//               {filteredListings.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {filteredListings.map((listing) => (
//                     <div 
//                       key={listing.id} 
//                       className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
//                       onClick={() => handleListingClick(listing)}
//                     >
//                       <div className="p-5">
//                         <h3 className="font-semibold text-lg text-gray-800 mb-2">{listing.title}</h3>
//                         <div className="flex items-center justify-between mb-3">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                             {listing.category.replace('_', ' ')}
//                           </span>
//                           <StatusBadge status={listing.status} />
//                         </div>
//                         {listing.description && (
//                           <p className="text-gray-600 text-sm mt-3 line-clamp-2">
//                             {listing.description}
//                           </p>
//                         )}
//                         <div className="mt-4 text-xs text-gray-500">
//                           Posted {new Date(listing.createdAt).toLocaleDateString()}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="bg-white p-8 rounded-xl text-center shadow-sm">
//                   <p className="text-gray-500">No listings available in this category.</p>
//                 </div>
//               )}
//             </div>

//             <div className="mb-8">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-2xl font-bold text-gray-800">Community Requests</h2>
//                 <span className="text-sm text-gray-500">
//                   {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
//                 </span>
//               </div>
//               {filteredRequests.length > 0 ? (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {filteredRequests.map((request) => (
//                     <div 
//                       key={request.id} 
//                       className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
//                       onClick={() => handleRequestClick(request)}
//                     >
//                       <div className="p-5">
//                         <h3 className="font-semibold text-lg text-gray-800 mb-2">{request.title}</h3>
//                         <div className="flex items-center justify-between mb-3">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                             {request.category.replace('_', ' ')}
//                           </span>
//                           <StatusBadge status={request.status} />
//                         </div>
//                         {request.description && (
//                           <p className="text-gray-600 text-sm mt-3 line-clamp-2">
//                             {request.description}
//                           </p>
//                         )}
//                         <div className="mt-4 text-xs text-gray-500">
//                           Requested {new Date(request.createdAt).toLocaleDateString()}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="bg-white p-8 rounded-xl text-center shadow-sm">
//                   <p className="text-gray-500">No requests available in this category.</p>
//                 </div>
//               )}
//             </div>

//             {user && user.role === 'ADMIN' && (
//               <>
//                 <div className="mb-8 pt-6 border-t border-gray-200">
//                   <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h2>
//                   <p className="text-gray-500">Overview of the Community Resource Tracker</p>
//                 </div>

//                 <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
//                   {[
//                     { label: 'Total Users', value: stats.users, icon: <FaUsers className="text-green-500" />, color: 'green' },
//                     { label: 'Listings', value: stats.listings, icon: <FaListAlt className="text-blue-500" />, color: 'blue' },
//                     { label: 'Requests', value: stats.requests, icon: <FaListAlt className="text-amber-500" />, color: 'amber' },
//                     { label: 'Messages', value: stats.messages, icon: <FaEnvelope className="text-purple-500" />, color: 'purple' },
//                   ].map((stat) => (
//                     <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
//                       <div className="p-5 flex items-center">
//                         <div className={`flex-shrink-0 p-3 rounded-lg bg-${stat.color}-100`}>
//                           <div className={`text-${stat.color}-500 text-xl`}>
//                             {stat.icon}
//                           </div>
//                         </div>
//                         <div className="ml-4">
//                           <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
//                           <dd className="text-2xl font-semibold text-gray-900">{stat.value}</dd>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
//                   <div className="px-5 py-4 border-b border-gray-100">
//                     <h2 className="text-lg font-semibold text-gray-800 flex items-center">
//                       <FaFileAlt className="mr-2 text-green-500" /> Recent Activity
//                     </h2>
//                   </div>
//                   {recentLogs.length === 0 ? (
//                     <div className="px-4 py-12 text-center text-gray-500">No recent activity found</div>
//                   ) : (
//                     <div className="overflow-x-auto">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
//                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {recentLogs.map((log) => (
//                             <tr key={log.id} className="hover:bg-gray-50">
//                               <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
//                               <td className="px-6 py-4 text-sm text-gray-500">{log.userId || 'N/A'}</td>
//                               <td className="px-6 py-4 text-sm text-gray-500">
//                                 {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'N/A'}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;