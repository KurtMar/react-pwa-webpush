// excludes default libs such as 'dom' conflicting with 'webworker'
/// <reference no-default-lib="true"/>
// this should be what you use in your scripts
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference lib="webworker.Iterable" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

export declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const url = '';

(() => {
  'use strict';

  const WebPush = {
    init() {
      cleanupOutdatedCaches();
      precacheAndRoute(self.__WB_MANIFEST);
      /*
      self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING')
          self.skipWaiting()
      })
      */
      self.skipWaiting();
      clientsClaim();

      self.addEventListener('push', this.notificationPush.bind(this));
      self.addEventListener('notificationclick', this.notificationClick.bind(this));
      self.addEventListener('notificationclose', this.notificationClose.bind(this));
    },

    /**
     * Handle notification push event.
     *
     * https://developer.mozilla.org/en-US/docs/Web/Events/push
     *
     * @param {NotificationEvent} event
     */
    notificationPush(event: PushEvent) {
      console.log('Received a push message', event);
      if (!(self.Notification && self.Notification.permission === 'granted')) {
        console.log('Notifications are not supported or permission not granted for showing them.');
        return;
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData
      if (event.data) {
        event.waitUntil(
          //this.sendNotification(event.data.json())
          this.sendNotification(event.data),
        );
      }
    },

    /**
     * Handle notification click event.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event
     *
     * @param {NotificationEvent} event
     */
    notificationClick(event: NotificationEvent) {
      // console.log(event.notification)

      if (event.action === 'some_action') {
        // Do something...
      } else {
        self.clients.openWindow('/');
      }
    },

    /**
     * Handle notification close event (Chrome 50+, Firefox 55+).
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclose_event
     *
     * @param {NotificationEvent} event
     */
    notificationClose(event: NotificationEvent) {
      self.registration.pushManager.getSubscription().then((subscription) => {
        if (subscription) {
          this.dismissNotification(event, subscription);
        }
      });
    },

    /**
     * Send notification to the user.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
     *
     * @param {PushMessageData|Object} data
     */
    sendNotification(data: PushMessageData) {
      const notificationData: { title: string; message: string } = data.json();
      console.log('Showing notification', notificationData);
      return self.registration.showNotification(notificationData.title, {
        body: notificationData.message,
      });
    },

    /**
     * Send request to server to dismiss a notification.
     *
     * @param  {NotificationEvent} event
     * @param  {String} subscription.endpoint
     * @return {Response}
     */
    dismissNotification(
      { notification }: { notification: Notification },
      { endpoint }: { endpoint: string },
    ): void {
      if (!notification.data || !notification.data.id) {
        return;
      }

      const data = new FormData();
      data.append('endpoint', endpoint);

      // Send a request to the server to mark the notification as read.
      fetch(`${url}/api/notifications/${notification.data.id}/dismiss`, {
        method: 'POST',
        body: data,
      });
    },
  };

  WebPush.init();
})();
