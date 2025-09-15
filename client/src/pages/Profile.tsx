import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authUtils';
import { getUser, updateUserLocation, getListings, getRequests } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import ErrorMessage from '../utils/ErrorMsg';
import NavBar from '../components/Navbar';
import Lottie from 'lottie-react';
import Empty from '../assets/empty.json';
import { FaUserCircle, FaHome, FaDonate, FaHandHoldingHeart, FaMapMarkerAlt } from 'react-icons/fa';
import { IoMdCheckmarkCircle, IoMdCloseCircle, IoMdTime } from 'react-icons/io';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FaLocationPin } from 'react-icons/fa6';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  role: 'DONOR' | 'ACCEPTOR' | 'ADMIN';
  isVerified: boolean;
  address: string | null;
  createdAt: string;
  location?: { lat: number; lng: number } | null;
}

interface Listing {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: string;
  status: 'ACTIVE' | 'CLAIMED' | 'COMPLETED';
  createdAt: string;
}

interface Request {
  id: number;
  userId: number;
  title: string;
  description?: string;
  category: string;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  createdAt: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  switch (status) {
    case 'ACTIVE':
    case 'OPEN':
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          <IoMdCheckmarkCircle className="mr-1" />
          {status}
        </span>
      );
    case 'CLAIMED':
    case 'FULFILLED':
      return (
        <span className={`${base} bg-amber-100 text-amber-800`}>
          <IoMdTime className="mr-1" />
          {status}
        </span>
      );
    case 'COMPLETED':
    case 'CLOSED':
      return (
        <span className={`${base} bg-red-100 text-red-800`}>
          <IoMdCloseCircle className="mr-1" />
          {status}
        </span>
      );
    default:
      return <span className={`${base} bg-gray-100 text-gray-800`}>Unknown</span>;
  }
};

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name || null;
  } catch {
    return null;
  }
}

