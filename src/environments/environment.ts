export const environment = {
  production: false,
  auth0: {
    domain: 'dev-skrc3oude0nhleqs.us.auth0.com',
    clientId: '6XEiW5SoTUaBmWQjqXC6xmJhvjp6PqJW',
    authorizationParams: {
      redirect_uri: window.location.origin
    },
    httpInterceptor: {
      allowedList: [
        '/api/*',
      ],
    },
  },
};

