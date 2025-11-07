export const environment = {
  production: true,
  auth0: {
    domain: 'dev-skrc3oude0nhleqs.us.auth0.com',
    clientId: '6XEiW5SoTUaBmWQjqXC6xmJhvjp6PqJW',
    authorizationParams: {
      redirect_uri: 'https://quinnjr.dev',
    },
    httpInterceptor: {
      allowedList: [
        'https://quinnjr.dev/api/*'
      ],
    },
  },
};

