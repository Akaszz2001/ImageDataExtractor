const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs").promises;

// Add the stealth plugin to puppeteer (helps avoid detection)
puppeteer.use(StealthPlugin());

const app = express();

const cors = require("cors");

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Print out current directory for debugging

console.log("Current working directory:", process.cwd());



// seraching on google and bing
// app.post("/fullImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes`);

//   let browser = null;

//   try {
//     // Launch browser with stealth mode
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth settings
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//     );
//     await page.setExtraHTTPHeaders({
//       "Accept-Language": "en-US,en;q=0.9",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//       Referer: "https://www.google.com/",
//     });

//     // Add additional stealth techniques to avoid detection
//     await page.evaluateOnNewDocument(() => {
//       // Overwrite the navigator properties
//       Object.defineProperty(navigator, "webdriver", {
//         get: () => false,
//       });

//       // Create a fake plugins array
//       Object.defineProperty(navigator, "plugins", {
//         get: () => [
//           { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//           {
//             name: "Chrome PDF Viewer",
//             filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           },
//           { name: "Native Client", filename: "internal-nacl-plugin" },
//         ],
//       });
//     });

//     for (let i = 0; i < dishes.length; i++) {
//       const dish = dishes[i];
//       console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

//       try {
//         // Enhanced search query with more specific terms for better food images
//         let imageUrl = null;

//         // First try Google Images with optimized search parameters
//         const googleQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} food dish professional photography high resolution`
//         );
//         const googleUrl = `https://www.google.com/search?q=${googleQuery}&tbm=isch&tbs=isz:l,itp:photo`;

//         console.log(`Searching Google Images: ${googleUrl}`);

//         await page.goto(googleUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         // Wait for images to load using evaluate instead of waitForTimeout
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 3000));
//         });

//         // Enhanced image extraction with quality focus
//         imageUrl = await page.evaluate(() => {
//           // Helper function to calculate image quality score
//           const getImageQualityScore = (img) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Avoid tiny images
//             if (img.naturalWidth < 200 || img.naturalHeight < 200) score -= 20;

//             // Avoid icons and logos
//             if (img.naturalWidth < 100 && img.naturalHeight < 100) score -= 10;

//             return score;
//           };

//           // Helper to extract and validate image URLs
//           const getValidImageUrl = (img) => {
//             // Try various source attributes
//             const sources = [
//               img.src,
//               img.dataset.src,
//               img.dataset.iurl,
//               img.getAttribute("data-high-quality-src"),
//               img.getAttribute("data-original"),
//             ];

//             for (const src of sources) {
//               if (
//                 src &&
//                 src.startsWith("http") &&
//                 !src.includes("gstatic.com") &&
//                 !src.includes("google.com/images") &&
//                 !src.includes("google.com/logos") &&
//                 !src.includes("placeholder.com")
//               ) {
//                 return src;
//               }
//             }

//             // Check srcset for highest resolution
//             const srcset = img.getAttribute("srcset");
//             if (srcset) {
//               const sources = srcset.split(",");
//               const lastSource = sources[sources.length - 1]
//                 .trim()
//                 .split(" ")[0];
//               if (lastSource && lastSource.startsWith("http")) {
//                 return lastSource;
//               }
//             }

//             return null;
//           };

//           // Target high-quality images first
//           const imageSelectors = [
//             // Google image results with high quality
//             "img.Q4LuWd",
//             "img.rg_i",
//             ".isv-r img",
//             // Specific targeting for large preview images
//             "div[data-ved] img",
//             // General image selectors
//             "a img",
//             ".images img",
//             '[role="listitem"] img',
//           ];

//           // Collect all images and sort by quality score
//           const imageData = [];

//           for (const selector of imageSelectors) {
//             document.querySelectorAll(selector).forEach((img) => {
//               const url = getValidImageUrl(img);
//               if (url) {
//                 imageData.push({
//                   url: url,
//                   score: getImageQualityScore(img),
//                 });
//               }
//             });
//           }

//           // Get higher resolution from image links
//           document.querySelectorAll('a[href*="imgres"]').forEach((link) => {
//             const href = link.href;
//             const match = href.match(/imgurl=([^&]+)/);
//             if (match && match[1]) {
//               const url = decodeURIComponent(match[1]);
//               if (url.startsWith("http")) {
//                 imageData.push({
//                   url: url,
//                   score: 15, // Higher base score for full resolution images
//                 });
//               }
//             }
//           });

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });

//         // If Google doesn't yield a good result, try Bing Images
//         if (!imageUrl) {
//           const bingQuery = encodeURIComponent(
//             `${dish.name} ${dish.category} food high quality`
//           );
//           const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large`;

//           console.log(`Trying Bing Images: ${bingUrl}`);

//           await page.goto(bingUrl, {
//             waitUntil: "networkidle2",
//             timeout: 30000,
//           });

//           // Wait for images to load using evaluate instead of waitForTimeout
//           await page.evaluate(() => {
//             return new Promise((resolve) => setTimeout(resolve, 3000));
//           });

//           imageUrl = await page.evaluate(() => {
//             // Helper to extract valid image URLs
//             const getValidImageUrl = (element) => {
//               // Try data-src attribute first (Bing often uses this for lazy loading)
//               if (
//                 element.dataset.src &&
//                 element.dataset.src.startsWith("http")
//               ) {
//                 return element.dataset.src;
//               }

//               // Check regular src
//               if (element.src && element.src.startsWith("http")) {
//                 return element.src;
//               }

//               // Check m attribute which often contains the actual image URL in Bing
//               if (element.getAttribute("m")) {
//                 try {
//                   const mData = JSON.parse(element.getAttribute("m"));
//                   if (mData.murl && mData.murl.startsWith("http")) {
//                     return mData.murl; // This often contains the full-resolution image
//                   }
//                 } catch (e) {
//                   // Parse error, ignore
//                 }
//               }

//               return null;
//             };

//             // First try to get the main result images
//             const mainImages = document.querySelectorAll(
//               ".mimg, .iusc img, .imgpt img"
//             );
//             for (const img of mainImages) {
//               const url = getValidImageUrl(img);
//               if (url) return url;
//             }

//             // Then try other image containers
//             const containers = document.querySelectorAll(".iusc");
//             for (const container of containers) {
//               // Try to extract from m attribute
//               if (container.getAttribute("m")) {
//                 try {
//                   const mData = JSON.parse(container.getAttribute("m"));
//                   if (mData.murl && mData.murl.startsWith("http")) {
//                     return mData.murl;
//                   }
//                 } catch (e) {
//                   // Parse error, ignore
//                 }
//               }

//               // Try images inside the container
//               const imgs = container.querySelectorAll("img");
//               for (const img of imgs) {
//                 const url = getValidImageUrl(img);
//                 if (url) return url;
//               }
//             }

//             // Fallback to any valid image
//             const allImages = document.querySelectorAll("img");
//             for (const img of allImages) {
//               if (img.width > 200 && img.height > 200) {
//                 const url = getValidImageUrl(img);
//                 if (url) return url;
//               }
//             }

//             return null;
//           });
//         }

//         if (imageUrl) {
//           console.log(
//             `✅ Found high-quality image for ${dish.name}: ${imageUrl.substring(
//               0,
//               50
//             )}...`
//           );
//           dish.image = imageUrl;
//         } else {
//           console.log(`❌ No image found for ${dish.name}`);
//           // Using a better placeholder with category and dish name
//           dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name}`
//           )}`;
//         }

