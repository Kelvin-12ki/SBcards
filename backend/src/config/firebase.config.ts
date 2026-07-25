import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseConfig implements OnModuleInit {
  private readonly logger = new Logger(FirebaseConfig.name);
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
  }

  onModuleInit(): void {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn(
        'Firebase configuration is incomplete. Firebase Auth will not be available.',
      );
      return;
    }

    // Handle the case where the private key is stored with literal \n characters
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: formattedPrivateKey,
          clientEmail,
        }),
      });
      this.logger.log('Firebase Admin SDK initialized successfully');
    }
  }
}

/**
 * Factory function to initialize Firebase Admin SDK.
 * Should be called once during application bootstrap.
 */
export function initializeFirebase(configService: ConfigService): void {
  const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
  const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
  const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');

  if (!projectId || !privateKey || !clientEmail) {
    Logger.warn(
      'Firebase configuration is incomplete. Firebase Auth will not be available.',
      FirebaseConfig.name,
    );
    return;
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail,
      }),
    });
    Logger.log('Firebase Admin SDK initialized successfully', FirebaseConfig.name);
  }
}

export default admin;
