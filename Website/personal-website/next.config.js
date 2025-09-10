/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Common domains for YouTube thumbnails, channel images, and Google profile pictures
    domains: [
      'i.ytimg.com',
      'i1.ytimg.com',
      'i2.ytimg.com',
      'i3.ytimg.com',
      'yt3.ggpht.com',
      'ytimg.com',
      'img.youtube.com',
      'lh3.googleusercontent.com',
    ],
  },
};

module.exports = nextConfig;