//         // Add a randomized delay between requests to avoid detection
//         // Using page.evaluate with setTimeout instead of page.waitForTimeout
//         const delay = 4000 + Math.floor(Math.random() * 4000); // 4-8 second random delay
//         console.log(`Waiting ${delay}ms before next request`);
//         await page.evaluate((waitTime) => {
//           return new Promise((resolve) => setTimeout(resolve, waitTime));
//         }, delay);
//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
//         // Mark the error but still provide a placeholder
//         dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//           `${dish.category}: ${dish.name}`
//         )}`;
//         dish.imageError = err.message;
//       }
//     }

//     console.log("Finished processing all dishes with high-quality images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });


// PORPERLY WORKING SERACHING ONLY IN BING BUT DOUBT IN IMAGE QUALITY
// app.post("/fullImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes`);

//   let browser = null;

//   try {
//     // Launch browser with stealth mode
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth settings
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//     );
//     await page.setExtraHTTPHeaders({
//       "Accept-Language": "en-US,en;q=0.9",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//       Referer: "https://www.google.com/",
//     });

//     // Add additional stealth techniques to avoid detection
//     await page.evaluateOnNewDocument(() => {
//       // Overwrite the navigator properties
//       Object.defineProperty(navigator, "webdriver", {
//         get: () => false,
//       });

//       // Create a fake plugins array
//       Object.defineProperty(navigator, "plugins", {
//         get: () => [
//           { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//           {
//             name: "Chrome PDF Viewer",
//             filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           },
//           { name: "Native Client", filename: "internal-nacl-plugin" },
//         ],
//       });
//     });

//     for (let i = 0; i < dishes.length; i++) {
//       const dish = dishes[i];
//       console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

//       try {
//         // Enhanced search query with more specific terms for better food images
//         let imageUrl = null;

//         /* Google Images search removed as requested
//         // First try Google Images with optimized search parameters
//         const googleQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} food dish professional photography high resolution`
//         );
//         const googleUrl = `https://www.google.com/search?q=${googleQuery}&tbm=isch&tbs=isz:l,itp:photo`;

//         console.log(`Searching Google Images: ${googleUrl}`);

//         await page.goto(googleUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         // Wait for images to load using evaluate instead of waitForTimeout
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 3000));
//         });

//         // Enhanced image extraction with quality focus
//         imageUrl = await page.evaluate(() => {
//           // Helper function to calculate image quality score
//           const getImageQualityScore = (img) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Avoid tiny images
//             if (img.naturalWidth < 200 || img.naturalHeight < 200) score -= 20;

//             // Avoid icons and logos
//             if (img.naturalWidth < 100 && img.naturalHeight < 100) score -= 10;

//             return score;
//           };

//           // Helper to extract and validate image URLs
//           const getValidImageUrl = (img) => {
//             // Try various source attributes
//             const sources = [
//               img.src,
//               img.dataset.src,
//               img.dataset.iurl,
//               img.getAttribute("data-high-quality-src"),
//               img.getAttribute("data-original"),
//             ];

//             for (const src of sources) {
//               if (
//                 src &&
//                 src.startsWith("http") &&
//                 !src.includes("gstatic.com") &&
//                 !src.includes("google.com/images") &&
//                 !src.includes("google.com/logos") &&
//                 !src.includes("placeholder.com")
//               ) {
//                 return src;
//               }
//             }

//             // Check srcset for highest resolution
//             const srcset = img.getAttribute("srcset");
//             if (srcset) {
//               const sources = srcset.split(",");
//               const lastSource = sources[sources.length - 1]
//                 .trim()
//                 .split(" ")[0];
//               if (lastSource && lastSource.startsWith("http")) {
//                 return lastSource;
//               }
//             }

//             return null;
//           };

//           // Target high-quality images first
//           const imageSelectors = [
//             // Google image results with high quality
//             "img.Q4LuWd",
//             "img.rg_i",
//             ".isv-r img",
//             // Specific targeting for large preview images
//             "div[data-ved] img",
//             // General image selectors
//             "a img",
//             ".images img",
//             '[role="listitem"] img',
//           ];

//           // Collect all images and sort by quality score
//           const imageData = [];

//           for (const selector of imageSelectors) {
//             document.querySelectorAll(selector).forEach((img) => {
//               const url = getValidImageUrl(img);
//               if (url) {
//                 imageData.push({
//                   url: url,
//                   score: getImageQualityScore(img),
//                 });
//               }
//             });
//           }

//           // Get higher resolution from image links
//           document.querySelectorAll('a[href*="imgres"]').forEach((link) => {
//             const href = link.href;
//             const match = href.match(/imgurl=([^&]+)/);
//             if (match && match[1]) {
//               const url = decodeURIComponent(match[1]);
//               if (url.startsWith("http")) {
//                 imageData.push({
//                   url: url,
//                   score: 15, // Higher base score for full resolution images
//                 });
//               }
//             }
//           });

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });
//         */

//         // Use Bing Images directly as the primary image source
//         const bingQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} food high quality`
//         );
//         const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large`;

//         console.log(`Searching Bing Images: ${bingUrl}`);

//         await page.goto(bingUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         // Wait for images to load using evaluate instead of waitForTimeout
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 3000));
//         });

//         imageUrl = await page.evaluate(() => {
//           // Helper to extract valid image URLs
//           const getValidImageUrl = (element) => {
//             // Try data-src attribute first (Bing often uses this for lazy loading)
//             if (
//               element.dataset.src &&
//               element.dataset.src.startsWith("http")
//             ) {
//               return element.dataset.src;
//             }

//             // Check regular src
//             if (element.src && element.src.startsWith("http")) {
//               return element.src;
//             }

//             // Check m attribute which often contains the actual image URL in Bing
//             if (element.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(element.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   return mData.murl; // This often contains the full-resolution image
//                 }
//               } catch (e) {
//                 // Parse error, ignore
//               }
//             }

//             return null;
//           };

//           // First try to get the main result images
//           const mainImages = document.querySelectorAll(
//             ".mimg, .iusc img, .imgpt img"
//           );
//           for (const img of mainImages) {
//             const url = getValidImageUrl(img);
//             if (url) return url;
//           }

//           // Then try other image containers
//           const containers = document.querySelectorAll(".iusc");
//           for (const container of containers) {
//             // Try to extract from m attribute
//             if (container.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(container.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   return mData.murl;
//                 }
//               } catch (e) {
//                 // Parse error, ignore
//               }
//             }

//             // Try images inside the container
//             const imgs = container.querySelectorAll("img");
//             for (const img of imgs) {
//               const url = getValidImageUrl(img);
//               if (url) return url;
//             }
//           }

//           // Fallback to any valid image
//           const allImages = document.querySelectorAll("img");
//           for (const img of allImages) {
//             if (img.width > 200 && img.height > 200) {
//               const url = getValidImageUrl(img);
//               if (url) return url;
//             }
//           }

//           return null;
//         });

//         if (imageUrl) {
//           console.log(
//             `✅ Found high-quality image for ${dish.name}: ${imageUrl.substring(
//               0,
//               50
//             )}...`
//           );
//           dish.image = imageUrl;
//         } else {
//           console.log(`❌ No image found for ${dish.name}`);
//           // Using a better placeholder with category and dish name
//           dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name}`
//           )}`;
//         }

//         // Add a randomized delay between requests to avoid detection
//         // Using page.evaluate with setTimeout instead of page.waitForTimeout
//         const delay = 4000 + Math.floor(Math.random() * 4000); // 4-8 second random delay
//         console.log(`Waiting ${delay}ms before next request`);
//         await page.evaluate((waitTime) => {
//           return new Promise((resolve) => setTimeout(resolve, waitTime));
//         }, delay);
//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
//         // Mark the error but still provide a placeholder
//         dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//           `${dish.category}: ${dish.name}`
//         )}`;
//         dish.imageError = err.message;
//       }
//     }

//     console.log("Finished processing all dishes with high-quality images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });

// ROUTE IS FAST AND BETTER IMAGES BUT MOST TIME WRONG IMAGES CAME

