import React, { useState, useEffect,} from "react";
import ReactDOM from "react-dom";
import { X, Check, Image } from "lucide-react";
import './ImageSeletionModal.css';

const ImageSelectionModal = ({ isOpen, onClose, images = [], onSelect, dishName }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [portalElement, setPortalElement] = useState(null);
  
  // Create portal element on mount
  useEffect(() => {
    // Look for existing portal container or create one
    let element = document.getElementById('modal-portal-root');
    if (!element) {
      element = document.createElement('div');
      element.id = 'modal-portal-root';
      document.body.appendChild(element);
    }
    setPortalElement(element);
    
    // Cleanup function
    return () => {
      // Only remove if we created it and it's empty
      if (element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);
  
  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(null);
      // Prevent body scrolling
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  
  const handleSelectImage = () => {
    if (selectedImageIndex !== null) {
      onSelect(images[selectedImageIndex]);
      onClose();
    }
  };
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // If portal element not yet created or modal not open, don't render anything
  if (!portalElement || !isOpen) return null;
  
  // Render into the portal
  return ReactDOM.createPortal(
    <div 
      className="modal-overlay"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="dish-name">{dishName}</span>
            <span className="title-action">Select an image</span>
          </h2>
          <button 
            onClick={onClose}
            className="close-button"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {images.length > 0 ? (
            <div className="image-grid">
              {images.map((imageUrl, index) => (
                <div 
                  key={index}
                  className={`image-card ${selectedImageIndex === index ? 'selected' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedImageIndex === index}
                  aria-label={`Option ${index + 1} for ${dishName}`}
                >
                  <div className="image-wrapper">
                    <div className="image-placeholder-bg"></div>
                    <img 
                      src={imageUrl || "/api/placeholder/300/200"}
                      alt={`Option ${index + 1} for ${dishName}`}
                      className="option-image"
                      loading="eager"
                      draggable="false"
                    />
                    {selectedImageIndex === index && (
                      <div className="selection-indicator">
                        <Check size={24} />
                      </div>
                    )}
                  </div>
                  <div className="image-label">
                    <span className="option-number">Option {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <Image size={48} />
              <p>No images available for this dish</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-button"
            type="button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSelectImage}
            className={`select-button ${selectedImageIndex === null ? 'disabled' : ''}`}
            disabled={selectedImageIndex === null}
            type="button"
          >
            Select Image
          </button>
        </div>
      </div>
    </div>,
    portalElement
  );
};

export default ImageSelectionModal;