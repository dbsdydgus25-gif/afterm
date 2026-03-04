import { redirect } from 'next/navigation';

export default function OpenRedirectPage({
    searchParams,
}: {
    searchParams: { uid?: string };
}) {
    if (searchParams.uid) {
        redirect(`/guardians/open?uid=${searchParams.uid}`);
    } else {
        redirect('/');
    }
}
