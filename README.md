<div align="center">
<h1>KangoJS</h1>
<p>A typescript express framework to make writing apps quicker and easier.</p>

<div>
  <a href="https://www.npmjs.com/package/@kangojs/core" target="_blank">
    <img src="https://img.shields.io/npm/v/@kangojs/core?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://choosealicense.com/licenses/mit/" target="_blank">
    <img src="https://img.shields.io/npm/l/@kangojs/core?style=flat-square" alt="MIT License" />
  </a>
  <a href="https://lerna.js.org/" target="_blank">
    <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff?style=flat-square" alt="Maintained with Lerna" />
  </a>
</div>
</div>

---

**⚠️ Project Unmaintained️ ⚠️**  
This project is not currently being maintained.  
One of the primary goals of KangoJS was for me to experiment with dependency injection, decorators, publishing NPM packages etc and I've now done all these things.  
I'm currently of the view that further work on this project is not worth the time when better alternatives exist like [NestJS](https://nestjs.com/). I've learnt how the wheel can be made, there's no point continuing to re-invent it!

I may come back to this project in the future or just fully unpublish the NPM modules and move/repurpose this GH org, I've not decided yet.

---

## 🤔 About
KangoJS was created because I was finding myself copying and pasting the same core functionality across a number of Express projects and I wanted
a better way to manage this.  
I looked into a number of existing solutions such as [NestJS](https://nestjs.com/) and [OvernightJS](https://github.com/seanpmaxwell/overnight) but in the end
I decided to build my own as it's a good learning opportunity for me, and I can make it function exactly how I want.

## 💥 Features
- Declare routes by adding decorators to classes.
- Concepts such as route authentication and request validation are built in.
- Approach agnostic request logic. You are responsible for registering request validation & route authentication
  functions yourself which gives you the freedom to use any implementation you wish.
- Extend the core framework with additional optional packages. See [other KangoJS packages](#-other-kangojs-packages) for details.

## 🚀 Getting Started
Install the npm package:
```shell
npm install @kangojs/core
```

To use decorators in typescript you will have to add the following settings to your `tsconfig.json` file:
```json
"emitDecoratorMetadata": true,
"experimentalDecorators": true,
```

**⚠️ Express is a peer dependency:** As KangoJS primarily acts as a wrapper around Express, Express is kept as a peer dependency
so you can manage and update it yourself independent of KangoJS.

## 👷 Usage
To use KangoJS you can bootstrap it with your Express app like so:
```ts
import express from 'express';
import { KangoJS } from '@kangojs/core';
import { join } from 'fs';

const app = express();

const kangoJS = new KangoJS({
  controllerFilesGlob: join(__dirname, 'src/modules/**/*.controller.{ts,js}'),
  globalPrefix: "/api/v1",
});
await kangoJS.boostrap(app);
```

**⚠️ IMPORTANT NOTE:** You must end `controllerFilesGlob` with `.{ts,js}` to ensure that KangoJS works 
both when running your app with ts-node and after you've compiled it to JS. See issue [#2](https://github.com/kangojs/kangojs/issues/2) for details.

### Options

The following options are available when instantiating `KangoJS`:

| Property              | Type                                                                                     | Description                                                                                                                                      | Example                                                                                                                                          |
|-----------------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| `controllerFilesGlob` | `string`                                                                                 | A [glob pattern](https://github.com/isaacs/node-glob#glob-primer) relative to the project root that tells KangoJS where to look for controllers. | `"src/modules/*.controller.ts"`                                                                                                                  |
| `globalPrefix`        | `string`                                                                                 | An optional string that will prefix all routes that KangoJS generates.                                                                           | `"/api/v1"`                                                                                                                                      |
| `authValidator`       | `(req: Request, res: Response, next: NextFunction) => any`                      | An optional middleware function that will be used when a route requires authentication.                                                          | COMING SOON                                                                                                                                      |
| `bodyValidator`       | `(shape: any) => (req: Request, res: Response, next: NextFunction) => any`  | An optional function that will be used for request body validation if you add the `bodyShape` property to a route.                               | An example implementation can be found in [`@kangojs/class-validation`](https://github.com/kangojs/kangojs/tree/main/packages/class-validation). |
| `queryValidator`      | `(shape: any) => (req: Request, res: Response, next: NextFunction) => any` | An optional function that will be used for query parameter validation if you add the `queryShape` property to a route.                             | An example implementation can be found in [`@kangojs/class-validation`](https://github.com/kangojs/kangojs/tree/main/packages/class-validation). |
| `paramsValidator`      | `(shape: any) => (req: Request, res: Response, next: NextFunction) => any` | An optional function that will be used for URL parameter validation if you add the `paramsShape` property to a route.                             | An example implementation can be found in [`@kangojs/class-validation`](https://github.com/kangojs/kangojs/tree/main/packages/class-validation). |


### Project Structure Assumptions
KangoJS has been designed with the assumption that your app will be split into separate modules/components
where each module/component has its own controller for handling Express routing.  
This is based on the [module structure of NestJS](https://docs.nestjs.com/modules) and the generally agreed upon [best practise of Node.js app structure](https://github.com/goldbergyoni/nodebestpractices#1-project-structure-practices)
where applications encapsulate functionality into separate modules/components and use layers such as controllers and services to separate business logic from web request logic.

That being said, the only hard assumption KangoJS enforces is the use of controllers that have routes defined as decorated methods.

### Controllers
Controllers are classes that encapsulate Express request & response logic. KangoJS attempts to load controllers from all files
that match the `controllerFilesGlob` passed in the options.  
You mark a class as a controller with the `@Controller` decorator and pass what path the controller will manage, for example:

```typescript
import { Controller } from '@kangojs/core';

@Controller('/users')
class UserController {
  // add route methods here...
}

export default UserController;
```

**IMPORTANT NOTE:** Controller classes must be set as the default export of the file!

### Routing
Routes are added to controllers by adding the `@Route` decorator to methods. For example:

```typescript
import { Controller, Route, HTTPMethods } from '@kangojs/core';
import { Request, Response, NextFunction } from 'express';

@Controller('/users')
class UserController {
  @Route({
    httpMethod: HTTPMethods.GET,
  })
  async getAll(req: Request, res: Response, next: NextFunction) {
    return res.send('You have just attempted to fetch all users via /users [GET].');
  }

  @Route({
    path: '/:id',
    httpMethod: HTTPMethods.GET,
  })
  async get(req: Request, res: Response, next: NextFunction) {
    return res.send(`You have just attempted to fetch user ${req.params.id} via /users/:id [GET].`);
  }

  @Route({
    httpMethod: HTTPMethods.POST,
  })
  async add(req: Request, res: Response, next: NextFunction) {
    return res.send(`You have just attempted to add a new user via /users [POST].`);
  }
}

export default UserController;
```

The following options are available for the `@Route` decorator:

| Property       | Type                                  | Description                                                                                                                                                                         |
|----------------|---------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `path`         | `string`                              | An optional string to add to the end of the controllers main path.                                                                                                                  |
| `httpMethod`   | one of the `HTTPMethods` enum values. | Defines what HTTP method the route uses.                                                                                                                                            |
| `requiresAuth` | `boolean`                             | Defines if the route requires authentication (requires the `authValidator` to be set). **For safety you must explicitly set `requiresAuth:false` to disable route authentication.** |
| `bodyShape`    | `any`                                 | An optional property where you can pass what shape you expect the request body to have (requires the `bodyValidator` function to be set).                                           |
| `queryShape`   | `any`                                 | An optional property where you can pass what shape you expect the request query to have (requires the `queryValidator` function to be set).                                         |
| `paramsShape`   | `any`                                 | An optional property where you can pass what shape you expect the request URL parameters to have (requires the `paramsValidator` function to be set).                                         |

## 📚 Documentation
Additional documentation for the project can be found [here](https://github.com/kangojs/kangojs/tree/main/docs).

## 🧰 Other KangoJS Packages
`@kangojs/core` ([npm](https://www.npmjs.com/package/@kangojs/core), [codebase](https://github.com/kangojs/kangojs/tree/main/packages/kangojs)) is the core package that provides the base functionality for managing controllers and routes.

There are also a number of other KangoJS packages available that offer additional functionality:

| Package                      | Description                                                                                                                                                                                                | NPM Link                                                        | Codebase Link                                                                       |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `@kangojs/class-validation`  | Validate and transform request data using classes with class-transformer and class-validator.                                                                                                              | [npm](https://www.npmjs.com/package/@kangojs/class-validation)  | [codebase](https://github.com/kangojs/kangojs/tree/main/packages/class-validation)  |
| `@kangojs/common-middleware` | Quickly include common Express middleware. Includes `express.json()`, `express.urlencoded()`, [cors](https://www.npmjs.com/package/cors) and [cookie-parser](https://www.npmjs.com/package/cookie-parser). | [npm](https://www.npmjs.com/package/@kangojs/common-middleware) | [codebase](https://github.com/kangojs/kangojs/tree/main/packages/common-middleware) |
| `@kangojs/http-status-codes` | Provides a simple enum for HTTP status codes.                                                                                                                                                              | [npm](https://www.npmjs.com/package/@kangojs/http-status-codes) | [codebase](https://github.com/kangojs/kangojs/tree/main/packages/http-status-codes) |
| `@kangojs/serve-spa`         | Serve single page applications such as React from your Express app.                                                                                                                                        | [npm](https://www.npmjs.com/package/@kangojs/serve-spa)         | [codebase](https://github.com/kangojs/kangojs/tree/main/packages/serve-spa)         |
| `@kangojs/error-handler`     | An error handler for Express.                                                                                                                                                                              | [npm](https://www.npmjs.com/package/@kangojs/error-handler)     | [codebase](https://github.com/kangojs/kangojs/tree/main/packages/error-handler)     |

## 💬 Feedback & Contributions
I'm open to feedback and contributions. Feel free to [raise an issue or suggest improvements and features](https://github.com/kangojs/kangojs).

## 📝 License
This project is licensed under the terms of the [MIT license](https://choosealicense.com/licenses/mit/).
