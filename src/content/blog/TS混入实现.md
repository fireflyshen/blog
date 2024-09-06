---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: TS混入实现及其思路
slug: tsmixin
featured: false
draft: false
tags:
  - JS
  - Mixin
description: " "
---

## 混入

混入是一种类的构造方式，允许一个类使用多个类的行为，而不需要使用继承的方式。使用混入可以让类在不继承的情况拓展某些功能，并且可以变相的实现多继承的形式，其实混入的本质上还是通过继承来实现的，所谓实现多继承，实际上也是变相的使用单继承的方式实现的

## 混入的实现思路

所谓的混入，本质上就是一个函数，提供一个类，放入函数中然后函数返回一个类，这个类是已经实现了拓展功能的类。剩下的实际上就是一些限制，比如你要穿入的类必须有什么结构，等等。

## 具体实现

1. 依照思路，创建一个函数

```ts
function mixin(Class) {
  return class {};
}
```

上面的代码会出现错误，没关系，一点一点实现，主要是思路

2. 要对这个函数进行限制，也就是说要限制提供的参数必须是一个类，代码如下

```ts
type Constructor = new (args: any[]) => {};

function mixin<C extends Constructor>(Class: C) {
  return class {};
}
```

这一步的操作主要就是限制，提供的参数`Class`必须是一个类，这里实现的思路是定义`Constructor`类型，这个类型具体是`new (args: any[]) => {}`,`new()`表示构造器，`...args:any[]`表示这个构造器可以接受具体的任意类型，任意个数的参数，这个构造器返回的是一个空对象，这里不要被Java之类的语言影响，觉得构造器没有返回值，实际上是有的，构造器只是没有函数的返回值签名，想象调用函数的时候`const a = new ConstructorFunction`,这里就是使用`new`关键字调用函数，返回了一个`a`吧，总而言之，这里就是使用定义了一个类型，这个类型要求是构造器，同时构造器返回一个对象，因为只有类可以提供构造器，所以这里限制的就是你必须类型就是一个类

然后是下面的`function mixin<C extends Constructor>(Class:C)`,这里的C就是就是类型，这个C类型使用了泛型这该泛型做出了要求，`extends Constructor` 也就是说你穿入的类必须是Constructor的子类，而`Constructor`又是一个构造器，只有类有构造器，也就是说这个泛型参数你必须传入一个类，这里就对传入的参数进行了限制

3. 对返回值进行修改，要返回的类继承传入的类，实现混入的核心

```ts
type Constructor = new (...args: any[]) => {};

function mixin<C extends Constructor>(Class: C) {
  return class extends Class {
    constructor(...args: any[]) {
      super(...args);
    }
  };
}
```

上面对返回值进行了继承，这样返回的类就可以包含你传入的类的功能，实际上到这里基础的混入功能就已经实现，核心其实就是传入一个类，返回一个新的类

```ts
type Constructor = new (...args: any[]) => {};

function mixin<C extends Constructor>(Class: C) {
  return class extends Class {
    constructor(...args: any[]) {
      super(...args);
    }

    sayHello() {
      console.log("hello,yes");
    }
  };
}

class User {
  constructor(
    public userId: string,
    public name: string
  ) {}
}

const HelloUser = mixin(User);

const helloUser = new HelloUser("id", "name");

helloUser.sayHello();
```

上面的代码就对所有的User类的对象上混入了一个`sayHello`函数

## 完善

上面的代码只是一个基础的混入实现，实际上是有很多问题，比如混入的返回的类，是无法访问传入类的任何属性的，因为TS的主要看的是结构，构造器的类型是 ` new (...args: any[]) => {}` 返回的是一个空对象，空对象里面啥都没有，他对传入的结构就是一个空对象，里面没有任何属性，用`{}`访问`name`肯定是会爆出错误的，所以这里需要对他进行完善；

### 完善思路

这里`type`就不能返回空对象了，返回什么类型不知道这个时候就可以使用泛型
`type Constructor<T> = new (...args: any[]) => T`
这个泛型就是要穿入的类的结构，说的简单些进行双重约束，`type`本身约束传入的参数必须是一个类，泛型则用来约束传入的类必须要具备哪些结构，这里其实可以提供一个默认值，就是一个空对象就行如下

```ts
type Constructor<T = {}> = new (...args: any[]) => T`
```

然后修改下面的代码

```ts
type Constructor<T = {}> = new (...args: any[]) => T;

function mixin<
  C extends Constructor<{
    userId: string;
    name: string;
  }>,
>(Class: C) {
  return class extends Class {
    constructor(...args: any[]) {
      super(...args);
    }

    sayHello() {
      console.log("hello,", this.name, this.userId);
    }
  };
}

class User {
  constructor(
    public userId: string,
    public name: string
  ) {}
}

const HelloUser = mixin(User);

const helloUser = new HelloUser("idhello", "namehello");

helloUser.sayHello();
```

上面的泛型传入了如下代码

```ts
function mixin<
  C extends Constructor<{
    userId: string;
    name: string;
  }>
```

使用了泛型约束了传入的类必须具备两个属性`userId,name`，这样就可以在下面的具体需要混入的函数中使用`this`访问这些属性了

```ts
console.log("hello,", this.name, this.userId);
```

以上就是TS混入的一个相对完整的实现，如果需要混入很多类，那通用模板复制多个函数穿入不同的类即可；就是调用多个函数