const Profile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ api?: string; location?: string }>({});
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);

  const mapContainerStyle = {
    height: '400px',
    width: '100%',
  };

  const defaultCenter: [number, number] = [-1.9441, 30.0619]; // Kigali, Rwanda

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let isMounted = true;

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [userData, listingsData, requestsData] = await Promise.all([
          getUser(),
          getListings({ userId: user.id, page: 1, limit: 10 }),
          user.role === 'ACCEPTOR' ? getRequests({ userId: user.id, page: 1, limit: 10 }) : Promise.resolve({ data: [] }),
        ]);

        // Map backend location { longitude, latitude } to frontend { lat, lng }
        let mappedLocation: { lat: number; lng: number } | null = null;
        if (userData.location && typeof userData.location.longitude === 'number' && typeof userData.location.latitude === 'number') {
          mappedLocation = {
            lat: userData.location.latitude,
            lng: userData.location.longitude,
          };
        }

        if (isMounted) {
          setProfile({ ...userData, location: mappedLocation, createdAt: typeof userData.createdAt === 'string' ? userData.createdAt : userData.createdAt.toISOString() });
          setListings(listingsData.data || []);
          setRequests(requestsData.data || []);
          setErrors({ api: '' });
        }
      } catch (err: unknown) {
        if (isMounted) {
          let errorMessage = 'Failed to load profile data';
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const response = (err as { response?: { data?: { error?: string } } }).response;
            errorMessage = response?.data?.error || errorMessage;
          }
          setErrors({ api: errorMessage });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.location) {
      reverseGeocode(profile.location.lat, profile.location.lng).then(setPlaceName);
    } else {
      setPlaceName(null);
    }
  }, [profile?.location]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Geolocation is not supported by your browser' }));
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
        setIsGettingLocation(false);
        setErrors((prev) => ({ ...prev, location: undefined }));
      },
      (error) => {
        console.error('Geolocation error:', error);
        setErrors((prev) => ({
          ...prev,
          location: 'Unable to get your location. Please allow location access or click on the map.',
        }));
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setErrors((prev) => ({ ...prev, location: undefined }));
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setErrors((prev) => ({ ...prev, location: 'Please select a location on the map or use your current location' }));
      return;
    }

    setIsLoading(true);
    try {
      await updateUserLocation({ longitude: selectedLocation.lng, latitude: selectedLocation.lat });
      const updatedUser = await getUser();
      // Map backend location to frontend format
      let mappedLocation: { lat: number; lng: number } | null = null;
      if (updatedUser.location && typeof updatedUser.location.longitude === 'number' && typeof updatedUser.location.latitude === 'number') {
        mappedLocation = {
          lat: updatedUser.location.latitude,
          lng: updatedUser.location.longitude,
        };
      }
      setProfile({
        ...updatedUser,
        location: mappedLocation,
        createdAt: typeof updatedUser.createdAt === 'string'
          ? updatedUser.createdAt
          : updatedUser.createdAt.toISOString(),
      });
      setIsLocationModalOpen(false);
      setSelectedLocation(null);
      setErrors((prev) => ({ ...prev, location: undefined }));
    } catch (err: unknown) {
      let errorMessage = 'Failed to update location';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        errorMessage = response?.data?.error || errorMessage;
      }
      setErrors((prev) => ({
        ...prev,
        location: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
    
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-off-white-tint flex items-center justify-center text-gray-500">
        <Lottie animationData={Empty} loop={true} className="w-48 h-48" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-lato">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div>
              <FaUserCircle className="w-32 h-32 text-gray-300" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800">
                {profile.fname} {profile.lname}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Member Since: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
              
              {/* Address Section */}
              <div className="mt-4 flex items-center justify-center md:justify-start">
                <FaHome className="text-primary-orange mr-2" />
                <span className="text-gray-600">{profile.address || 'No address provided'}</span>
              </div>
              
              {/* Location Section - Improved layout */}
              <div className="mt-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center">
                    <FaLocationPin className="text-primary-orange mr-2" />
                    <span className="text-gray-600">
                      {profile.location 
                        ? (placeName || `${profile.location.lat.toFixed(5)}, ${profile.location.lng.toFixed(5)}`)
                        : 'You haven\'t set your location'
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => setIsLocationModalOpen(true)}
                    className="text-primary-orange hover:text-secondary-orange font-medium flex items-center text-sm mt-1 sm:mt-0 sm:ml-4"
                  >
                    {profile.location ? 'Edit Location' : 'Add Location'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
            <div className="bg-primary-orange/10 p-3 rounded-full mr-4">
              <FaDonate className="text-primary-orange text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Donations</p>
              <p className="text-2xl font-semibold text-gray-900">{listings.length}</p>
            </div>
          </div>
          {profile.role === 'ACCEPTOR' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
              <div className="bg-primary-orange/10 p-3 rounded-full mr-4">
                <FaHandHoldingHeart className="text-primary-orange text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
              </div>
            </div>
          )}
        </div>

        {errors.api && <ErrorMessage message={errors.api} />}

        {/* Donations Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Your Donations</h2>
            {listings.length > 0 && (
              <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {listings.length} items
              </span>
            )}
          </div>
          {listings.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-100">
              <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
                <FaDonate className="w-full h-full" />
              </div>
              <p className="text-gray-500 mb-2">No donations yet</p>
              <p className="text-sm text-gray-400">Your donation listings will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="p-5">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1">{listing.title}</h3>
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {listing.category.replace('_', ' ').toLowerCase()}
                      </span>
                      <StatusBadge status={listing.status} />
                    </div>
                    {listing.description && (
                      <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>
                    )}
                    <div className="mt-4 text-xs text-gray-500">
                      Posted {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests Section (for Acceptors) */}
        {profile.role === 'ACCEPTOR' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Your Collections</h2>
              {requests.length > 0 && (
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {requests.length} items
                </span>
              )}
            </div>
            {requests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-gray-100">
                <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
                  <FaHandHoldingHeart className="w-full h-full" />
                </div>
                <p className="text-gray-500 mb-2">No collections yet</p>
                <p className="text-sm text-gray-400">Your collection requests will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1">{request.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                          {request.category.replace('_', ' ').toLowerCase()}
                        </span>
                        <StatusBadge status={request.status} />
                      </div>
                      {request.description && (
                        <p className="text-gray-600 text-sm mt-3 line-clamp-2">{request.description}</p>
                      )}
                      <div className="mt-4 text-xs text-gray-500">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Location Modal */}
        {isLocationModalOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-dark-orange mb-4">Set Your Location</h3>
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Click on the map to select your location or use your current location:
                  </p>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex items-center px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-secondary-orange transition-colors disabled:opacity-50 mb-4"
                  >
                    <FaMapMarkerAlt className="mr-2" />
                    {isGettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                  </button>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <MapContainer
                      center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
                      zoom={13}
                      style={mapContainerStyle}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <MapClickHandler onMapClick={handleMapClick} />
                      {selectedLocation && (
                        <Marker position={[selectedLocation.lat, selectedLocation.lng]} />
                      )}
                    </MapContainer>
                  </div>
                </div>
                {selectedLocation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        id="latitude"
                        type="text"
                        value={selectedLocation.lat.toFixed(6)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        id="longitude"
                        type="text"
                        value={selectedLocation.lng.toFixed(6)}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
                {errors.location && <ErrorMessage message={errors.location} />}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocationModalOpen(false);
                      setSelectedLocation(null);
                      setErrors((prev) => ({ ...prev, location: undefined }));
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedLocation}
                    className="px-4 py-2 bg-dark-orange text-white rounded-lg hover:bg-secondary-orange transition-colors disabled:opacity-50"
                  >
                    Save Location
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;