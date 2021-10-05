# GraduateNU - Backend
 test

An automatic plan builder utilizing your current degree audit information to help you graduate.

Api Documentation: https://sandboxnu.github.io/graduatenu/

Dependencies:

- Node.js

To run:

- Download your degree audit from the Northeastern MyPAWS degree audit system. Do this by clicking the 'printer-friendly' mode, then right-clicking the page and/or using a command line tool of your choice to obtain the degree audit file. Ensure that the file name is 'Web\ Audit.html' and that it is located in this repository's file system.
- Execute the command `node html_parser.js`
- Execute `node json_parser.js`

After this, an organized JSON file with information regarding your current degree trajectory should be present in the produced `schedule.json` file.

In the future, this functionality will comprise a portion of the backend of a web application designed to facilitate the simple creation of schedules via a degree audit and/or supplemental information provided by the end user.

### parse_audit.js

Expects a "Web Audit.html" degree audit, downloaded directly from the Northeastern website.
Produces a schedule in JSON format.

### parser.js

Expects a sampleData.json file in the JSON object format specified in the parser_funcs.js file.
Produces a schedule.json file, with classes sorted by time taken (season, year).

# GraduateNU - Frontend

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