// app.post("/fullImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes`);

//   let browser = null;

//   try {
//     // Launch browser with stealth mode
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth settings
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//     );
//     await page.setExtraHTTPHeaders({
//       "Accept-Language": "en-US,en;q=0.9",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//       Referer: "https://www.google.com/",
//     });

//     // Add additional stealth techniques to avoid detection
//     await page.evaluateOnNewDocument(() => {
//       // Overwrite the navigator properties
//       Object.defineProperty(navigator, "webdriver", {
//         get: () => false,
//       });

//       // Create a fake plugins array
//       Object.defineProperty(navigator, "plugins", {
//         get: () => [
//           { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//           {
//             name: "Chrome PDF Viewer",
//             filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           },
//           { name: "Native Client", filename: "internal-nacl-plugin" },
//         ],
//       });
//     });

//     for (let i = 0; i < dishes.length; i++) {
//       const dish = dishes[i];
//       console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

//       try {
//         // Enhanced search query with more specific terms for better food images
//         let imageUrl = null;

//         // Create more targeted search query based on dish type
//         let extraTerms = "";
//         if (dish.category) {
//           const category = dish.category.toLowerCase();
//           if (category.includes("dessert") || category.includes("sweet")) {
//             extraTerms = "gourmet pastry dessert";
//           } else if (category.includes("soup") || category.includes("stew")) {
//             extraTerms = "homemade bowl restaurant";
//           } else if (category.includes("salad")) {
//             extraTerms = "fresh healthy gourmet";
//           } else if (category.includes("drink") || category.includes("beverage")) {
//             extraTerms = "cocktail refreshing served";
//           } else {
//             extraTerms = "gourmet restaurant plated";
//           }
//         }

//         /* Google Images search removed as requested
//         // First try Google Images with optimized search parameters
//         const googleQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} food dish professional photography high resolution`
//         );
//         const googleUrl = `https://www.google.com/search?q=${googleQuery}&tbm=isch&tbs=isz:l,itp:photo`;

//         console.log(`Searching Google Images: ${googleUrl}`);

//         await page.goto(googleUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         // Wait just long enough for high-quality images to load
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 1500));
//         });

//         // Enhanced image extraction with quality focus
//         imageUrl = await page.evaluate(() => {
//           // Helper function to calculate image quality score
//           const getImageQualityScore = (img) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Avoid tiny images
//             if (img.naturalWidth < 200 || img.naturalHeight < 200) score -= 20;

//             // Avoid icons and logos
//             if (img.naturalWidth < 100 && img.naturalHeight < 100) score -= 10;

//             return score;
//           };

//           // Helper to extract and validate image URLs
//           const getValidImageUrl = (img) => {
//             // Try various source attributes
//             const sources = [
//               img.src,
//               img.dataset.src,
//               img.dataset.iurl,
//               img.getAttribute("data-high-quality-src"),
//               img.getAttribute("data-original"),
//             ];

//             for (const src of sources) {
//               if (
//                 src &&
//                 src.startsWith("http") &&
//                 !src.includes("gstatic.com") &&
//                 !src.includes("google.com/images") &&
//                 !src.includes("google.com/logos") &&
//                 !src.includes("placeholder.com")
//               ) {
//                 return src;
//               }
//             }

//             // Check srcset for highest resolution
//             const srcset = img.getAttribute("srcset");
//             if (srcset) {
//               const sources = srcset.split(",");
//               const lastSource = sources[sources.length - 1]
//                 .trim()
//                 .split(" ")[0];
//               if (lastSource && lastSource.startsWith("http")) {
//                 return lastSource;
//               }
//             }

//             return null;
//           };

//           // Target high-quality images first
//           const imageSelectors = [
//             // Google image results with high quality
//             "img.Q4LuWd",
//             "img.rg_i",
//             ".isv-r img",
//             // Specific targeting for large preview images
//             "div[data-ved] img",
//             // General image selectors
//             "a img",
//             ".images img",
//             '[role="listitem"] img',
//           ];

//           // Collect all images and sort by quality score
//           const imageData = [];

//           for (const selector of imageSelectors) {
//             document.querySelectorAll(selector).forEach((img) => {
//               const url = getValidImageUrl(img);
//               if (url) {
//                 imageData.push({
//                   url: url,
//                   score: getImageQualityScore(img),
//                 });
//               }
//             });
//           }

//           // Get higher resolution from image links
//           document.querySelectorAll('a[href*="imgres"]').forEach((link) => {
//             const href = link.href;
//             const match = href.match(/imgurl=([^&]+)/);
//             if (match && match[1]) {
//               const url = decodeURIComponent(match[1]);
//               if (url.startsWith("http")) {
//                 imageData.push({
//                   url: url,
//                   score: 15, // Higher base score for full resolution images
//                 });
//               }
//             }
//           });

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });
//         */

//         // Create more specific Bing search query to get higher quality images
//         const bingQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} ${extraTerms} food dish professional photography high resolution`
//         );
//         // Add filter for large high-quality images
//         const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large+filterui:photo-photo+filterui:aspect-wide`;

//         console.log(`Searching Bing Images: ${bingUrl}`);

//         await page.goto(bingUrl, {
//           waitUntil: "domcontentloaded", // Changed from networkidle2 for faster loading
//           timeout: 15000, // Reduced timeout
//         });

//         // Wait for images to load using evaluate instead of waitForTimeout
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 3000));
//         });

//         // Enhanced image extraction function - prioritizing quality and speed
//         imageUrl = await page.evaluate(() => {
//           // Helper to calculate image quality score
//           const getImageQualityScore = (img, url) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;
//             if (img.naturalWidth > 1200) score += 15;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Prefer sharper images (usually have certain keywords in URL)
//             if (url) {
//               if (url.includes('high') || url.includes('large')) score += 3;
//               if (url.includes('quality')) score += 3;
//               if (url.includes('professional') || url.includes('stock')) score += 5;
//               if (url.includes('shutterstock') || url.includes('getty') || url.includes('istockphoto')) score += 5;
//             }

//             // Avoid small images
//             if (img.naturalWidth < 300 || img.naturalHeight < 300) score -= 10;

//             return score;
//           };

//           // Enhanced helper to extract valid image URLs with quality focus
//           const getValidImageUrl = (element) => {
//             // Check m attribute first (best source for high-res Bing images)
//             if (element.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(element.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   return {
//                     url: mData.murl,
//                     // murl typically contains the full-resolution source image
//                     score: 20 + (mData.murl.includes('high') ? 5 : 0)
//                   };
//                 }
//               } catch (e) {
//                 // Continue to other methods if parse error
//               }
//             }

//             let urlInfo = null;

//             // Check data-src (often high quality in Bing)
//             if (element.dataset.src && element.dataset.src.startsWith("http")) {
//               urlInfo = {
//                 url: element.dataset.src,
//                 score: getImageQualityScore(element, element.dataset.src)
//               };
//             }

//             // Check regular src if no data-src
//             if (!urlInfo && element.src && element.src.startsWith("http") && !element.src.includes("data:image")) {
//               urlInfo = {
//                 url: element.src,
//                 score: getImageQualityScore(element, element.src)
//               };
//             }

//             return urlInfo;
//           };

//           // Collect image data with quality scores
//           const imageData = [];

//           // First collect from containers with m attribute (highest quality source)
//           const containers = document.querySelectorAll(".iusc");
//           for (const container of containers) {
//             if (container.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(container.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   // Find the associated img element to get dimensions if possible
//                   const img = container.querySelector('img');
//                   let score = 20; // Base score for murl (typically high quality)

