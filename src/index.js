const plaid = require('plaid');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const path = require("path");
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const app = express();

dotenv.config();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = "sandbox";
const PLAID_REDIRECT_URI = '';
const PLAID_ANDROID_PACKAGE_NAME = '';
const PLAID_PRODUCTS = ['transactions']
const PLAID_COUNTRY_CODES = ['US']
// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;


const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
        'PLAID-SECRET': PLAID_SECRET,
        'Plaid-Version': '2020-09-14',

      },
    },
  });

const client = new PlaidApi(configuration);

app.use(bodyParser.urlencoded({ extended: false, }));
app.get('/', (req,res) => {

    res.sendFile(path.join(__dirname, 'index.html'))
});

function handleError(errorMessage) {
    console.error(errorMessage);
}

// Create a link token with configs which we can then use to initialize Plaid Link client-side.
// See https://plaid.com/docs/#create-link-token
app.post('/api/create_link_token', function (request, response, next) {
    Promise.resolve()
      .then(async function () {
        const configs = {
          user: {
            // This should correspond to a unique id for the current user.
            client_user_id: 'user-good',
          },
          client_name: 'Plaid Quickstart',
          products: PLAID_PRODUCTS,
          country_codes: PLAID_COUNTRY_CODES,
          language: 'en',
        };
  
        if (PLAID_REDIRECT_URI !== '') {
          configs.redirect_uri = PLAID_REDIRECT_URI;
        }
  
        if (PLAID_ANDROID_PACKAGE_NAME !== '') {
          configs.android_package_name = PLAID_ANDROID_PACKAGE_NAME;
        }
        const createTokenResponse = await client.linkTokenCreate(configs);
        response.json(createTokenResponse.data);
      })
      .catch(next);
  });

// Exchange token flow - exchange a Link public_token for
// an API access_token
// https://plaid.com/docs/#exchange-token-flow
app.post('/api/set_access_token', async function (request, response, next) {
    PUBLIC_TOKEN = request.body.public_token;
    console.log(request);
    Promise.resolve()
      .then(async function () {
        const tokenResponse = await client.itemPublicTokenExchange({
          public_token: PUBLIC_TOKEN,
        });
        ACCESS_TOKEN = tokenResponse.data.access_token;
        //ITEM_ID = tokenResponse.data.item_id;
        if (PLAID_PRODUCTS.includes('transfer')) {
          TRANSFER_ID = await authorizeAndCreateTransfer(ACCESS_TOKEN);
        }
        response.json({
          access_token: ACCESS_TOKEN,
        //  item_id: ITEM_ID,
          error: null,
        });

      })
      .catch(next);
  });

  // Create link token 
  app.post('/link/token/create', async function (request, response) {
    // Get the client_user_id by searching for the current user
    const user = await User.find(...);
    const clientUserId = user.id;
    const request = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: clientUserId,
      },
      client_name: 'Plaid Test App',
      products: ['auth'],
      language: 'en',
      webhook: 'https://webhook.example.com',
      redirect_uri: 'https://domainname.com/oauth-page.html',
      country_codes: ['US'],
    };
    try {
      const createTokenResponse = await client.linkTokenCreate(request);
      response.json(createTokenResponse.data);
    } catch (error) {
      // handle error
    }
  });

 


app.listen(3000, () => console.log("Server started. Listening at 3000"));


