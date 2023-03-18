import { useCallback } from 'react';
import { atom, useRecoilState } from 'recoil';

import { configurePushSub, hasSubscription } from '@/utils/notifications';

import type { Actions } from './types';

const isSubscribedState = atom<boolean>({
  key: 'subscription-state',
  default: false,
});

function useSubscription(): [boolean, Actions] {
  const [isSubscribed, setIsSubscribed] = useRecoilState(isSubscribedState);

  const subscribe = useCallback(async () => {
    const isSubscribed = await configurePushSub();
    setIsSubscribed(isSubscribed);
  }, [setIsSubscribed]);

  const checkSubscription = useCallback(async () => {
    setIsSubscribed(await hasSubscription());
  }, [setIsSubscribed]);

  return [isSubscribed, { subscribe, checkSubscription }];
}

export default useSubscription;