//                   if (img) {
//                     // Add quality based on dimensions
//                     score += getImageQualityScore(img, mData.murl);
//                   } else {
//                     // If no img element, add score based on URL characteristics
//                     if (mData.murl.includes('high')) score += 5;
//                     if (mData.murl.includes('large')) score += 5;
//                   }

//                   imageData.push({
//                     url: mData.murl,
//                     score: score
//                   });
//                 }
//               } catch (e) {}
//             }
//           }

//           // Add main result images
//           const mainImages = document.querySelectorAll(".mimg, .iusc img, .imgpt img");
//           for (let i = 0; i < mainImages.length; i++) {
//             const urlInfo = getValidImageUrl(mainImages[i]);
//             if (urlInfo) {
//               imageData.push(urlInfo);
//             }
//           }

//           // Add any other large images as fallback
//           const allImages = document.querySelectorAll("img");
//           for (let i = 0; i < allImages.length; i++) {
//             const img = allImages[i];
//             if (img.width > 300 && img.height > 300) {
//               const urlInfo = getValidImageUrl(img);
//               if (urlInfo) {
//                 imageData.push(urlInfo);
//               }
//             }
//           }

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });

//         if (imageUrl) {
//           console.log(
//             `✅ Found high-quality image for ${dish.name}: ${imageUrl.substring(
//               0,
//               50
//             )}...`
//           );
//           dish.image = imageUrl;
//         } else {
//           console.log(`❌ No image found for ${dish.name}`);
//           // Using a better placeholder with category and dish name
//           dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name}`
//           )}`;
//         }

//         // Shorter delay between requests for faster processing
//         const delay = 1000 + Math.floor(Math.random() * 1000); // 1-2 second random delay
//         console.log(`Waiting ${delay}ms before next request`);
//         await page.evaluate((waitTime) => {
//           return new Promise((resolve) => setTimeout(resolve, waitTime));
//         }, delay);
//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
//         // Mark the error but still provide a placeholder
//         dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//           `${dish.category}: ${dish.name}`
//         )}`;
//         dish.imageError = err.message;
//       }
//     }

//     console.log("Finished processing all dishes with high-quality images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });

// ROUTE IS FAST AND BETTER IMAGES BUT MOST TIME WRONG IMAGES CAME
// app.post("/fullImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes`);

//   let browser = null;

//   try {
//     // Launch browser with stealth mode
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth settings
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//     );
//     await page.setExtraHTTPHeaders({
//       "Accept-Language": "en-US,en;q=0.9",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//       Referer: "https://www.google.com/",
//     });

//     // Add additional stealth techniques to avoid detection
//     await page.evaluateOnNewDocument(() => {
//       // Overwrite the navigator properties
//       Object.defineProperty(navigator, "webdriver", {
//         get: () => false,
//       });

//       // Create a fake plugins array
//       Object.defineProperty(navigator, "plugins", {
//         get: () => [
//           { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//           {
//             name: "Chrome PDF Viewer",
//             filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           },
//           { name: "Native Client", filename: "internal-nacl-plugin" },
//         ],
//       });
//     });

//     for (let i = 0; i < dishes.length; i++) {
//       const dish = dishes[i];
//       console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

//       try {
//         // Enhanced search query with strong focus on dish name and category for accuracy
//         let imageUrl = null;

//         // Create more targeted search query based on dish type
//         let extraTerms = "";
//         if (dish.category) {
//           const category = dish.category.toLowerCase();
//           if (category.includes("dessert") || category.includes("sweet")) {
//             extraTerms = "dessert";
//           } else if (category.includes("soup") || category.includes("stew")) {
//             extraTerms = "soup";
//           } else if (category.includes("salad")) {
//             extraTerms = "salad";
//           } else if (category.includes("drink") || category.includes("beverage")) {
//             extraTerms = "drink";
//           } else if (category.includes("pasta") || category.includes("noodle")) {
//             extraTerms = "pasta dish";
//           } else if (category.includes("pizza")) {
//             extraTerms = "pizza";
//           } else if (category.includes("burger") || category.includes("sandwich")) {
//             extraTerms = "sandwich";
//           } else if (category.includes("seafood")) {
//             extraTerms = "seafood dish";
//           } else if (category.includes("meat")) {
//             extraTerms = "meat dish";
//           } else {
//             extraTerms = "food dish";
//           }
//         }

//         /* Google Images search removed as requested
//         // First try Google Images with optimized search parameters
//         const googleQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} food dish professional photography high resolution`
//         );
//         const googleUrl = `https://www.google.com/search?q=${googleQuery}&tbm=isch&tbs=isz:l,itp:photo`;

//         console.log(`Searching Google Images: ${googleUrl}`);

//         await page.goto(googleUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         // Wait just long enough for high-quality images to load
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 1500));
//         });

//         // Enhanced image extraction with quality focus
//         imageUrl = await page.evaluate(() => {
//           // Helper function to calculate image quality score
//           const getImageQualityScore = (img) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Avoid tiny images
//             if (img.naturalWidth < 200 || img.naturalHeight < 200) score -= 20;

//             // Avoid icons and logos
//             if (img.naturalWidth < 100 && img.naturalHeight < 100) score -= 10;

//             return score;
//           };

//           // Helper to extract and validate image URLs
//           const getValidImageUrl = (img) => {
//             // Try various source attributes
//             const sources = [
//               img.src,
//               img.dataset.src,
//               img.dataset.iurl,
//               img.getAttribute("data-high-quality-src"),
//               img.getAttribute("data-original"),
//             ];

//             for (const src of sources) {
//               if (
//                 src &&
//                 src.startsWith("http") &&
//                 !src.includes("gstatic.com") &&
//                 !src.includes("google.com/images") &&
//                 !src.includes("google.com/logos") &&
//                 !src.includes("placeholder.com")
//               ) {
//                 return src;
//               }
//             }

//             // Check srcset for highest resolution
//             const srcset = img.getAttribute("srcset");
//             if (srcset) {
//               const sources = srcset.split(",");
//               const lastSource = sources[sources.length - 1]
//                 .trim()
//                 .split(" ")[0];
//               if (lastSource && lastSource.startsWith("http")) {
//                 return lastSource;
//               }
//             }

//             return null;
//           };

//           // Target high-quality images first
//           const imageSelectors = [
//             // Google image results with high quality
//             "img.Q4LuWd",
//             "img.rg_i",
//             ".isv-r img",
//             // Specific targeting for large preview images
//             "div[data-ved] img",
//             // General image selectors
//             "a img",
//             ".images img",
//             '[role="listitem"] img',
//           ];

//           // Collect all images and sort by quality score
//           const imageData = [];

//           for (const selector of imageSelectors) {
//             document.querySelectorAll(selector).forEach((img) => {
//               const url = getValidImageUrl(img);
//               if (url) {
//                 imageData.push({
//                   url: url,
//                   score: getImageQualityScore(img),
//                 });
//               }
//             });
//           }

//           // Get higher resolution from image links
//           document.querySelectorAll('a[href*="imgres"]').forEach((link) => {
//             const href = link.href;
//             const match = href.match(/imgurl=([^&]+)/);
//             if (match && match[1]) {
//               const url = decodeURIComponent(match[1]);
//               if (url.startsWith("http")) {
//                 imageData.push({
//                   url: url,
//                   score: 15, // Higher base score for full resolution images
//                 });
//               }
//             }
//           });

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });
//         */

//         // Create more specific Bing search query to get higher quality images
//         const bingQuery = encodeURIComponent(
//           `${dish.name} ${dish.category}  food dish professional photography high resolution`
//         );
//         // Add filter for large high-quality images
//         const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large+filterui:photo-photo+filterui:aspect-wide`;

//         console.log(`Searching Bing Images: ${bingUrl}`);

//         await page.goto(bingUrl, {
//           waitUntil: "domcontentloaded", // Changed from networkidle2 for faster loading
//           timeout: 15000, // Reduced timeout
//         });

