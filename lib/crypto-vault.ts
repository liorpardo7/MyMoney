import sodium from 'libsodium-wrappers'

let initialized = false

async function ensureInitialized() {
  if (!initialized) {
    await sodium.ready
    initialized = true
  }
}

export interface VaultEntry {
  id: string
  encrypted: string
  createdAt: Date
  accessedAt: Date
}

class CryptoVault {
  private passcode: string | null = null
  private key: Uint8Array | null = null

  async unlock(passcode: string): Promise<boolean> {
    await ensureInitialized()
    
    try {
      // Derive key from passcode using a simple hash for demo
      // In production, use proper key derivation (PBKDF2, Argon2, etc.)
      const hash = sodium.crypto_generichash(32, passcode)
      this.key = hash
      this.passcode = passcode
      return true
    } catch (error) {
      console.error('Failed to unlock vault:', error)
      return false
    }
  }

  async encrypt(secret: string): Promise<string> {
    await ensureInitialized()
    
    if (!this.key) {
      throw new Error('Vault is locked. Call unlock() first.')
    }

    const message = sodium.from_string(secret)
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = sodium.crypto_secretbox_easy(message, nonce, this.key)
    
    // Combine nonce + ciphertext and encode as base64
    const combined = new Uint8Array(nonce.length + ciphertext.length)
    combined.set(nonce)
    combined.set(ciphertext, nonce.length)
    
    return sodium.to_base64(combined)
  }

  async decrypt(cipher: string): Promise<string> {
    await ensureInitialized()
    
    if (!this.key) {
      throw new Error('Vault is locked. Call unlock() first.')
    }

    try {
      const combined = sodium.from_base64(cipher)
      const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES)
      const ciphertext = combined.slice(sodium.crypto_secretbox_NONCEBYTES)
      
      const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, this.key)
      return sodium.to_string(decrypted)
    } catch (error) {
      throw new Error('Failed to decrypt: Invalid cipher or wrong key')
    }
  }

  isUnlocked(): boolean {
    return this.key !== null
  }

  lock(): void {
    if (this.key) {
      sodium.memzero(this.key)
    }
    this.key = null
    this.passcode = null
  }
}

export const vault = new CryptoVault()

// Utility functions for storing/retrieving vault entries
export async function storeSecret(id: string, secret: string): Promise<void> {
  const encrypted = await vault.encrypt(secret)
  
  // In a real app, store this in a secure local storage or encrypted file
  // For demo, we'll use localStorage with a prefix
  if (typeof window !== 'undefined') {
    localStorage.setItem(`vault:${id}`, JSON.stringify({
      id,
      encrypted,
      createdAt: new Date().toISOString(),
      accessedAt: new Date().toISOString()
    }))
  }
}

export async function retrieveSecret(id: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`vault:${id}`)
    if (!stored) return null
    
    try {
      const entry = JSON.parse(stored) as VaultEntry
      
      // Update access time
      entry.accessedAt = new Date()
      localStorage.setItem(`vault:${id}`, JSON.stringify(entry))
      
      return await vault.decrypt(entry.encrypted)
    } catch (error) {
      console.error('Failed to retrieve secret:', error)
      return null
    }
  }
  
  return null
}