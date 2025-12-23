import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload profile photo to Firebase Storage
 * @param userId - User's UID
 * @param file - Image file to upload
 * @returns Download URL of the uploaded image
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  // Create a unique filename with timestamp
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `profile_${timestamp}.${extension}`;
  
  // Reference to the file location in Storage
  const storageRef = ref(storage, `profile-photos/${userId}/${filename}`);

  try {
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
      },
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Profile photo uploaded:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error('Failed to upload profile photo. Please try again.');
  }
}

/**
 * Delete profile photo from Firebase Storage
 * @param photoURL - URL of the photo to delete
 */
export async function deleteProfilePhoto(photoURL: string): Promise<void> {
  try {
    // Extract the path from the URL
    const storageRef = ref(storage, photoURL);
    await deleteObject(storageRef);
    console.log('Profile photo deleted');
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.log('Could not delete old photo (might not exist):', error);
  }
}

// ==========================================
// RANDOM DISPLAY NAME GENERATOR
// ==========================================

const adjectives = [
  'Swift', 'Shadow', 'Cyber', 'Neon', 'Quantum', 'Stealth', 'Digital', 'Crypto',
  'Phantom', 'Silent', 'Dark', 'Bright', 'Electric', 'Cosmic', 'Atomic', 'Binary',
  'Neural', 'Virtual', 'Matrix', 'Pixel', 'Laser', 'Turbo', 'Mega', 'Ultra',
  'Sonic', 'Thunder', 'Storm', 'Frost', 'Fire', 'Steel', 'Iron', 'Titanium',
  'Mystic', 'Rogue', 'Apex', 'Prime', 'Alpha', 'Omega', 'Zero', 'Nova',
  'Astro', 'Hyper', 'Nitro', 'Vortex', 'Flux', 'Pulse', 'Spark', 'Blaze'
];

const nouns = [
  'Shield', 'Hawk', 'Wolf', 'Phoenix', 'Dragon', 'Knight', 'Ninja', 'Samurai',
  'Ranger', 'Hunter', 'Guardian', 'Sentinel', 'Warden', 'Cipher', 'Hacker', 'Coder',
  'Byte', 'Node', 'Core', 'Grid', 'Net', 'Web', 'Cloud', 'Stream',
  'Blade', 'Arrow', 'Bolt', 'Strike', 'Force', 'Edge', 'Peak', 'Ace',
  'Fox', 'Bear', 'Lion', 'Tiger', 'Falcon', 'Raven', 'Cobra', 'Viper',
  'Titan', 'Oracle', 'Sage', 'Ghost', 'Specter', 'Agent', 'Pilot', 'Scout'
];

const suffixes = [
  '', '', '', '', // Empty suffixes to add variety (more common)
  '42', '77', '99', '101', '256', '404', '007', '369',
  'X', 'Z', 'Pro', 'Max', 'One', 'Neo', 'Zero', 'Prime'
];

/**
 * Generate a random anonymous display name
 * Format: Adjective + Noun + Optional Suffix
 * Example: "CyberPhoenix42", "ShadowNinja", "QuantumHawkPro"
 */
export function generateRandomDisplayName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${adjective}${noun}${suffix}`;
}

/**
 * Generate a hashed/anonymous display name from email
 * Creates a deterministic but anonymous name based on email hash
 */
export function generateHashedDisplayName(email: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash to select consistent adjective and noun
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  const suffixIndex = Math.abs(hash >> 16) % suffixes.length;
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${suffixes[suffixIndex]}`;
}

/**
 * Generate multiple random name suggestions
 */
export function generateNameSuggestions(count: number = 5): string[] {
  const suggestions: string[] = [];
  const usedNames = new Set<string>();
  
  while (suggestions.length < count) {
    const name = generateRandomDisplayName();
    if (!usedNames.has(name)) {
      usedNames.add(name);
      suggestions.push(name);
    }
  }
  
  return suggestions;
}