//         // Wait for images to load using evaluate instead of waitForTimeout
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 3000));
//         });

//         // Enhanced image extraction function - prioritizing quality and speed
//         imageUrl = await page.evaluate(() => {
//           // Helper to calculate image quality score
//           const getImageQualityScore = (img, url) => {
//             let score = 0;

//             // Prefer larger images
//             if (img.naturalWidth > 500) score += 5;
//             if (img.naturalWidth > 800) score += 10;
//             if (img.naturalWidth > 1200) score += 15;

//             // Check image dimensions ratio (food photos often have aspect ratios close to 4:3 or 16:9)
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 1.2 && ratio <= 1.8) score += 5;

//             // Prefer sharper images (usually have certain keywords in URL)
//             if (url) {
//               if (url.includes('high') || url.includes('large')) score += 3;
//               if (url.includes('quality')) score += 3;
//               if (url.includes('professional') || url.includes('stock')) score += 5;
//               if (url.includes('shutterstock') || url.includes('getty') || url.includes('istockphoto')) score += 5;
//             }

//             // Avoid small images
//             if (img.naturalWidth < 300 || img.naturalHeight < 300) score -= 10;

//             return score;
//           };

//           // Enhanced helper to extract valid image URLs with quality focus
//           const getValidImageUrl = (element) => {
//             // Check m attribute first (best source for high-res Bing images)
//             if (element.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(element.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   return {
//                     url: mData.murl,
//                     // murl typically contains the full-resolution source image
//                     score: 20 + (mData.murl.includes('high') ? 5 : 0)
//                   };
//                 }
//               } catch (e) {
//                 // Continue to other methods if parse error
//               }
//             }

//             let urlInfo = null;

//             // Check data-src (often high quality in Bing)
//             if (element.dataset.src && element.dataset.src.startsWith("http")) {
//               urlInfo = {
//                 url: element.dataset.src,
//                 score: getImageQualityScore(element, element.dataset.src)
//               };
//             }

//             // Check regular src if no data-src
//             if (!urlInfo && element.src && element.src.startsWith("http") && !element.src.includes("data:image")) {
//               urlInfo = {
//                 url: element.src,
//                 score: getImageQualityScore(element, element.src)
//               };
//             }

//             return urlInfo;
//           };

//           // Collect image data with quality scores
//           const imageData = [];

//           // First collect from containers with m attribute (highest quality source)
//           const containers = document.querySelectorAll(".iusc");
//           for (const container of containers) {
//             if (container.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(container.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   // Find the associated img element to get dimensions if possible
//                   const img = container.querySelector('img');
//                   let score = 20; // Base score for murl (typically high quality)

//                   if (img) {
//                     // Add quality based on dimensions
//                     score += getImageQualityScore(img, mData.murl);
//                   } else {
//                     // If no img element, add score based on URL characteristics
//                     if (mData.murl.includes('high')) score += 5;
//                     if (mData.murl.includes('large')) score += 5;
//                   }

//                   imageData.push({
//                     url: mData.murl,
//                     score: score
//                   });
//                 }
//               } catch (e) {}
//             }
//           }

//           // Add main result images
//           const mainImages = document.querySelectorAll(".mimg, .iusc img, .imgpt img");
//           for (let i = 0; i < mainImages.length; i++) {
//             const urlInfo = getValidImageUrl(mainImages[i]);
//             if (urlInfo) {
//               imageData.push(urlInfo);
//             }
//           }

//           // Add any other large images as fallback
//           const allImages = document.querySelectorAll("img");
//           for (let i = 0; i < allImages.length; i++) {
//             const img = allImages[i];
//             if (img.width > 300 && img.height > 300) {
//               const urlInfo = getValidImageUrl(img);
//               if (urlInfo) {
//                 imageData.push(urlInfo);
//               }
//             }
//           }

//           // Sort by quality score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           return imageData.length > 0 ? imageData[0].url : null;
//         });

//         if (imageUrl) {
//           console.log(
//             `✅ Found high-quality image for ${dish.name}: ${imageUrl.substring(
//               0,
//               50
//             )}...`
//           );
//           dish.image = imageUrl;
//         } else {
//           console.log(`❌ No image found for ${dish.name}`);
//           // Using a better placeholder with category and dish name
//           dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name}`
//           )}`;
//         }

//         // Shorter delay between requests for faster processing
//         const delay = 1000 + Math.floor(Math.random() * 1000); // 1-2 second random delay
//         console.log(`Waiting ${delay}ms before next request`);
//         await page.evaluate((waitTime) => {
//           return new Promise((resolve) => setTimeout(resolve, waitTime));
//         }, delay);
//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
//         // Mark the error but still provide a placeholder
//         dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//           `${dish.category}: ${dish.name}`
//         )}`;
//         dish.imageError = err.message;
//       }
//     }

//     console.log("Finished processing all dishes with high-quality images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });

// ROUTE IS FAST AND BETTER IMAGES BUT SOMETIME WRONG IMAGES CAME
// app.post("/fullImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes`);

//   let browser = null;

//   try {
//     // Launch browser with stealth mode
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const page = await browser.newPage();

//     // Enhanced stealth settings
//     await page.setViewport({ width: 1920, height: 1080 });
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//     );
//     await page.setExtraHTTPHeaders({
//       "Accept-Language": "en-US,en;q=0.9",
//       Accept:
//         "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//       Referer: "https://www.google.com/",
//     });

//     // Add additional stealth techniques to avoid detection
//     await page.evaluateOnNewDocument(() => {
//       // Overwrite the navigator properties
//       Object.defineProperty(navigator, "webdriver", {
//         get: () => false,
//       });

//       // Create a fake plugins array
//       Object.defineProperty(navigator, "plugins", {
//         get: () => [
//           { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//           {
//             name: "Chrome PDF Viewer",
//             filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           },
//           { name: "Native Client", filename: "internal-nacl-plugin" },
//         ],
//       });
//     });

//     for (let i = 0; i < dishes.length; i++) {
//       const dish = dishes[i];
//       console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

//       try {
//         let imageUrl = null;

//         // Create more specific search query that emphasizes the exact dish name
//         // Avoid terms that lead to stock photos and focus on the actual dish
//         const searchTerms = `${dish.name} food dish recipe homemade -shutterstock -getty -stock -logo`;
//         const bingQuery = encodeURIComponent(searchTerms);

//         // Still use filters for quality but prioritize "all" images over just "large" to avoid missing good matches
//         const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:photo-photo`;

//         console.log(`Searching Bing Images: ${bingUrl}`);

//         await page.goto(bingUrl, {
//           waitUntil: "domcontentloaded",
//           timeout: 15000,
//         });

//         // Wait for images to load
//         await page.evaluate(() => {
//           return new Promise((resolve) => setTimeout(resolve, 2500));
//         });

//         // Modified image extraction function prioritizing relevance over pure quality
//         imageUrl = await page.evaluate((dishName) => {
//           // Helper to calculate image relevance score - prioritizing matching over raw dimensions
//           const getImageRelevanceScore = (img, url, alt) => {
//             let score = 0;

//             // Basic quality metrics - still important but weighted less than before
//             if (img.naturalWidth > 400) score += 3;
//             if (img.naturalWidth > 800) score += 5;

//             // Check for reasonable aspect ratio for food photos
//             const ratio = img.naturalWidth / img.naturalHeight;
//             if (ratio >= 0.8 && ratio <= 1.8) score += 5; // Accept more square-ish photos too

//             // Severely penalize tiny images
//             if (img.naturalWidth < 250 || img.naturalHeight < 250) score -= 15;

//             // NEW: Major relevance factors

