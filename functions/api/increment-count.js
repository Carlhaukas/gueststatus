// functions/api/increment-count.js

/**
 * Handles POST requests to increment the QR code generation counter.
 * Assumes a KV binding named WIFI_COUNTER_KV is configured in Cloudflare Pages settings.
 */
export async function onRequestPost(context) {
    // context contains request, env, params, waitUntil, next, data
    const kvNamespace = context.env.WIFI_COUNTER_KV;
    const countKey = 'qr_generation_count'; // The key we use in KV to store the count

    if (!kvNamespace) {
        console.error("KV Namespace 'WIFI_COUNTER_KV' is not bound.");
        return new Response('Server configuration error: KV Namespace not bound.', { status: 500 });
    }

    try {
        // Get the current count. Returns null if the key doesn't exist.
        // Using { cacheTtl: 60 } can reduce reads if increments aren't super frequent,
        // but for accuracy on every hit, omit it or set to 0. Let's keep it accurate.
        let currentCountStr = await kvNamespace.get(countKey);
        let currentCount = parseInt(currentCountStr, 10);

        // If the key doesn't exist or value is not a number, start at 0
        if (isNaN(currentCount)) {
            currentCount = 0;
        }

        // Increment the count
        const newCount = currentCount + 1;

        // Store the new count back into KV.
        // context.waitUntil() allows the function to return a response faster
        // while ensuring the KV write completes in the background.
        context.waitUntil(kvNamespace.put(countKey, newCount.toString()));

        // Return a simple success response. 204 No Content is appropriate
        // as we don't need to send any data back to the client.
        return new Response(null, { status: 204 });

    } catch (error) {
        console.error(`KV Error: ${error.message}`);
        // Log the error but potentially still return success to the user?
        // Or return a server error status. Let's return an error status.
        return new Response('Failed to update counter due to server error.', { status: 500 });
    }
}

/**
 * Optional: Handle other HTTP methods if needed, or Cloudflare Pages will
 * automatically return a 405 Method Not Allowed response.
 * We only care about POST for incrementing.
 */
// export async function onRequestGet(context) {
//   return new Response('Method Not Allowed', { status: 405 });
// }