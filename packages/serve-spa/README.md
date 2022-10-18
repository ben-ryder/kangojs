<div align="center">
<h1>@kangojs/serve-spa</h1>
<p>Serve single page applications from your Express app.</p>

<div>
  <a href="https://www.npmjs.com/package/@kangojs/serve-spa" target="_blank">
    <img src="https://img.shields.io/npm/v/@kangojs/serve-spa?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://choosealicense.com/licenses/mit/" target="_blank">
    <img src="https://img.shields.io/npm/l/@kangojs/serve-spa?style=flat-square" alt="MIT License" />
  </a>
</div>
</div>

---

**⚠️ Package Unmaintained️**: This package is not currently being maintained, for more information [check the Github](https://github.com/kangojs/kangojs).

---

## 🤔 About
Serve single page applications such as React from your Express app.  
Simply import the package and point it at your apps build directory and Express will start serving it.

## 💥 Features
- Easy to use and setup. Simply pass your Express app to `useServeSPA` with some basic options.
- Customisable so you can choose how you want to serve your app.

## 🚀 Getting Started
Install the npm package:
```shell
npm install @kangojs/serve-spa
```

## 👷 Usage
You can use the `useServeSPA` function to set up single page app serving:

```typescript
import { useServeSPA } from '@kangojs/serve-spa';

const options = {
    folderPath: "../frontend/build/"
}

useServeSPA(app, options)
```

If your app's build files can't be found then an error message will be returned instead. The default is as follows:

```
There has been an unexpected error loading this page. Please try again later.
```

You can customise the functionality of `useServeSPA` by passing in options:

| Option | Type | Description |
| --- | --- | --- |
| `folderPath` | `string` | The folder path to the SPA build folder |
| `serveFile` | `string` | The file that will be served from the build folder. By default this is `index.html` |
| `baseRoute` | `string` | The Express route the app will be served from. Defaults to `/` |
| `fallbackMessage` | `string` | The error message returned if the SPA can't be loaded |
| `errorHandler` | `(err: any, res?: Response) => Promise<void>` | Fully overwrite the default error handling if the SPA can't be loaded  |

**Express Routing Priority**   
The order in which you set up middleware and route handlers can affect what Express will use for the given route.
The default behaviour of `useServeSPA` is to serve the app for all GET requests which could interfere with other routing.  
It's therefore advised to call `useServeSPA` after you define your other routes. Alternatively you can use the `baseRoute`
option if you want to serve the app on a specific route only.

## 🧰 Other KangoJS Packages
For all available KangoJS packages [check out this list](https://github.com/kangojs/kangojs#-other-kangojs-packages).

## 💬 Feedback & Contributions
I'm open to feedback and contributions. Feel free to [raise an issue or suggest improvements and features](https://github.com/kangojs/kangojs/issues).

## 📝 License
This project is licensed under the terms of the [MIT license](https://choosealicense.com/licenses/mit/).
