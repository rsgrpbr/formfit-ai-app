import { redirect } from 'next/navigation';

// Settings moved to /profile
export default function SettingsRedirect() {
  redirect('/profile');
}
