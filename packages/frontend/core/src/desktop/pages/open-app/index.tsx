import { OpenInAppPage } from '@affine/core/modules/open-in-app/views/open-in-app-page';
import { appSchemes } from '@affine/core/utils/channel';
import type { GetCurrentUserQuery } from '@affine/graphql';
import { fetcher, getCurrentUserQuery } from '@affine/graphql';
import type { LoaderFunction } from 'react-router-dom';
import { useLoaderData, useSearchParams } from 'react-router-dom';

interface LoaderData {
  action: 'url' | 'signin-redirect';
  currentUser?: GetCurrentUserQuery['currentUser'];
}

const OpenUrl = () => {
  const [params] = useSearchParams();
  const urlToOpen = params.get('url');

  if (!urlToOpen) {
    return null;
  }

  params.delete('url');

  const urlObj = new URL(urlToOpen || '');

  params.forEach((v, k) => {
    urlObj.searchParams.set(k, v);
  });

  return <OpenInAppPage urlToOpen={urlObj.toString()} />;
};

/**
 * @deprecated
 */
const OpenOAuthJwt = () => {
  const { currentUser } = useLoaderData() as LoaderData;
  const [params] = useSearchParams();

  const maybeScheme = appSchemes.safeParse(params.get('scheme'));
  const scheme = maybeScheme.success ? maybeScheme.data : 'affine';
  const next = params.get('next');

  if (!currentUser || !currentUser?.token?.sessionToken) {
    return null;
  }

  const urlToOpen = `${scheme}://signin-redirect?token=${
    currentUser.token.sessionToken
  }&next=${next || ''}`;

  return <OpenInAppPage urlToOpen={urlToOpen} />;
};

export const Component = () => {
  const { action } = useLoaderData() as LoaderData;

  if (action === 'url') {
    return <OpenUrl />;
  } else if (action === 'signin-redirect') {
    return <OpenOAuthJwt />;
  }
  return null;
};

export const loader: LoaderFunction = async args => {
  const action = args.params.action || '';

  if (action === 'signin-redirect') {
    const res = await fetcher({
      query: getCurrentUserQuery,
    }).catch(console.error);

    return {
      action,
      currentUser: res?.currentUser || null,
    };
  } else {
    return {
      action,
    };
  }
};