//             // Check if the image alt text or parent element text contains the dish name
//             // This is crucial for matching the actual dish rather than related but incorrect images
//             const dishNameLower = dishName.toLowerCase();
//             const altText = alt ? alt.toLowerCase() : '';

//             // High bonus for exact name match in alt text
//             if (altText.includes(dishNameLower)) {
//               score += 30;

//               // Extra points for exact matches
//               if (altText === dishNameLower ||
//                   altText === `${dishNameLower} recipe` ||
//                   altText === `${dishNameLower} dish`) {
//                 score += 20;
//               }
//             }

//             // Check for dish name in URL - good signal for relevance
//             if (url && url.toLowerCase().includes(dishNameLower.replace(/\s+/g, '-'))) {
//               score += 15;
//             }

//             // Prefer non-stock image sites
//             if (url) {
//               if (url.includes('shutterstock') || url.includes('getty') ||
//                   url.includes('istockphoto') || url.includes('alamy')) {
//                 score -= 25; // Heavy penalty for stock sites that often have watermarks
//               }

//               // Prefer recipe sites and blogs which likely have actual dish photos
//               if (url.includes('recipe') || url.includes('food') ||
//                   url.includes('cook') || url.includes('kitchen') ||
//                   url.includes('allrecipes') || url.includes('taste') ||
//                   url.includes('blog')) {
//                 score += 10;
//               }
//             }

//             return score;
//           };

//           // Helper to extract valid image URLs with improved relevance focus
//           const getValidImageInfo = (element, altText) => {
//             // Check m attribute first (best source for Bing images)
//             if (element.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(element.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   // Get additional title/alt for relevance matching
//                   const title = mData.t || '';
//                   const alt = altText || title || '';

//                   return {
//                     url: mData.murl,
//                     alt: alt,
//                     score: getImageRelevanceScore(element, mData.murl, alt)
//                   };
//                 }
//               } catch (e) {
//                 // Continue to other methods if parse error
//               }
//             }

//             // Check data attributes and src
//             let imgUrl = null;
//             if (element.dataset.src && element.dataset.src.startsWith("http")) {
//               imgUrl = element.dataset.src;
//             } else if (element.src && element.src.startsWith("http") && !element.src.includes("data:image")) {
//               imgUrl = element.src;
//             }

//             if (imgUrl) {
//               // Try to get alt text from the element itself or nearby elements
//               const alt = altText || element.alt || element.title || '';

//               return {
//                 url: imgUrl,
//                 alt: alt,
//                 score: getImageRelevanceScore(element, imgUrl, alt)
//               };
//             }

//             return null;
//           };

//           // Collect image data with relevance scores
//           const imageData = [];

//           // First collect from containers with m attribute (highest quality source)
//           const containers = document.querySelectorAll(".iusc");
//           for (const container of containers) {
//             if (container.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(container.getAttribute("m"));
//                 // Get any alt text or title from container
//                 const img = container.querySelector('img');
//                 const altText = img ? (img.alt || img.title || '') : '';

//                 if (mData.murl && mData.murl.startsWith("http")) {
//                   // Calculate score based on both quality and relevance
//                   const score = getImageRelevanceScore(
//                     img || {naturalWidth: 800, naturalHeight: 600}, // Default dimensions if no img
//                     mData.murl,
//                     altText || mData.t || '' // Use title from metadata if no alt
//                   );

//                   imageData.push({
//                     url: mData.murl,
//                     alt: altText || mData.t || '',
//                     score: score
//                   });
//                 }
//               } catch (e) {}
//             }
//           }

//           // Add images from other common Bing selectors
//           ["img.mimg", ".imgpt img", ".img_cont img"].forEach(selector => {
//             document.querySelectorAll(selector).forEach(img => {
//               // Try to get alt text from parent elements too
//               let parentAlt = '';
//               let parent = img.parentElement;
//               for (let i = 0; i < 3 && parent; i++) { // Check up to 3 levels up
//                 if (parent.textContent && parent.textContent.trim().length < 100) {
//                   parentAlt = parent.textContent.trim();
//                   break;
//                 }
//                 parent = parent.parentElement;
//               }

//               const imgInfo = getValidImageInfo(img, img.alt || parentAlt || '');
//               if (imgInfo) {
//                 imageData.push(imgInfo);
//               }
//             });
//           });

//           // Sort by relevance score and return best image
//           imageData.sort((a, b) => b.score - a.score);
//           console.log("Top scores:", imageData.slice(0, 3).map(i => `${i.score}: ${i.alt.substring(0, 20)}`));
//           return imageData.length > 0 ? imageData[0].url : null;
//         }, dish.name);

//         if (imageUrl) {
//           console.log(
//             `✅ Found relevant image for ${dish.name}: ${imageUrl.substring(
//               0,
//               50
//             )}...`
//           );
//           dish.image = imageUrl;
//         } else {
//           console.log(`❌ No image found for ${dish.name}`);
//           // Using a better placeholder with category and dish name
//           dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name}`
//           )}`;
//         }

//         // Shorter delay between requests for faster processing
//         const delay = 1000 + Math.floor(Math.random() * 1000); // 1-2 second random delay
//         console.log(`Waiting ${delay}ms before next request`);
//         await page.evaluate((waitTime) => {
//           return new Promise((resolve) => setTimeout(resolve, waitTime));
//         }, delay);
//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
//         // Mark the error but still provide a placeholder
//         dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//           `${dish.category}: ${dish.name}`
//         )}`;
//         dish.imageError = err.message;
//       }
//     }

//     console.log("Finished processing all dishes with relevant images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });


// ROUTE FOR FULL IMAGES

