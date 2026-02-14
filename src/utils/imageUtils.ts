// Utility functions for image handling
import { cache, CACHE_KEYS } from './cache';

/**
 * Get the first image URL from a comma-separated list of image IDs
 * @param images - String or number containing comma-separated image IDs
 * @returns Promise<string> - The image URL or default fallback
 */
export const getFirstImageUrl = async (images?: string | number): Promise<string> => {
  if (!images) return "/assets/du.png";
  console.log(images)
  // Convert to string if it's a number
  const imagesStr = typeof images === 'number' ? images.toString() : images;
  
  const imageIds = imagesStr.split(',');
  const firstImageId = imageIds[0]?.trim();
  
  if (!firstImageId) return "/assets/du.png";
  
  // Check cache first
  const cacheKey = CACHE_KEYS.IMAGE_URL(firstImageId);
  const cachedUrl = cache.get<string>(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  try {
    const response = await fetch(`/api/files/${firstImageId}`);
    if (response.ok) {
      const fileData = await response.json();
      let imageUrl = "/assets/du.png";
      
      // Combine file_path and file_name to create full image URL
      if (fileData.data?.file_path && fileData.data?.file_name) {
        imageUrl = `${fileData.data.file_path}${fileData.data.file_name}`;
      }
      // Handle different response structure for offer page
      else if (fileData.file_path && fileData.file_name) {
        imageUrl = `${fileData.file_path}${fileData.file_name}`;
      }
      
      // Cache the result for 10 minutes
      cache.set(cacheKey, imageUrl, 10 * 60 * 1000);
      return imageUrl;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  }
  
  // Cache the fallback image for 5 minutes to avoid repeated failed requests
  cache.set(cacheKey, "/assets/du.png", 5 * 60 * 1000);
  return "/assets/du.png";
};

/**
 * Get ALL image URLs from a comma-separated list of image IDs
 * @param images - String or number containing comma-separated image IDs
 * @returns Promise<string[]> - Array of image URLs
 */
export const getAllImageUrls = async (images?: string | number): Promise<string[]> => {
  if (!images) return ["/assets/du.png"];

  const imagesStr = typeof images === 'number' ? images.toString() : images;
  const imageIds = imagesStr.split(',').map(id => id.trim()).filter(Boolean);

  if (imageIds.length === 0) return ["/assets/du.png"];

  const urls = await Promise.all(
    imageIds.map(async (imageId) => {
      const cacheKey = CACHE_KEYS.IMAGE_URL(imageId);
      const cachedUrl = cache.get<string>(cacheKey);
      if (cachedUrl) return cachedUrl;

      try {
        const response = await fetch(`/api/files/${imageId}`);
        if (response.ok) {
          const fileData = await response.json();
          let imageUrl = "/assets/du.png";

          if (fileData.data?.file_path && fileData.data?.file_name) {
            imageUrl = `${fileData.data.file_path}${fileData.data.file_name}`;
          } else if (fileData.file_path && fileData.file_name) {
            imageUrl = `${fileData.file_path}${fileData.file_name}`;
          }

          cache.set(cacheKey, imageUrl, 10 * 60 * 1000);
          return imageUrl;
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }

      cache.set(cacheKey, "/assets/du.png", 5 * 60 * 1000);
      return "/assets/du.png";
    })
  );

  // Filter out duplicates and fallback-only results
  const unique = [...new Set(urls)];
  return unique.length > 0 ? unique : ["/assets/du.png"];
};

/**
 * Get the second image URL from a comma-separated list of image IDs
 * Falls back to first image if second is not available
 * @param images - String or number containing comma-separated image IDs
 * @returns Promise<string> - The image URL or default fallback
 */
export const getSecondImageUrl = async (images?: string | number): Promise<string> => {
  if (!images) return "/assets/du.png";
  
  // Convert to string if it's a number
  const imagesStr = typeof images === 'number' ? images.toString() : images;
  
  const imageIds = imagesStr.split(',');
  // Use second image if available, otherwise fall back to first
  const targetImageId = imageIds.length > 1 ? imageIds[1]?.trim() : imageIds[0]?.trim();
  
  if (!targetImageId) return "/assets/du.png";
  
  // Check cache first
  const cacheKey = CACHE_KEYS.IMAGE_URL(`second_${targetImageId}`);
  const cachedUrl = cache.get<string>(cacheKey);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  try {
    const response = await fetch(`/api/files/${targetImageId}`);
    if (response.ok) {
      const fileData = await response.json();
      let imageUrl = "/assets/du.png";
      
      // Combine file_path and file_name to create full image URL
      if (fileData.data?.file_path && fileData.data?.file_name) {
        imageUrl = `${fileData.data.file_path}${fileData.data.file_name}`;
      }
      
      // Cache the result for 10 minutes
      cache.set(cacheKey, imageUrl, 10 * 60 * 1000);
      return imageUrl;
    }
  } catch (error) {
    console.error('Error fetching image:', error);
  }
  
  // Cache the fallback image for 5 minutes to avoid repeated failed requests
  cache.set(cacheKey, "/assets/du.png", 5 * 60 * 1000);
  return "/assets/du.png";
};