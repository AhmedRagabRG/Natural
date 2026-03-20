// Utility functions for image handling
import { cache, CACHE_KEYS } from './cache';

/**
 * Helper function to add a version query parameter to break cache
 * It uses the updatedAt timestamp if available, otherwise the current time.
 */
const addCacheVersion = (url: string, updatedAt?: string): string => {
  if (!url || url === "/assets/du.png") return url;
  const version = updatedAt ? new Date(updatedAt).getTime() : new Date().getTime();
  // Check if URL already has a query string
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
};

/**
 * Get the first image URL from a comma-separated list of image IDs
 * @param images - String or number containing comma-separated image IDs
 * @returns Promise<string> - The image URL or default fallback
 */
export const getFirstImageUrl = async (images?: string | number): Promise<string> => {
  if (!images) return "/assets/du.png";
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
      
      const data = fileData.data || fileData;

      // Combine file_path and file_name to create full image URL
      if (data.file_path && data.file_name) {
        imageUrl = `${data.file_path}${data.file_name}`;
        // Apply cache breaking version
        imageUrl = addCacheVersion(imageUrl, data.updated_at);
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

          const data = fileData.data || fileData;
          if (data.file_path && data.file_name) {
            imageUrl = `${data.file_path}${data.file_name}`;
            // Apply cache breaking version
            imageUrl = addCacheVersion(imageUrl, data.updated_at);
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
      
      const data = fileData.data || fileData;

      // Combine file_path and file_name to create full image URL
      if (data.file_path && data.file_name) {
        imageUrl = `${data.file_path}${data.file_name}`;
        // Apply cache breaking version
        imageUrl = addCacheVersion(imageUrl, data.updated_at);
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