app.post("/fullImages", async (req, res) => {
  const dishes = req.body;
  console.log(`Processing ${dishes.length} dishes`);

  let browser = null;
  const concurrencyLimit = 3;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-skip-list",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
      ],
      ignoreHTTPSErrors: true,
    });

    const processDish = async (dish) => {
      const page = await browser.newPage();

      try {
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
        );

        await page.setExtraHTTPHeaders({
          "Accept-Language": "en-US,en;q=0.9",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          Referer: "https://www.google.com/",
        });

        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => false,
          });

          Object.defineProperty(navigator, "plugins", {
            get: () => [
              { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
              {
                name: "Chrome PDF Viewer",
                filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
              },
              { name: "Native Client", filename: "internal-nacl-plugin" },  
            ],
          });
        });

        const bingQuery = encodeURIComponent(
          `${dish.name} ${dish.category} ${dish.description} food high quality`
        );
        const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large`;

        await page.setRequestInterception(true);
        page.on("request", (req) => {
          const blocked = ["stylesheet", "font", "script"];
          if (blocked.includes(req.resourceType())) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await page.goto(bingUrl, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // await page.waitForTimeout(3000); // Let images load
        // await new Promise((res) => setTimeout(res, 3000));
        await page.waitForSelector("img.mimg, .iusc img, .imgpt img, img", {
          timeout: 5000,
        });

        const imageUrl = await page.evaluate(() => {
          const getValidImageUrl = (element) => {
            if (element.dataset.src && element.dataset.src.startsWith("http"))
              return element.dataset.src;
            if (element.src && element.src.startsWith("http"))
              return element.src;
            if (element.getAttribute("m")) {
              try {
                const mData = JSON.parse(element.getAttribute("m"));
                if (mData.murl && mData.murl.startsWith("http"))
                  return mData.murl;
              } catch (e) {}
            }
            return null;
          };

          const selectors = [".mimg", ".iusc img", ".imgpt img", "img"];
          for (const sel of selectors) {
            const imgs = document.querySelectorAll(sel);
            for (const img of imgs) {
              const url = getValidImageUrl(img);
              if (url) return url;
            }
          }

          return null;
        });

        if (imageUrl) {
          dish.image = imageUrl;
        } else {
          dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
            `${dish.category}: ${dish.name}`
          )}`;
        }
      } catch (err) {
        console.error(`Error processing ${dish.name}:`, err);
        dish.image = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
          `${dish.category}: ${dish.name}`
        )}`;
        dish.imageError = err.message;
      } finally {
        await page.close();
      }
    };

    // Batch process dishes with concurrency limit
    let index = 0;
    while (index < dishes.length) {
      const batch = dishes.slice(index, index + concurrencyLimit);
      console.log(`Processing batch: ${index + 1} to ${index + batch.length}`);
      await Promise.all(batch.map((dish) => processDish(dish)));

      index += concurrencyLimit;

      if (index < dishes.length) {
        const delay = 2000 + Math.random() * 3000;
        console.log(`Waiting ${Math.round(delay)}ms before next batch...`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    console.log("Finished processing all dishes");
    res.json(dishes);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
});


// ROUTE FOR PARTIAL IAMGES

app.post("/partialImages", async (req, res) => {
  const dishes = req.body;
  console.log(
    `Processing ${dishes.length} dishes for partial image generation`
  );

  // Group dishes by category
  const categorizedDishes = {};
  dishes.forEach((dish) => {
    if (!categorizedDishes[dish.category]) {
      categorizedDishes[dish.category] = [];
    }
    categorizedDishes[dish.category].push(dish);
  });

  // Select two random dishes from each category
  const selectedDishes = [];
  Object.keys(categorizedDishes).forEach((category) => {
    const dishesInCategory = categorizedDishes[category];
    // Shuffle dishes in this category
    const shuffled = [...dishesInCategory].sort(() => 0.5 - Math.random());
    // Take first two dishes or all if less than two
    const selected = shuffled.slice(0, Math.min(2, shuffled.length));
    // Mark these dishes for image fetching
    selected.forEach((dish) => (dish.needsImage = true));
    // Add all dishes from this category to the result
    selectedDishes.push(...dishesInCategory);
  });

  let browser = null;

  try {
    // Launch browser with more stealth settings to avoid detection
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-skip-list",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // More realistic browser settings
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-ch-ua": '"Google Chrome";v="103", " Not;A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    });

    // Emulate human-like behavior by setting cookies and browser fingerprints
    await page.evaluateOnNewDocument(() => {
      // Override the navigator properties
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
      // Add language plugins
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
      // Add Chrome-specific plugins
      window.chrome = {
        runtime: {},
      };
    });

    // Only process dishes that need images
    const dishesNeedingImages = selectedDishes.filter(
      (dish) => dish.needsImage
    );

    for (let i = 0; i < dishesNeedingImages.length; i++) {
      const dish = dishesNeedingImages[i];
      console.log(
        `Processing dish ${i + 1}/${dishesNeedingImages.length}: ${
          dish.name
        } (Category: ${dish.category})`
      );

      try {
        // Try alternative image sources - Unsplash and Pexels are good for food photography
        const sources = [
          // Standard Google image search
          // {
          //   name: "Google Images",
          //   url: `https://www.google.com/search?q=${encodeURIComponent(
          //     `${dish.name} ${dish.category} food high quality photo`
          //   )}&tbm=isch`,
          //   extractFn: async () => {
          //     // Wait for the image thumbnails to load
          //     await page.waitForSelector("img.Q4LuWd", { timeout: 20000 });

          //     // Click on the first thumbnail to open the preview panel
          //     const thumbnails = await page.$$("img.Q4LuWd");
          //     if (thumbnails.length === 0) {
          //       console.log("No thumbnails found");
          //       return null;
          //     }
          //     await thumbnails[0].click();

          //     // Wait for the high-resolution image to load in the preview panel
          //     await page.waitForSelector("img.n3VNCb", { timeout: 20000 });

          //     // Extract the high-resolution image URL
          //     const imageUrl = await page.evaluate(() => {
          //       const images = Array.from(
          //         document.querySelectorAll("img.n3VNCb")
          //       );
          //       for (const img of images) {
          //         const src = img.src;
          //         if (
          //           src &&
          //           src.startsWith("http") &&
          //           !src.includes("encrypted-tbn0.gstatic.com")
          //         ) {
          //           return src;
          //         }
          //       }
          //       return null;
          //     });

          //     return imageUrl;
          //   },
          // },
          // Bing image search as a backup
          {
            name: "Bing Images",
            url: `https://www.bing.com/images/search?q=${encodeURIComponent(
              `${dish.name} ${dish.category} food photo`
            )}&form=HDRSC2`,
            extractFn: async () => {
              await page
                .waitForSelector(".mimg", { timeout: 5000 })
                .catch(() => console.log("Bing image selector timeout"));
              return await page.evaluate(() => {
                const images = Array.from(document.querySelectorAll(".mimg"));
                for (const img of images) {
                  if (
                    img.src &&
                    img.src.startsWith("http") &&
                    img.width > 100
                  ) {
                    return img.src;
                  }
                }
                return null;
              });
            },
          },
        ];

        let imageUrl = null;

        // Try each source until we find an image
        for (const source of sources) {
          if (imageUrl) break; // Skip if we already have an image

          console.log(`Trying source: ${source.name}`);
          try {
            // Navigate to the image search page
            console.log(`Navigating to: ${source.url}`);
            await page.goto(source.url, {
              waitUntil: "networkidle2",
              timeout: 60000,
            });

            // Wait for page to load fully
            await page.evaluate(() => {
              return new Promise((resolve) => setTimeout(resolve, 3000));
            });

            // Extract the image URL using the source-specific function
            const url = await source.extractFn();

            if (
              url &&
              !url.includes("productlogos") &&
              !url.includes("google.com/logos")
            ) {
              console.log(
                `✅ Found image from ${source.name}: ${url.substring(0, 50)}...`
              );
              imageUrl = url;
            } else {
              console.log(`❌ No valid image found from ${source.name}`);
            }
          } catch (err) {
            console.error(`Error with ${source.name}:`, err.message);
          }

          // Add delay between sources
          await page.evaluate(() => {
            return new Promise((resolve) => setTimeout(resolve, 2000));
          });
        }

        // If we found an image, use it
        if (imageUrl) {
          dish.image = imageUrl;
        } else {
          // Otherwise use a placeholder
          console.log(`⚠️ No image found for ${dish.name} from any source`);
          dish.image = `https://via.placeholder.com/300x200?text=${encodeURIComponent(
            dish.name
          )}`;
        }

        // Add a delay between requests to avoid getting blocked
        const delay = 5000 + Math.floor(Math.random() * 3000); // 5-8 second random delay
        console.log(`Waiting ${delay}ms before next request`);
        await page.evaluate((delay) => {
          return new Promise((resolve) => setTimeout(resolve, delay));
        }, delay);
      } catch (err) {
        console.error(`Error processing ${dish.name}:`, err);
        dish.image = `https://via.placeholder.com/300x200?text=${encodeURIComponent(
          dish.name
        )}`;
      }
    }

    // Remove the temporary property from all dishes

    selectedDishes.forEach((dish) => {
      delete dish.needsImage;
    });

    console.log("Finished processing dishes with partial image generation");
    res.json(selectedDishes);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
});



