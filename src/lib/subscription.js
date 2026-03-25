/**
 * Subscription helpers — centralised limits & checks.
 */

export const FREE_GALLERY_LIMIT = 2;
export const FREE_PHOTO_LIMIT = 15;

export function isPro(user) {
  return user?.subscription_status === 'active';
}

export function canCreateGallery(user, galleryCount) {
  if (isPro(user)) return true;
  return galleryCount < FREE_GALLERY_LIMIT;
}

export function canAddPhoto(user, photoCount) {
  if (isPro(user)) return true;
  return photoCount < FREE_PHOTO_LIMIT;
}