// src/lib/snsValidator.ts
import crypto from 'crypto';
import https from 'https';
import logger from './logger';

/**
 * Valida la autenticidad de un mensaje SNS
 */
export async function validateSnsMessage(message: any): Promise<boolean> {
  // Verificar que el mensaje tiene la estructura esperada
  if (!message || !message.Type || !message.SigningCertURL || !message.Signature) {
    logger.warn('Invalid SNS message structure');
    return false;
  }

  try {
    // Verificar que el certificado proviene de AWS
    const certUrl = new URL(message.SigningCertURL);
    if (certUrl.protocol !== 'https:' || 
        !certUrl.hostname.endsWith('.amazonaws.com') || 
        certUrl.pathname.indexOf('..') >= 0) {
      logger.warn(`Invalid certificate URL: ${message.SigningCertURL}`);
      return false;
    }

    // Obtener el certificado
    const cert = await fetchCertificate(message.SigningCertURL);
    
    // Construir la cadena a verificar
    const signatureVersion = message.SignatureVersion;
    if (signatureVersion !== '1') {
      logger.warn(`Unsupported signature version: ${signatureVersion}`);
      return false;
    }

    // Para la versión 1, la cadena a verificar incluye ciertos campos según el tipo de mensaje
    let stringToSign = '';
    if (message.Type === 'Notification') {
      stringToSign = [
        'Message', message.Message,
        'MessageId', message.MessageId,
        'Subject', message.Subject || '',
        'Timestamp', message.Timestamp,
        'TopicArn', message.TopicArn,
        'Type', message.Type
      ].join('\n') + '\n';
    } else if (message.Type === 'SubscriptionConfirmation' || message.Type === 'UnsubscribeConfirmation') {
      stringToSign = [
        'Message', message.Message,
        'MessageId', message.MessageId,
        'SubscribeURL', message.SubscribeURL,
        'Timestamp', message.Timestamp,
        'Token', message.Token,
        'TopicArn', message.TopicArn,
        'Type', message.Type
      ].join('\n') + '\n';
    } else {
      logger.warn(`Unknown message type: ${message.Type}`);
      return false;
    }

    // Verificar la firma
    const signature = Buffer.from(message.Signature, 'base64');
    const verifier = crypto.createVerify('sha1WithRSAEncryption');
    verifier.update(stringToSign);
    const isValid = verifier.verify(cert, signature);
    
    if (!isValid) {
      logger.warn('SNS message signature verification failed');
    }
    
    return isValid;
  } catch (error:any) {
    logger.error(error, 'Error validating SNS message');
    return false;
  }
}

/**
 * Obtiene el certificado de AWS
 */
async function fetchCertificate(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let cert = '';
      res.on('data', (chunk) => {
        cert += chunk;
      });
      res.on('end', () => {
        resolve(cert);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}