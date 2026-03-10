export async function api(url, opts) {
  const res = await fetch(url, {
    credentials: 'include', // Send cookies with all requests
    ...opts,
  });
  return await res.json();
}
