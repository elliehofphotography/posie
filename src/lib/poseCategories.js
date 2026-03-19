// Default pose categories
export const DEFAULT_POSE_CATEGORIES = [
  { value: 'standing', label: 'Standing' },
  { value: 'sitting', label: 'Sitting' },
  { value: 'walking', label: 'Walking' },
  { value: 'close_up', label: 'Close-up' },
  { value: 'wide_shot', label: 'Wide Shot' },
  { value: 'detail', label: 'Detail' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'candid', label: 'Candid' },
  { value: 'other', label: 'Other' },
];

export const POSE_CATEGORY_MAP = Object.fromEntries(
  DEFAULT_POSE_CATEGORIES.map(cat => [cat.value, cat.label])
);

export function getUserPoseCategories(userCategories) {
  // If user has custom categories, use them; otherwise use defaults
  const categoryValues = userCategories && userCategories.length > 0
    ? userCategories
    : DEFAULT_POSE_CATEGORIES.map(c => c.value);
  
  // Build map of default categories
  const defaultMap = Object.fromEntries(DEFAULT_POSE_CATEGORIES.map(c => [c.value, c]));
  
  // Map category values to labels, supporting custom categories
  return categoryValues.map(value => {
    if (defaultMap[value]) {
      return defaultMap[value];
    } else {
      // Custom category - create on the fly
      return { value, label: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') };
    }
  });
}