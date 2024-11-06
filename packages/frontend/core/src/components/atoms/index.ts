import { atom } from 'jotai';

// modal atoms
export const openWorkspacesModalAtom = atom(false);
/**
 * @deprecated use `useSignOut` hook instated
 */
export const openQuotaModalAtom = atom(false);
export const rightSidebarWidthAtom = atom(320);

export const openImportModalAtom = atom(false);

export type AuthAtomData =
  | { state: 'signIn' }
  | {
      state: 'afterSignUpSendEmail';
      email: string;
    }
  | {
      state: 'afterSignInSendEmail';
      email: string;
    }
  | {
      state: 'signInWithPassword';
      email: string;
    }
  | {
      state: 'sendEmail';
      email: string;
      emailType:
        | 'setPassword'
        | 'changePassword'
        | 'changeEmail'
        | 'verifyEmail';
    };

export const authAtom = atom<
  AuthAtomData & {
    openModal: boolean;
  }
>({
  openModal: false,
  state: 'signIn',
});

export type AllPageFilterOption = 'docs' | 'collections' | 'tags';
export const allPageFilterSelectAtom = atom<AllPageFilterOption>('docs');

export const openWorkspaceListModalAtom = atom(false);
