/**
 * User Model
 * 
 * Mongoose schema and model for User entity with:
 * - Password hashing and validation
 * - JWT token generation
 * - Address management
 * - Role-based access control
 * - Account status management
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IUserDocument, IAddress } from '@/types/user';
import { env } from '@/lib/env';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

// Address sub-schema (drop generic to avoid complex union types)
const AddressSchema = new Schema({
  id: {
    type: String,
    required: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [500, 'Address cannot exceed 500 characters'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [100, 'State cannot exceed 100 characters'],
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    match: [/^[1-9][0-9]{5}$/, 'Please provide a valid pincode'],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

// User schema definition
const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: function() { return !this.oauthProvider; },
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number'],
      sparse: true,
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Role must be either customer or admin',
      },
      default: 'customer',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    addresses: [AddressSchema],
    lastLoginAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    oauthProvider: {
      type: String,
      enum: ['google', null],
      default: null,
    },
    oauthId: {
      type: String,
      sparse: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Helper to detect if a string is already a bcrypt hash
function isBcryptHash(value: any): boolean {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
}

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = env.BCRYPT_SALT_ROUNDS;
    if (typeof this.password !== 'string') {
      return next(new Error('Password must be a string'));
    }

    // Avoid double hashing if password already looks like a bcrypt hash
    if (isBcryptHash(this.password)) {
      return next();
    }

    bcrypt
      .hash(this.password, saltRounds)
      .then((hashed: string) => {
        this.password = hashed;
        next();
      })
      .catch((error: Error) => next(error));
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to ensure only one default address
UserSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    
    if (defaultAddresses.length > 1) {
      this.addresses.forEach((addr, index) => {
        if (index > 0 && addr.isDefault) {
          addr.isDefault = false;
        }
      });
    } else if (defaultAddresses.length === 0 && this.addresses.length > 0) {
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    const stored = this.password as string;

    // If the stored value is not a bcrypt hash (legacy/plaintext), perform a one-time migration
    if (!isBcryptHash(stored)) {
      // Compare as plaintext for legacy records
      const matches = typeof stored === 'string' && stored.length > 0 && candidatePassword === stored;
      if (!matches) return false;

      // Auto-migrate: hash the password and persist so future logins use bcrypt
      const saltRounds = env.BCRYPT_SALT_ROUNDS;
      const hashed = await bcrypt.hash(candidatePassword, saltRounds);
      this.password = hashed;
      await this.save();
      return true;
    }

    // Normal bcrypt comparison
    return await bcrypt.compare(candidatePassword, stored);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate JWT token
UserSchema.methods.generateAuthToken = function (): string {
  const payload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  };

return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
  expiresIn: env.JWT_EXPIRES_IN,
} as jwt.SignOptions);


};

// Instance method to generate refresh token
UserSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    userId: this._id.toString(),
    tokenVersion: 1,
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  }as jwt.SignOptions);
};

// Instance method to add address
UserSchema.methods.addAddress = async function (addressData: Omit<IAddress, 'id'>): Promise<void> {
  const newAddress: IAddress = {
    ...addressData,
    id: new mongoose.Types.ObjectId().toString(),
  };
  
  if (this.addresses.length === 0 || addressData.isDefault) {
    this.addresses.forEach((addr: IAddress) => {
      addr.isDefault = false;
    });
    newAddress.isDefault = true;
  }
  
  this.addresses.push(newAddress);
  await this.save();
};

// Instance method to update address
UserSchema.methods.updateAddress = async function (
  addressId: string, 
  updates: Partial<IAddress>
): Promise<void> {
  const address = this.addresses.find((addr: IAddress) => addr.id === addressId);
  if (!address) {
    throw new Error('Address not found');
  }
  
  if (updates.isDefault) {
    this.addresses.forEach((addr: IAddress) => {
      if (addr.id !== addressId) {
        addr.isDefault = false;
      }
    });
  }
  
  Object.assign(address, updates);
  await this.save();
};

// Instance method to remove address
UserSchema.methods.removeAddress = async function (addressId: string): Promise<void> {
  const addressIndex = this.addresses.findIndex((addr: IAddress) => addr.id === addressId);
  if (addressIndex === -1) {
    throw new Error('Address not found');
  }
  
  const wasDefault = this.addresses[addressIndex].isDefault;
  this.addresses.splice(addressIndex, 1);
  
  if (wasDefault && this.addresses.length > 0) {
    this.addresses[0].isDefault = true;
  }
  
  await this.save();
};

// Static method to find user by email with password
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase(), isActive: true }).select('+password');
};

// Create and export the User model
const User: Model<IUserDocument> = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);

export default User;