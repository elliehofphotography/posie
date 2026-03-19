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
  
  return DEFAULT_POSE_CATEGORIES.filter(cat => categoryValues.includes(cat.value))
    .sort((a, b) => categoryValues.indexOf(a.value) - categoryValues.indexOf(b.value));
}