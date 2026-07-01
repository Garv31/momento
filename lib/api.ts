export async function fetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Something went wrong');
  }

  return res.json();
}
