import { supabase } from '../supabaseClient';

/**
 * Checks if there is an active, verified, non-anonymous user in Supabase.
 * Returns the user object if authenticated, or null otherwise.
 */
export async function getAuthenticatedUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user || data.user.is_anonymous) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Guarded navigation to "Add Craft" (/capture).
 * If !supabase.auth.getUser(), redirects the user immediately to the Email/Phone OTP login screen (/login).
 */
export async function handleAddCraftNavigation(navigate, e) {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    navigate('/login', { state: { from: '/capture' } });
    return false;
  }
  navigate('/capture');
  return true;
}
