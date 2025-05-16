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
    origin: ["http://localhost:5173", "http://localhost:3000","https://www.cravings.live"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

console.log("Current working directory:", process.cwd());


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

        const bingQuery = encodeURIComponent(`${dish.name}`);
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
              `${dish.name}`
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
      console.log("dish data " + dish.name);

      const bingQuery = encodeURIComponent(`${dish.name}`);
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
          if (element.src && element.src.startsWith("http")) return element.src;
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
        finalUrls.push(
          `https://via.placeholder.com/800x600?text=${encodeURIComponent(
            `${dish.category}: ${dish.name} (${finalUrls.length + 1})`
          )}`
        );
      }

      // Just return the array of URLs
      res.json(finalUrls);
    } catch (err) {
      console.error(`Error processing ${dish.name}:`, err);

      // Return placeholder URLs if there was an error
      const placeholders = Array(imageCount)
        .fill()
        .map(
          (_, i) =>
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



// Add this new route before the app.listen call
app.post("/generateAIImages", async (req, res) => {
  const dishes = req.body;
  console.log(`Processing ${dishes.length} dishes for AI image generation`);

  try {
    const processedDishes = [];
    const maxRetries = 2; // Maximum number of retries per dish

    // Process dishes sequentially
    for (let i = 0; i < dishes.length; i++) {
      const dish = dishes[i];
      console.log(`Processing dish ${i + 1}/${dishes.length}: ${dish.name}`);

      let imageUrl = null;
      let retryCount = 0;

      while (!imageUrl && retryCount <= maxRetries) {
        try {
          // Create a prompt from the dish details
          const prompt = encodeURIComponent(`${dish.image_prompt}`);

          // Generate image URL using Pollinations.ai
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${prompt}?width=500&height=500&model=flux`;

          // Fetch the image to verify it's accessible
          const response = await fetch(pollinationsUrl);

          if (response.ok) {
            // Check if the response is actually an image
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.startsWith("image/")) {
              imageUrl = pollinationsUrl;
              console.log(`✅ Successfully generated image for ${dish.name}`);
            } else {
              throw new Error("Response is not an image");
            }
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (err) {
          console.error(
            `Attempt ${retryCount + 1} failed for ${dish.name}:`,
            err.message
          );
          retryCount++;

          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000;
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // Add the dish to processed dishes with either the generated image or a placeholder
      processedDishes.push({
        ...dish,
        image:
          imageUrl ||
          `https://via.placeholder.com/500x500?text=${encodeURIComponent(
            `${dish.category}: ${dish.name}`
          )}`,
        imageError: !imageUrl
          ? "Failed to generate image after multiple attempts"
          : undefined,
      });

      // Add a small delay between dishes to avoid overwhelming the API
      if (i < dishes.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("Finished processing all dishes with AI image generation");
    console.log(processedDishes);
    res.json(processedDishes);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 8000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});