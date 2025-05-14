import admin from 'firebase-admin';
import { db } from '../config/db.js';
import { eq } from 'drizzle-orm';
import { users } from '../models/schema.js';

// Inicjalizacja Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Interfejs dla danych powiadomienia
interface NotificationPayload {
  title: string;
  body: string;
}

// Interfejs dla danych dodatkowych
interface DataPayload {
  [key: string]: string;
}

/**
 * Wysyła powiadomienie FCM do konkretnego urządzenia
 * @param token Token FCM urządzenia odbiorcy
 * @param notification Obiekt z tytułem i treścią powiadomienia
 * @param data Dodatkowe dane przesyłane z powiadomieniem
 */
export const sendFCMNotification = async (
  token: string,
  notification: NotificationPayload,
  data: DataPayload
): Promise<boolean> => {
  const message: admin.messaging.Message = {
    token, // Token urządzenia docelowego
    notification, // Widoczne powiadomienie (tytuł i treść)
    data, // Niewidoczne dane dla aplikacji
    android: { priority: 'high' } // Wysoki priorytet dla natychmiastowego dostarczenia
  };

  try {
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error('Błąd wysyłania FCM:', error);
    
    // Automatyczne czyszczenie nieaktualnych tokenów
    if (isInvalidTokenError(error)) {
      await removeInvalidToken(token);
    }
    
    return false;
  }
};

// Sprawdza czy błąd dotyczy nieaktualnego tokenu
const isInvalidTokenError = (error: any): boolean => {
  return error.code === 'messaging/invalid-registration-token' || 
         error.code === 'messaging/registration-token-not-registered';
};

// Usuwa nieaktualny token z bazy danych
const removeInvalidToken = async (token: string): Promise<void> => {
  await db.update(users)
    .set({ fcmToken: null })
    .where(eq(users.fcmToken, token));
};