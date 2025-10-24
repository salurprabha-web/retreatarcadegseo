// api/video-proxy.ts

export const config = {
  runtime: 'edge', // Use edge runtime for better performance/streaming
};

export default async function handler(request: Request) {
    const { searchParams } = new URL(request.url);
    const downloadLink = searchParams.get('url');
    const apiKey = process.env.API_KEY;

    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }

    if (!downloadLink) {
        return new Response('Missing URL parameter', { status: 400 });
    }
    
    if (!apiKey) {
        return new Response('Server configuration error: API key not found.', { status: 500 });
    }

    try {
        const fullUrl = `${downloadLink}&key=${apiKey}`;
        
        // Fetch the video from Google's URI
        const videoResponse = await fetch(fullUrl);

        if (!videoResponse.ok) {
            // Forward the error from Google's service
            const errorText = await videoResponse.text();
            return new Response(`Failed to fetch video: ${errorText}`, { status: videoResponse.status });
        }
        
        // Stream the video back to the client
        const { body, headers } = videoResponse;
        
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', headers.get('Content-Type') || 'video/mp4');
        responseHeaders.set('Content-Length', headers.get('Content-Length') || '');

        return new Response(body, {
            status: 200,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error('Error in video proxy:', error);
        return new Response('Internal server error while fetching video.', { status: 500 });
    }
}
