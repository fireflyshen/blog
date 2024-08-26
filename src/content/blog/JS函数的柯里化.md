---
author: firefly
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2023-12-21T09:12:47.400Z
title: JS函数的柯里化
slug: function-curry
featured: false
draft: false
tags:
  - JS
description: ""
---

## 柯里化

柯里化主要是函数式编程引入一个概念，把一个接受多个参数的函数抓换成**一系列**只接受一个参数的函数。比如说如下代码

```js
function fn(a, b, c) {
  return a + b;
}
```

当上述代码调用的时候是`fn(1,2)`，返回一个结果`3`,如果对上述函数使用柯里化之后，那么就是`fn(1)(2)`同样也可以返回一个结果3。

👇下面就简单的对这个函数进行柯里化

### 柯里化的简单实现

假设有这样一个函数`curry`传入一个函数之后这个函数会返回一个函数，这个函数接受一个参数，供我们进行继续调用，那么就可以写出一个基础的框架

```js
function curry(fn) {
  return function (arg1) {};
}
```

因为被柯里化的函数有两个参数，因此在返回的函数内部又要返回一个函数，因此可以写成如下

```js
function curry(fn) {
  return function (arg1) {
    return function (arg2) {};
  };
}
```

之后就很简单了直接调用传入的函数即可

```js
function curry(fn) {
  return function (arg1) {
    return function (arg2) {
      return fn(arg1, arg2);
    };
  };
}
```

👆如上就实现了一个非常简单的函数的柯里化，调用函数

```js
var curriedFunc = curry(fn);

var sum = curriedFunc(1)(2);

console.info(sum); // 3
```

### 高级柯里化

实际上函数的参数是非常复杂的，有的时候不固定，这个时候就需要使用高级柯里化的技术，可以使用第三方的库，比如`lodash`,`lodash`这个库中有一个`_.curry(func)`这个函数，穿入一个函数会返回一个被柯里化的函数。另外这个函数非常的灵活，还是如上的求和求和函数，如果使用`lodash`代码如下👇

```js
// 引入lodash

var curriedFunc = _.curry(fn);

curriedFunc(1, 2); // 3
curriedFunc(1)(2); // 3
```

如上，`lodash`提供的函数可以选择柯里化，也可以选择不柯里化，非常的灵活，

### 高级柯里化的手动实现

高级柯里化的实现并不复杂，思路如下👇

首先，还是要定义一个函数，这个函数返回一个函数,只不过这个函数的参数不固定了，因此需要使用JS的不定参数

```js
function curry(fn) {
  return function (...args) {};
}
```

之后要做的事情其实就是判断这个函数是怎么调用，它是 `fn(1,2)`这么调用的，还是`fn(1)(2)`这么调用的。这里只需要传入这个函数`fn`的参数的个数是否`>=`返回的这个函数的参数参数的个数，如果满足条件，那么就可以直接调用，说明要么它就是直接诶一股脑把参数传完了，要么就是柯里化完毕。参数一个一个的都传递完成了，因此代码可以更新如下

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
  };
}
```

如果不满足这个条件，就说明进行了柯里化，并且参数没有传递完毕，比如这种情况`fn(1)`，还第二个参数没有传递，出现这种状况，就说明返回值就不能是明确的结果，而是一个函数，那么就是接着返回一个函数（因为这种情况需要一个函数么），这个函数调用当前函数进行新一轮的判断即可（本质上就是个递归，递归终结的条件根据函数的长度而定），因此代码可以迭代成如下

```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function (args2) {
        return curried.apply(this, args.concat(args2));
      };
    }
  };
}
```

以上就实现了函数高级柯里化。

### 柯里化的实际价值

假如有一个计算折扣的函数，根据用户的类型，季节，商品计算综合折扣，代码如下👇

```js
const UserType = Object.freeze({
  VIP: "VIP",
  REGULAR: "REGULAR",
});

const Season = Object.freeze({
  SUMMER: "SUMMER",
  WINTER: "WINTER",
});

const ItemType = Object.freeze({
  ELECTRONICS: "ELECTRONICS",
  CLOTHING: "CLOTHING",
});

function calculateDiscount(basePrice, userType, season, item) {
  let discount = 0;

  switch (userType) {
    case UserType.VIP:
      discount += 0.1;
      break;
    case UserType.REGULAR:
      discount += 0.05;
      break;
  }

  switch (season) {
    case Season.SUMMER:
      discount += 0.05;
      break;
    case Season.WINTER:
      discount += 0.1;
      break;
  }

  switch (item) {
    case ItemType.ELECTRONICS:
      discount += 0.02;
      break;
    case ItemType.CLOTHING:
      discount += 0.05;
      break;
  }

  const finalPrice = basePrice * (1 - discount);
  return parseFloat(finalPrice.toFixed(2));
}
```

不使用函数的柯里化，函数的调用是下面这个样子

```js
console.log(calculateDiscount(100, UserType.REGULAR, Season.SUMMER, null));
```

如果针对一些相同的参数那么就要写成如下

```js
console.log(calculateDiscount(100, UserType.REGULAR, Season.SUMMER, null));
console.log(calculateDiscount(100, UserType.REGULAR, Season.WINTER, null));
```

前两个参数是完全重复，这些都是重复的代码，如果使用柯里化那么函数就会被优化了成如下。

```js
// 省略调用柯里化函数的过程，可以使用lodash

var seasonCurried = calculateDiscountCurried(100, UserType.REGULAR);

// 针对不同的季节穿入不同的参数即可
var itemSummer = seasonCurried(Season.SUMMER);
var itemWinter = seasonCurried(Season.WINTER);

console.log(itemSummer(null));
console.log(itemWinter(null));
```

上面的代码体现了柯里化的优势之一，参数复用，`100,UserType.REGULAR`这两个参数被很好的复用了

柯里化的另外一个优势就是延迟执行。
还是上面的代码，如果直接调用。

```js
console.log(calculateDiscount(100, UserType.REGULAR, Season.WINTER, null));
```

那么函数直接就执行了，如果我想在穿入前两个参数之后干点事情，就只能去修改函数的代码。

如果使用柯里化，那么就是如下

```js
var seasonCurried = calculateDiscountCurried(100, UserType.REGULAR);

// 干点事情
// 延迟调用
```

### 参考

[https://zh.javascript.info/currying-partials](https://zh.javascript.info/currying-partials)
