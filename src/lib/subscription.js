/**
 * Subscription helpers — centralised limits & checks.
 * Currently all features are free/unlimited.
 */

export const FREE_GALLERY_LIMIT = Infinity;
export const FREE_PHOTO_LIMIT = Infinity;

export function isPro(user) {
  return true; // Everything free for now
}

export function canCreateGallery(user, galleryCount) {
  return true;
}

export function canAddPhoto(user, photoCount) {
  return true;
}