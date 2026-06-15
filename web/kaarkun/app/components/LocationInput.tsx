'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api';
import { MapPin, Locate, Loader2, X, Info } from 'lucide-react';

interface LocationPrediction {
  description: string;
  place_id: string;
  lat: string;
  lng: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function LocationInput({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = 'Search for a location...',
  required = false,
  className = '',
}: LocationInputProps) {
  const [predictions, setPredictions] = useState<LocationPrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showApproxNote, setShowApproxNote] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.get(`/geocode/autocomplete?input=${encodeURIComponent(input)}`);
      if (Array.isArray(data)) {
        setPredictions(data);
        setShowDropdown(data.length > 0);
      }
    } catch (err) {
      console.error('Location autocomplete error:', err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setShowApproxNote(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 350);
  };

  const handleSelectPrediction = (pred: LocationPrediction) => {
    onChange(pred.description);
    if (onCoordinatesChange && pred.lat && pred.lng) {
      onCoordinatesChange(parseFloat(pred.lat), parseFloat(pred.lng));
    }
    setShowDropdown(false);
    setShowApproxNote(false);
    setPredictions([]);
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setShowApproxNote(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Save coordinates immediately
        if (onCoordinatesChange) {
          onCoordinatesChange(latitude, longitude);
        }

        let resolvedAddress: string | null = null;

        // Try 1: Backend reverse geocode proxy
        try {
          const data = await api.get(`/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          if (data?.display_name) {
            resolvedAddress = data.display_name;
          }
        } catch (_) {
          // Backend failed — try direct Nominatim fallback
        }

        // Try 2: Direct Nominatim call from browser
        if (!resolvedAddress) {
          try {
            const resp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=18`,
              { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }
            );
            const json = await resp.json();
            if (json?.display_name) {
              resolvedAddress = json.display_name;
            }
          } catch (_) {
            // Both failed
          }
        }

        if (resolvedAddress) {
          onChange(resolvedAddress);
          // Show refinement note and auto-open autocomplete for nearby suggestions
          setShowApproxNote(true);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            fetchPredictions(resolvedAddress!);
          }, 400);
        } else {
          onChange(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }

        setGeoLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please allow location access in your browser.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleClear = () => {
    onChange('');
    setPredictions([]);
    setShowDropdown(false);
    setShowApproxNote(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
          <MapPin size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          required={required}
          placeholder={placeholder}
          className={`block w-full pl-9 pr-20 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all ${className}`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          {loading && (
            <Loader2 size={14} className="text-zinc-400 animate-spin" />
          )}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            title="Detect my current location"
            className="p-1.5 text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all disabled:opacity-50"
          >
            {geoLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Locate size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Desktop accuracy note */}
      {showApproxNote && !showDropdown && (
        <div className="mt-1.5 flex items-start gap-1.5 px-1 text-[11px] text-amber-600 dark:text-amber-400">
          <Info size={11} className="shrink-0 mt-0.5" />
          <span>
            Location may be approximate on desktop. Type to search and select a precise address from the list.
          </span>
        </div>
      )}

      {/* Predictions Dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {predictions.map((pred, idx) => (
            <button
              key={pred.place_id || idx}
              type="button"
              onClick={() => handleSelectPrediction(pred)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
            >
              <MapPin size={14} className="text-indigo-500 shrink-0 mt-0.5" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug line-clamp-2">
                {pred.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
