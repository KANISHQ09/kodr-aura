/**
 * Redis Connection Utility
 * Purpose: Convert Redis URLs into connection options shared by Redis and BullMQ.
 */
export const parseRedisUrl = (redisUrl) => {
    const url = new URL(redisUrl);
    const options = {
        host: url.hostname,
        port: Number(url.port || 6379),
        maxRetriesPerRequest: null,
    };

    if (url.password) options.password = decodeURIComponent(url.password);
    if (url.username) options.username = decodeURIComponent(url.username);
    if (url.protocol === 'rediss:') options.tls = {};
    if (url.pathname && url.pathname !== '/') {
        options.db = Number(url.pathname.replace('/', ''));
    }

    return options;
};
