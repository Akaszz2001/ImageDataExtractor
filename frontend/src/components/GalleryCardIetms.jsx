// import React from 'react'
// import { useState } from 'react';
// import './GalleryCardItems.css'

// function GalleryCardIetms({combinedData}) {
//     const [currentImageIndexes, setCurrentImageIndexes] = useState({});

//     // Helper function to navigate images
//     const navigateImage = (itemId, direction) => {
//       setCurrentImageIndexes((prevIndexes) => {
//         const currentIndex = prevIndexes[itemId] || 0;
//         const imageCount = combinedData
//           .filter((result) => !result.error && result.data)
//           .flatMap((result) => result.data)
//           .find((item) => item.id === itemId)?.images?.length || 0;
  
//         // Calculate new index with wraparound
//         let newIndex;
//         if (direction === 'next') {
//           newIndex = (currentIndex + 1) % imageCount;
//         } else {
//           newIndex = (currentIndex - 1 + imageCount) % imageCount;
//         }
  
//         return { ...prevIndexes, [itemId]: newIndex };
//       });
//     };
  
//     return (
//       <div className="menu-items-display">
//         <h3>Menu Items Gallery</h3>
//         <div className="menu-items-grid">
//           {combinedData
//             .filter((result) => !result.error && result.data)
//             .flatMap((result) => result.data)
//             .map((item, index) => {
//               // Ensure item has a unique identifier (use id or fallback to index)
//               const itemId = item.id || `item-${index}`;
//               // Get current image index for this item or default to 0
//               const currentIndex = currentImageIndexes[itemId] || 0;
              
//               return (
//                 <div key={itemId} className="menu-item-card">
//                   {item.images && item.images.length > 0 ? (
//                     <div className="menu-item-image-slider">
//                       <div className="slider-image-container">
//                         <img 
//                           src={item.images[currentIndex]} 
//                           alt={`${item.name} - image ${currentIndex + 1}`} 
//                         />
                        
//                         {/* Image counter indicator */}
//                         <div className="image-counter">
//                           {currentIndex + 1}/{item.images.length}
//                         </div>
                        
//                         {/* Navigation arrows */}
//                         {item.images.length > 1 && (
//                           <>
//                             <button 
//                               className="slider-nav-button prev"
//                               onClick={() => navigateImage(itemId, 'prev')}
//                               aria-label="Previous image"
//                             >
//                               &#10094; {/* Left arrow HTML entity */}
//                             </button>
//                             <button 
//                               className="slider-nav-button next"
//                               onClick={() => navigateImage(itemId, 'next')}
//                               aria-label="Next image"
//                             >
//                               &#10095; {/* Right arrow HTML entity */}
//                             </button>
//                           </>
//                         )}
//                       </div>
                      
//                       {/* Optional: Dot indicators for images */}
//                       {item.images.length > 1 && (
//                         <div className="slider-dots">
//                           {item.images.map((_, dotIndex) => (
//                             <span
//                               key={dotIndex}
//                               className={`slider-dot ${dotIndex === currentIndex ? 'active' : ''}`}
//                               onClick={() => setCurrentImageIndexes({
//                                 ...currentImageIndexes,
//                                 [itemId]: dotIndex
//                               })}
//                             />
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ) : (
//                     // Fallback if no images array or it's empty
//                     item.image && (
//                       <div className="menu-item-image">
//                         <img src={item.image} alt={item.name} />
//                       </div>
//                     )
//                   )}
                  
//                   <div className="menu-item-details">
//                     <h4 className="menu-item-name">{item.name}</h4>
//                     <p className="menu-item-category">{item.category}</p>
//                     <p className="menu-item-description">
//                       {item.description}
//                     </p>
//                     <p className="menu-item-price">
//                       ${item.price ? item.price.toFixed(2) : 'N/A'}
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//         </div>
//       </div>
//     );
// }

// export default GalleryCardIetms

import React from 'react';
import { useState } from 'react';
import './GalleryCardItems.css';

function GalleryCardItems({ combinedData }) {
  const [currentImageIndexes, setCurrentImageIndexes] = useState({});
  
  // Function to set image directly to a specific index
  const setImageIndex = (itemId, newIndex) => {
    setCurrentImageIndexes((prevIndexes) => ({
      ...prevIndexes,
      [itemId]: newIndex
    }));
  };

  return (
    <div className="menu-items-display">
      <h3>Menu Items Gallery</h3>
      <div className="menu-items-grid">
        {combinedData
          .filter((result) => !result.error && result.data)
          .flatMap((result) => result.data)
          .map((item, index) => {
            // Ensure item has a unique identifier (use id or fallback to index)
            const itemId = item.id || `item-${index}`;
            // Get current image index for this item or default to 0
            const currentIndex = currentImageIndexes[itemId] || 0;
            
            return (
              <div key={itemId} className="menu-item-card">
                {item.images && item.images.length > 0 ? (
                  <div className="menu-item-image-slider">
                    <div className="slider-image-container">
                      <img 
                        src={item.images[currentIndex]} 
                        alt={`${item.name} - image ${currentIndex + 1}`} 
                      />
                      
                      {/* Image counter indicator */}
                      <div className="image-counter">
                        {currentIndex + 1}/{item.images.length}
                      </div>
                    </div>
                    
                    {/* Larger dot indicators for images */}
                    {item.images.length > 1 && (
                      <div className="slider-dots">
                        {item.images.map((_, dotIndex) => (
                          <span
                            key={dotIndex}
                            className={`slider-dot ${dotIndex === currentIndex ? 'active' : ''}`}
                            onClick={() => setImageIndex(itemId, dotIndex)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Fallback if no images array or it's empty
                  item.image && (
                    <div className="menu-item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                  )
                )}
                
                <div className="menu-item-details">
                  <h4 className="menu-item-name">{item.name}</h4>
                  <p className="menu-item-category">{item.category}</p>
                  <p className="menu-item-description">
                    {item.description}
                  </p>
                  <p className="menu-item-price">
                    ${item.price ? item.price.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default GalleryCardItems;