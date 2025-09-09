import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface GoogleMapsLocationPickerProps {
  value?: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

// Declare global google types
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

const GoogleMapsLocationPicker: React.FC<GoogleMapsLocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Enter location...",
  label,
  required = false,
  className = '',
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsGoogleMapsLoaded(true);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key not found');
        return;
      }

      window.initGoogleMaps = () => {
        setIsGoogleMapsLoaded(true);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && inputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        fields: ['formatted_address', 'geometry', 'address_components']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const locationData = extractLocationData(place);
          setInputValue(locationData.address);
          onChange(locationData);
          setShowSuggestions(false);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isGoogleMapsLoaded, onChange]);

  // Extract location data from Google Places result
  const extractLocationData = (place: any): LocationData => {
    const addressComponents = place.address_components || [];
    let city = '';
    let state = '';
    let country = '';
    let postalCode = '';

    addressComponents.forEach((component: any) => {
      const types = component.types;
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    return {
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      city,
      state,
      country,
      postalCode
    };
  };

  // Handle manual input and geocoding
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (!newValue.trim()) {
      onChange(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // If Google Maps is loaded, use Places service for suggestions
    if (isGoogleMapsLoaded && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: newValue,
          types: ['geocode']
        },
        (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5));
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: any) => {
    setIsLoading(true);
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    
    service.getDetails(
      {
        placeId: suggestion.place_id,
        fields: ['formatted_address', 'geometry', 'address_components']
      },
      (place: any, status: any) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData = extractLocationData(place);
          setInputValue(locationData.address);
          onChange(locationData);
        }
        setShowSuggestions(false);
      }
    );
  };

  // Handle geocoding for manual input
  const handleGeocodeAddress = useCallback(() => {
    if (!inputValue.trim() || !isGoogleMapsLoaded) return;

    setIsLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: inputValue }, (results: any[], status: any) => {
      setIsLoading(false);
      if (status === 'OK' && results[0]) {
        const locationData = extractLocationData(results[0]);
        setInputValue(locationData.address);
        onChange(locationData);
      }
    });
  }, [inputValue, isGoogleMapsLoaded, onChange]);

  // Handle blur event
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Handle focus event
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value]);

  const inputClasses = `
    w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    transition-all duration-200 bg-white
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="relative">
      {label && (
        <label htmlFor="location-input" className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          id="location-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          
          {!isGoogleMapsLoaded ? (
            <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={!inputValue.trim() || isLoading}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <MapPin className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <MapPin className="w-5 h-5 text-green-500" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">{suggestion.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Location details */}
      {value && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>Lat: {value.lat.toFixed(6)}, Lng: {value.lng.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsLocationPicker;
export type { LocationData };