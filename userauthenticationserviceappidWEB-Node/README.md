# AppID sample Web application
1. Before you begin, make sure that Cloud Foundry CLI is installed.
   <br />For more information visit: http://docs.cloudfoundry.org/cf-cli/install-go-cli.html.

2. Extract the zip file and open a terminal at the folder location.

3. Package content:

    Note: This application will not work locally. Push it to IBM Cloud to run the sample.

    ```app.js```  Uses Express to set the routes and views.

	```views/index.html```  The application landing page. Click **Login** to start.

	```routes/protecteted```  After clicking the **Login** button, the user is redirected here. This is where
	we check whether the user is authorized or not. In  the case where the user is not authorized, we send a request to the
	authentication server to start the OAuth flow. If the user is authorized, we show the protected data.

	```routes/token```  This page shows the access and id token payload.


4. Connect to IBM Bluemix.
    <br />```cf api https://api.ng.bluemix.net```

5. Log in to Bluemix.
    <br />```cf login -o Cryptoment -s Cryptoment_US_South```

6. Deploy the sample application to Bluemix.
   <br />```cf push```

7. Open your IBM Cloud app route in the browser.

8. This sample runs on one instance and uses the session to store the authorization data.
   <br />In order to run it in production mode, use services such as Redis to store the relevant data.
