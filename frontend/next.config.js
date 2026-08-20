/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://reachinbox-backend.onrender.com';
        const cleanBackendUrl = backendUrl.replace(/\/+$/, '').replace(/\/api$/, '');
        return [
            {
                source: '/api/:path*',
                destination: `${cleanBackendUrl}/api/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
