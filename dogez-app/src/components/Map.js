import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAccount, useBalance, useContractWrite } from 'wagmi';
import Web3 from 'web3';
import { treatzABI, treatzAddress } from '../contracts/treatz';

export default function Map() {
  const mapRef = useRef(null); // the DOM ref
  const mapInstanceRef = useRef(null); // the leaftlet map object rep
  const currentMarkerRef = useRef(null);
  const { address } = useAccount(); //  called destructuring in JS
  const userAddress = address; // for readability
  let userMarker = null;

  const { data: balance } = useBalance({
    address: userAddress,
    token: treatzAddress,
  });

  const { write,  } = useContractWrite({
    address: treatzAddress,
    abi: treatzABI,
    functionName: 'transfer',
    onSuccess: onSuccessTransaction,
  });

  async function getPointsWithinBounds(bounds) {
    const response = await fetch(
      '/api/get-points?bounds=' + encodeURIComponent(JSON.stringify(bounds))
    );
    return response.json();
  }

  async function getPointCost(id) {
    try {
      const response = await fetch(`/api/get-point-cost?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        return data.cost;
      } else {
        throw new Error('Error fetching point cost');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  function onMarkerClick(event) {
    const marker = event.target;
    getPointCost(marker.id)
    .then((cost) => {
      let imageUrl;
      let buttonText;
      if (marker.marker_type === 'chest') {
        imageUrl = 'images/loot_chest.png';
        buttonText = 'Reveal!';
      } else if (marker.marker_type === 'doge') {
        imageUrl = `images/doge_black.png`;
        buttonText = 'Catch!';
      } else {
        console.error(`Unknown marker type: ${marker.marker_type}`);
        return;
      }
  
      const popupContent = `
        <div>
          <img src="${imageUrl}" alt="Doge Icon" width="50" height="50">
          <p class="cost">Cost: ${cost}</p>
          <button id="revealButton" data-cost="${cost}" data-id="${marker.id}" class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">${buttonText}</button>
        </div>
      `;
      marker.bindPopup(popupContent).openPopup();
    })
    .catch((error) => {
      console.error('Error retrieving cost from the database:', error);
    });
  } 

  async function onSuccessTransaction(data) {
    console.log('Transaction successful:', data);
  
    const imageUrlResponse = await fetch(`/api/get-point-image?id=${currentMarkerRef.current.id}`);
    const imageUrlData = await imageUrlResponse.json();
    const imageUrl = imageUrlData.data.image_url;
  
    // Get the token ID based on the doge_type or cosmetic_id from the points table and the name from the tokens table
    let tokenIdResponse;
    if (currentMarkerRef.current.marker_type === 'doge') {
      tokenIdResponse = await fetch(`/api/get-token-id?doge_type=${currentMarkerRef.current.doge_type}`);
    } else if (currentMarkerRef.current.marker_type === 'chest') {
      tokenIdResponse = await fetch(`/api/get-token-id?cosmetic_type=${currentMarkerRef.current.cosmetic_type}`);
    } else {
      console.error(`Unknown marker type: ${currentMarkerRef.current.marker_type}`);
      return;
    }
    const tokenIdData = await tokenIdResponse.json();
    const tokenId = tokenIdData.data.token_id;
    const markerId = currentMarkerRef.current.id;
  
    // Use the mint function of your ERC1155 contract to mint a token of the specific ID for the user
    const response = await fetch(`/api/mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress, tokenId, imageUrl, markerId }), // Pass the specific token ID here
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }
  
    const responseData = await response.json();
    console.log(responseData);
  
    // Tokens transferred successfully, now reveal the original image
    const img = document.querySelector('.leaflet-popup-content img');
    img.src = imageUrl;
  
    const costElement = document.querySelector('.leaflet-popup-content .cost');
    costElement.remove();
  
    // Display a congratulations message
    const message = document.createElement('p');
    if (currentMarkerRef.current.marker_type === 'doge') {
      message.innerText = `Caught ${currentMarkerRef.current.doge_type}!`;
    } else if (currentMarkerRef.current.marker_type === 'chest') {
      message.innerText = `Collected ${currentMarkerRef.current.cosmetic_type}!`;
    }
    document.querySelector('.leaflet-popup-content').appendChild(message);
  
    const catchButton = document.getElementById('revealButton');
    catchButton.remove();
  
    mapInstanceRef.current.once('popupclose', function () {
      currentMarkerRef.current.remove(); // Remove the marker
    });
  }

  // Function to initialize the map with given coordinates
  const initializeMap = (userLat, userLong) => {
    if (!mapInstanceRef.current) {

      const mapOptions = {
        // bounce the user back if they try to scroll outside
        maxBounds: [
          [-90, -180],
          [90, 180],
        ],
        worldCopyJump: true, // jump back to the same map copy
        maxBoundsViscosity: 1.0, // hard edge to maxBounds
        minZoom: 6,
        maxZoom: 18
      }

      mapInstanceRef.current = L.map(mapRef.current, mapOptions).setView([userLat, userLong], 18);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
      
      const userMarkerIcon = L.icon({
        iconUrl: '/images/leaflet/marker-icon.png',
        iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
        shadowUrl: '/images/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
        shadowSize: [41, 41], // size of the shadow
        shadowAnchor: [13, 41], // the same for the shadow
        popupAnchor: [1, -34], // point of the icon which will correspond to marker's location
      });

      userMarker = L.marker([userLat, userLong], { icon: userMarkerIcon }).addTo(mapInstanceRef.current);

      const markersLayer = L.layerGroup().addTo(mapInstanceRef.current);

      mapInstanceRef.current.on('moveend', async function () {
        // Clear all markers from the previous view
        markersLayer.clearLayers();
        // Get the current map bounds and points
        const bounds = mapInstanceRef.current.getBounds();
        const points = await getPointsWithinBounds(bounds);
        points.data.forEach((pointData) => {
          let iconUrl;
          if (pointData.marker_type === 'chest') {
            iconUrl = 'images/loot_chest.png';
          } else if (pointData.marker_type === 'doge') {
            iconUrl = `images/doge_black.png`;
          } else {
            console.error(`Unknown marker type: ${pointData.marker_type}`);
            return;
          }
        
          const markerIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [25, 25],
          });
        
          const marker = L.marker([pointData.latitude, pointData.longitude], {
            icon: markerIcon,
          });
          marker.id = pointData.id;
          marker.marker_type = pointData.marker_type;
          marker.doge_type = pointData.doge_type;
          marker.cosmetic_type = pointData.cosmetic_type;
          marker.on('click', onMarkerClick); // Bind click event to marker
          markersLayer.addLayer(marker);
        });      
      });

      mapInstanceRef.current.on('popupopen', function (e) {
        currentMarkerRef.current = e.popup._source;
      });

      mapInstanceRef.current.on('popupopen', function (e) {
        document.getElementById('map').addEventListener('click', async function (event) {
          if (event.target && event.target.id === 'revealButton') {

            const userCurrentPosition = userMarker.getLatLng();
            const markerLatLong = currentMarkerRef.current.getLatLng();

            if (userCurrentPosition.distanceTo(markerLatLong) > 100) {
              alert('You are too far away from the Doge to catch it. Get closer!');
              return;
            }

            const cost = revealButton.getAttribute('data-cost');
            const id = revealButton.getAttribute('data-id');
            const costInWei = Web3.utils.toWei(cost, 'ether');

            try {
              if (balance.value > costInWei) {
                // User has enough tokens, now spend tokens
                const receiveAddr = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ADDRESS

                try {
                  write({
                    args: [receiveAddr, costInWei],
                    from: userAddress,
                  });
                } catch (err) {
                  setError(err.message);
                  console.log(err);
                }
              } else {
                alert('You do not have enough Treatz tokens to catch this Doge.');
              }
            } catch (error) {
              // Handle errors here
              console.error('Error:', error);
            }
          };
        });
      });

      mapInstanceRef.current.fire('moveend'); // fire once on initial map load to populate markers
    }
  };

  // lookup user position and initialize the map
  useEffect(() => {
    // Success callback for geolocation
    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      initializeMap(latitude, longitude);
    };

    // Error callback for geolocation
    const handleError = (error) => {
      console.warn(`ERROR(${error.code}): ${error.message}`);
      // Fallback coordinates
      initializeMap(37.7749, -122.4194); // Default to San Francisco as a fallback
    };

    // Geolocation options
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    // Attempt to get the user's current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
    } else {
      console.log('Geolocation is not supported by this browser.');
    }

    // setup the watch outside of the initializeMap so that the handler func only gets attached once
    const watchId = navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      if (userMarker) {
        userMarker.setLatLng([latitude, longitude]);
      }
    }, handleError, options);

    // Cleanup function to remove the map when the component unmounts
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  return <div id="map" ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
}
