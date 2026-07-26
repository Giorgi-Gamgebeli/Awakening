import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";

SuperTokens.init({
  appInfo: {
    appName: import.meta.env.VITE_APP_NAME,
    apiDomain: import.meta.env.VITE_SERVER_BASE_URL,
    websiteDomain: window.location.origin,
    apiBasePath: import.meta.env.VITE_AUTH_BASE_PATH,
  },
  recipeList: [EmailPassword.init(), Session.init()],
});
