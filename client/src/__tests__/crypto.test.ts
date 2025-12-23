/**
 * Cryptography Module Tests
 * Critical for acquisition - proves real crypto implementation
 */

import { 
  sha256Sync, 
  hashString, 
  generateSecureId,
  generateKeyId,
  generateSignatureSync
} from '../lib/crypto';

describe('Cryptography Module', () => {
  describe('sha256Sync', () => {
    it('should produce consistent 64-character hex output', () => {
      const hash = sha256Sync('test message');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = sha256Sync('message1');
      const hash2 = sha256Sync('message2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce same hash for same input (deterministic)', () => {
      const hash1 = sha256Sync('consistent input');
      const hash2 = sha256Sync('consistent input');
      expect(hash1).toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = sha256Sync('');
      expect(hash).toHaveLength(64);
      // Known SHA-256 hash of empty string
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should handle unicode characters', () => {
      const hash = sha256Sync('Hello 世界 🌍');
      expect(hash).toHaveLength(64);
    });
  });

  describe('hashString', () => {
    it('should produce consistent short hash', () => {
      const hash = hashString('test');
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[a-f0-9]{16}$/);
    });
  });

  describe('generateSecureId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateSecureId('test_');
      const id2 = generateSecureId('test_');
      expect(id1).not.toBe(id2);
    });

    it('should include prefix', () => {
      const id = generateSecureId('prefix_');
      expect(id.startsWith('prefix_')).toBe(true);
    });

    it('should generate correct length', () => {
      const id = generateSecureId('', 16);
      expect(id).toHaveLength(32); // 16 bytes = 32 hex chars
    });
  });

  describe('generateKeyId', () => {
    it('should generate key with correct prefix', () => {
      const keyId = generateKeyId();
      expect(keyId.startsWith('key_')).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateKeyId();
      const key2 = generateKeyId();
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateSignatureSync', () => {
    it('should produce signature with correct prefix', () => {
      const sig = generateSignatureSync('test data');
      expect(sig.startsWith('sig_')).toBe(true);
    });

    it('should produce consistent length', () => {
      const sig = generateSignatureSync('test data');
      expect(sig).toHaveLength(36); // 'sig_' + 32 chars
    });

    it('should produce same signature for same input and secret', () => {
      const sig1 = generateSignatureSync('data', 'secret');
      const sig2 = generateSignatureSync('data', 'secret');
      expect(sig1).toBe(sig2);
    });
  });
});

