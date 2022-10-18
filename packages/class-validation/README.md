<div align="center">
<h1>@kangojs/class-validation</h1>
<p>Validate and transform request data using classes in KangoJS.</p>

<div>
  <a href="https://www.npmjs.com/package/@kangojs/class-validation" target="_blank">
    <img src="https://img.shields.io/npm/v/@kangojs/class-validation?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://choosealicense.com/licenses/mit/" target="_blank">
    <img src="https://img.shields.io/npm/l/@kangojs/class-validation?style=flat-square" alt="MIT License" />
  </a>
</div>
</div>

---

**⚠️ Package Unmaintained️**: This package is not currently being maintained, for more information [check the Github](https://github.com/kangojs/kangojs).

---

## 🤔 About
Easily transform and validate Express request data using classes with [class-transformer](https://www.npmjs.com/package/class-transformer) and  [class-validator](https://www.npmjs.com/package/class-validator).

This package has been built specifically for use with [KangoJS](https://github.com/kangojs/kangojs).
While you could potentially use this package without KangoJS, it isn't 'officially' supported at this time.

## 💥 Features
- Quickly integrate with KangoJS's validation system. Focus on writing project code not sorting request validation logic.
- Incoming request data is automatically transformed and attached to the Express `req` object.
- Use on request body data, query parameters and URL parameters.

## 🚀 Getting Started
Install the npm package:
```shell
npm install @kangojs/class-validation
```

**Peer Dependencies:**  
`@kangojs/class-validation` is primarily just a wrapper around [class-transformer](https://www.npmjs.com/package/class-transformer) and [class-validator](https://www.npmjs.com/package/class-validator)
so you must install these two peer dependencies yourself in order to use this package.

## 👷 Usage
As `@kangojs/class-validation` has been built specifically for use with KangoJS it's pretty much just a case of dropping it in.  

### Setup Validation Middleware
When setting up KangoJS you can simply add `ClassValidator` to the validator options you require:

```typescript
import express from 'express';
import { KangoJS } from '@kangojs/core';
import { ClassValidator } from "@kangojs/class-validation";

const app = express();

const kangoJS = new KangoJS({
    controllerFilesGlob: "src/modules/*.controller.ts",
    globalPrefix: "/api/v1",
    bodyValidator: ClassValidator,
    queryValidator: ClassValidator,
    paramsValidator: ClassValidator,
    webSocketDataValidator: ClassValidator,
});
await kangoJS.boostrap(app);
```

You can also customise the options for class-transformer and class-validator like so:
- TODO: feature doesn't have good DX with KangoJS v2


### Add Request Validation
Create a class DTO using class-validator. For example:

```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDTO {
    @IsEmail()
    email: string;
    
    @IsString()
    username: string;

    @IsString()
    @MinLength(12)
    password: string;
}
```

Add your DTO to the [`@Route`](https://github.com/kangojs/kangojs#routing) decorator provided by KangoJS:

```typescript
import { Request, Response, NextFunction } from 'express';
import { Controller, Route, HTTPMethods } from '@kangojs/core';
import { RequestWithDto } from '@kangojs/class-validation';
import { UserAddDTO } from './user-add.dto';

@Controller('/users')
export class UserController {
    @Route({
        httpMethod: HTTPMethods.POST,
        bodyShape: UserAddDTO
    })
    async addUser(req: RequestWithDto, res: Response, next: NextFunction) {
        const userAddDto = <UserAddDTO> req.bodyDto;
        
        return res.send('You have just attempted add a user via /users [POST].');
    }
}
```

This process is exactly the same for query parameters and URL parameters except you use the
`queryShape` route option and `req.queryDto` or `paramsShape` and `req.paramsDto` to access
the transformed data instead.

### Default Behaviour
This package has sensible defaults for validation options and error handling.

#### Validation
The default options for class-validator are as follows:

```typescript
{
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: {
        target: false
    }
}
```

#### Error Handling
When validation fails the default behaviour is to return a `400` response with the following body data:

```json
{
    "statusCode": 400,
    "message": "The supplied body data did not pass validation.",
    "reason": "first error reason from class-validator if applicable"
}
```

## 🧰 Other KangoJS Packages
For all available KangoJS packages [check out this list](https://github.com/kangojs/kangojs#-other-kangojs-packages).

## 💬 Feedback & Contributions
I'm open to feedback and contributions. Feel free to [raise an issue or suggest improvements and features](https://github.com/kangojs/kangojs/issues).

## 📝 License
This project is licensed under the terms of the [MIT license](https://choosealicense.com/licenses/mit/).
