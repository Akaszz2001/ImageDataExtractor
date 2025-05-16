import React, { useState, useCallback } from "react";
import axios from "axios";
import { Loader } from "lucide-react";
import ImageSelectionModal from "./ImageSelectionModal";
import './MenuItemCard.css';

const MenuItemCard = ({ item, updateItemImage }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alternativeImages, setAlternativeImages] = useState([]);
  
  // Memoize the close handler to prevent unnecessary re-renders
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  // Function to get more images for this dish
  const handleGetMoreImages = async (e) => {
    // Prevent event bubbling
    e.stopPropagation();
    e.preventDefault();
    
    if (isLoading) return; // Prevent multiple requests

    // Prompt the user for the dish name
    const userInput = window.prompt("Enter the name for which you want to generate images:", item.name);
    if (!userInput || userInput.trim() === "") return; // Cancelled or empty

    // Create a duplicate object with the new name
    const itemForImage = { ...item, name: userInput.trim() };

    setIsLoading(true);
    try {
      // Send the dish data to the backend to generate alternative images
      const response = await axios.post(
        "http://localhost:8000/multipleImages",
        itemForImage,
        {
          headers: {
            "Content-Type": "application/json",
          },
          // Add a timeout to prevent hanging requests
          timeout: 30000,
        }
      );
      
      // Check if we got valid image URLs back
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setAlternativeImages(response.data);
        setIsModalOpen(true);
      } else {
        console.error("No alternative images received");
        // You could add an error notification here
      }
    } catch (error) {
      console.error("Error getting alternative images:", error);
      // You could add an error notification here
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle image selection from modal
  const handleImageSelect = useCallback((selectedImageUrl) => {
    // Update the image in the parent component's state
    updateItemImage(item.name, selectedImageUrl);
  }, [item.name, updateItemImage]);
  
  return (
    <div className="menu-item-card">
      <div className="image-container">
        {item.image ? (
          <img src={item.image} alt={item.name} className="dish-image" />
        ) : (
          <div className="no-image">No Image</div>
        )}
        <button 
          className="more-images-button bg-black"
          onClick={handleGetMoreImages}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? (
            <>
              <Loader size={16} className="animate-spin mr-2" />
              Loading...
            </>
          ) : (
            "Get More Images"
          )}
        </button>
      </div>
      <div className="menu-item-details">
        <h4 className="item-name">{item.name}</h4>
        <div className="item-price">${item.price.toFixed(2)}</div>
        <div className="item-category">{item.category}</div>
        <p className="item-description">{item.description}</p>
      </div>
      
      {/* Modal is conditionally rendered */}
      <ImageSelectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        images={alternativeImages}
        onSelect={handleImageSelect}
        dishName={item.name}
      />
    </div>
  );
};

export default MenuItemCard;