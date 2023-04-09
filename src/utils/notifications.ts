const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const url = '';

export const isPushNotificationSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const askUserPermission = async () => {
  return await Notification.requestPermission();
};

export const hasUserPermission = () => {
  return Notification.permission === 'granted';
};

export const getSwRegistration = async () => {
  const swRegistration = await navigator.serviceWorker.getRegistration(document.URL);
  return swRegistration;
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const createNotificationSubscription = async (swRegistration: ServiceWorkerRegistration) => {
  const subscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });
  return subscription;
};

export const removeNotificationSubscription = async (swRegistration: ServiceWorkerRegistration) => {
  const subscription = await getUserSubscription(swRegistration);
  if (subscription) await subscription.unsubscribe();
};

export const sendNotification = async (subscription: PushSubscription /*, dataToSend = {}*/) => {
  await fetch(`${url}/api/notifications`, {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json',
    },
  });
};

export const sendNotificationToAll = async (dataToSend = {}) => {
  try {
    await fetch(`${url}/api/notifications/broadcast`, {
      method: 'POST',
      body: JSON.stringify(dataToSend),
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (error) {
    const e = error as Error;
    console.error(e);
    alert(e?.message);
  }
};

export const subscribeUser = async (subscription: PushSubscription) => {
  await fetch(`${url}/api/notifications/subscribe`, {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json',
    },
  });
};

export const unsubscribeUser = async (subscription: PushSubscription) => {
  await fetch(`${url}/api/notifications/unsubscribe`, {
    method: 'DELETE',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json',
    },
  });
};

export const hasSubscription = async (swRegistration?: ServiceWorkerRegistration) => {
  const reg = swRegistration || (await getSwRegistration());
  if (!reg) return false;
  const subscription = await reg.pushManager.getSubscription();
  return subscription !== null;
};

export const getUserSubscription = async (swRegistration: ServiceWorkerRegistration) => {
  const subscription = await swRegistration.pushManager.getSubscription();
  return subscription;
};

export const configurePushSub = async (): Promise<boolean> => {
  try {
    console.log('configuring push subscription...');
    if (!publicVapidKey) throw new Error('VAPID_PUBLIC_KEY is not set.');
    const swRegistration = await navigator.serviceWorker.ready;
    // const swRegistration = await getSwRegistration();
    if (!swRegistration) {
      console.warn('Service Worker not registered');
      return false;
    }
    if (hasUserPermission() && (await hasSubscription(swRegistration))) {
      console.log('User IS subscribed.');
      const subscription = await getUserSubscription(swRegistration);
      console.log(subscription);
      // Re-subscribe
      if (subscription) {
        console.log('unsubscribing from server...');
        await unsubscribeUser(subscription);
        console.log('unsubscribing...');
        await subscription.unsubscribe();
        console.log('re-subscribing...');
        const newSubscription = await createNotificationSubscription(swRegistration);
        console.log('saving new subscription to server...');
        await subscribeUser(newSubscription);
        console.log('new subscription saved!');
        console.log(newSubscription);
        return true;
      } else {
        console.log('no subscription found even though user is subscribed.');
        return false;
      }
    } else {
      console.log('User is NOT subscribed.');
      const status = await askUserPermission();
      if (status === 'granted') {
        console.log('User accepted the push notification permission.');
        const subscription = await createNotificationSubscription(swRegistration);
        console.log(subscription);
        await subscribeUser(subscription);
        return true;
      } else {
        console.warn('User denied the push notification permission.');
        return false;
      }
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};