// Add this new route to your Express backend
app.post("/multipleImages", async (req, res) => {
  const dish = req.body;
  console.log(`Getting images for dish: ${dish.name}`);

  let browser = null;
  const imageCount = 4; // Number of images to fetch

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certificate-errors",
        "--ignore-certificate-errors-skip-list",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        Referer: "https://www.google.com/",
      });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });

        Object.defineProperty(navigator, "plugins", {
          get: () => [
            { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
            {
              name: "Chrome PDF Viewer",
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            },
            { name: "Native Client", filename: "internal-nacl-plugin" },  
          ],
        });
      });
      console.log("dish data "+dish.name);
      
      const bingQuery = encodeURIComponent(
        `${dish.name} ${dish.category} ${dish.description} food high quality`
      );
      const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large`;

      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const blocked = ["stylesheet", "font", "script"];
        if (blocked.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(bingUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      await page.waitForSelector("img.mimg, .iusc img, .imgpt img, img", {
        timeout: 5000,
      });

      // Extract exactly 4 image URLs
      const imageUrls = await page.evaluate((count) => {
        const getValidImageUrl = (element) => {
          if (element.dataset.src && element.dataset.src.startsWith("http"))
            return element.dataset.src;
          if (element.src && element.src.startsWith("http"))
            return element.src;
          if (element.getAttribute("m")) {
            try {
              const mData = JSON.parse(element.getAttribute("m"));
              if (mData.murl && mData.murl.startsWith("http"))
                return mData.murl;
            } catch (e) {}
          }
          return null;
        };

        const selectors = [".mimg", ".iusc img", ".imgpt img", "img"];
        const urls = [];
        
        for (const sel of selectors) {
          const imgs = document.querySelectorAll(sel);
          for (const img of imgs) {
            const url = getValidImageUrl(img);
            if (url && !urls.includes(url)) {
              urls.push(url);
              if (urls.length >= count) break;
            }
          }
          if (urls.length >= count) break;
        }

        return urls;
      }, imageCount);

      // If we didn't find enough images, add placeholder URLs
      const finalUrls = [...imageUrls];
      while (finalUrls.length < imageCount) {
        finalUrls.push(`https://via.placeholder.com/800x600?text=${encodeURIComponent(
          `${dish.category}: ${dish.name} (${finalUrls.length + 1})`
        )}`);
      }

      // Just return the array of URLs
      res.json(finalUrls);
    } catch (err) {
      console.error(`Error processing ${dish.name}:`, err);
      
      // Return placeholder URLs if there was an error
      const placeholders = Array(imageCount).fill().map((_, i) => 
        `https://via.placeholder.com/800x600?text=${encodeURIComponent(
          `${dish.category}: ${dish.name} (${i + 1})`
        )}`
      );
      
      res.json(placeholders);
    } finally {
      await page.close();
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json([]);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
});


  app.get("/", (req, res) => {
    res.send("API is live!");
  });


// // ROUTE FOR MULTIPLE IMAGES

// app.post("/multipleImages", async (req, res) => {
//   const dishes = req.body;
//   console.log(`Processing ${dishes.length} dishes for multiple images`);

//   let browser = null;
//   const concurrencyLimit = 3;
//   const imagesPerDish = 4; // Get at least 4 images per dish

//   try {
//     browser = await puppeteer.launch({
//       headless: true,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-infobars",
//         "--window-position=0,0",
//         "--ignore-certificate-errors",
//         "--ignore-certificate-errors-skip-list",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--window-size=1920,1080",
//         "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36",
//       ],
//       ignoreHTTPSErrors: true,
//     });

//     const processDish = async (dish) => {
//       const page = await browser.newPage();

//       try {
//         await page.setViewport({ width: 1920, height: 1080 });
//         await page.setUserAgent(
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36"
//         );

//         await page.setExtraHTTPHeaders({
//           "Accept-Language": "en-US,en;q=0.9",
//           Accept:
//             "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
//           Referer: "https://www.google.com/",
//         });

//         await page.evaluateOnNewDocument(() => {
//           Object.defineProperty(navigator, "webdriver", {
//             get: () => false,
//           });

//           Object.defineProperty(navigator, "plugins", {
//             get: () => [
//               { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
//               {
//                 name: "Chrome PDF Viewer",
//                 filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//               },
//               { name: "Native Client", filename: "internal-nacl-plugin" },  
//             ],
//           });
//         });

//         const bingQuery = encodeURIComponent(
//           `${dish.name} ${dish.category} ${dish.description} food high quality`
//         );
//         const bingUrl = `https://www.bing.com/images/search?q=${bingQuery}&qft=+filterui:imagesize-large`;

//         await page.setRequestInterception(true);
//         page.on("request", (req) => {
//           const blocked = ["stylesheet", "font", "script"];
//           if (blocked.includes(req.resourceType())) {
//             req.abort();
//           } else {
//             req.continue();
//           }
//         });

//         await page.goto(bingUrl, {
//           waitUntil: "networkidle2",
//           timeout: 30000,
//         });

//         await page.waitForSelector("img.mimg, .iusc img, .imgpt img, img", {
//           timeout: 5000,
//         });

//         // Initialize dish.images array if it doesn't exist
//         dish.images = [];

//         // Extract multiple image URLs
//         const imageUrls = await page.evaluate((imagesPerDish) => {
//           const getValidImageUrl = (element) => {
//             if (element.dataset.src && element.dataset.src.startsWith("http"))
//               return element.dataset.src;
//             if (element.src && element.src.startsWith("http"))
//               return element.src;
//             if (element.getAttribute("m")) {
//               try {
//                 const mData = JSON.parse(element.getAttribute("m"));
//                 if (mData.murl && mData.murl.startsWith("http"))
//                   return mData.murl;
//               } catch (e) {}
//             }
//             return null;
//           };

//           const results = [];
//           const selectors = [".mimg", ".iusc img", ".imgpt img", "img"];
          
//           for (const sel of selectors) {
//             const imgs = document.querySelectorAll(sel);
            
//             for (const img of imgs) {
//               const url = getValidImageUrl(img);
//               if (url && !results.includes(url)) {
//                 results.push(url);
                
//                 // Break once we have enough images
//                 if (results.length >= imagesPerDish) {
//                   break;
//                 }
//               }
//             }
            
//             // Break if we have enough images after checking a selector
//             if (results.length >= imagesPerDish) {
//               break;
//             }
//           }

//           return results;
//         }, imagesPerDish);

//         if (imageUrls && imageUrls.length > 0) {
//           dish.images = imageUrls;
//         } 

//         // If we couldn't find enough images, add placeholders
//         while (dish.images.length < imagesPerDish) {
//           const placeholderUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//             `${dish.category}: ${dish.name} (${dish.images.length + 1})`
//           )}`;
//           dish.images.push(placeholderUrl);
//         }

//         console.log(`Found ${dish.images.length} images for ${dish.name}`);

//       } catch (err) {
//         console.error(`Error processing ${dish.name}:`, err);
        
//         // Create placeholder images in case of error
//         dish.images = [];
//         for (let i = 0; i < imagesPerDish; i++) {
//           dish.images.push(
//             `https://via.placeholder.com/800x600?text=${encodeURIComponent(
//               `${dish.category}: ${dish.name} (${i + 1})`
//             )}`
//           );
//         }
        
//         dish.imageError = err.message;
//       } finally {
//         await page.close();
//       }
//     };

//     // Batch process dishes with concurrency limit
//     let index = 0;
//     while (index < dishes.length) {
//       const batch = dishes.slice(index, index + concurrencyLimit);
//       console.log(`Processing batch: ${index + 1} to ${index + batch.length}`);
//       await Promise.all(batch.map((dish) => processDish(dish)));

//       index += concurrencyLimit;

//       if (index < dishes.length) {
//         const delay = 2000 + Math.random() * 3000;
//         console.log(`Waiting ${Math.round(delay)}ms before next batch...`);
//         await new Promise((res) => setTimeout(res, delay));
//       }
//     }

//     console.log("Finished processing all dishes with multiple images");
//     res.json(dishes);
//   } catch (err) {
//     console.error("Server error:", err);
//     res.status(500).json({ error: err.message });
//   } finally {
//     if (browser) {
//       await browser.close();
//       console.log("Browser closed");
//     }
//   }
// });








const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



